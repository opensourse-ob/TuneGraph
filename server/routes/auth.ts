import { Router, Request, Response } from 'express';

const router = Router();

// In-memory store for OAuth state values during the auth flow (dev-friendly)
// This mitigates cookie host mismatches (e.g., when initiating via a proxy domain)
const pendingStates = new Set<string>();

// Type definitions for Spotify token responses
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// Spotify OAuth configuration
// Note: Spotify requires 127.0.0.1 instead of localhost for loopback addresses
// See: https://developer.spotify.com/documentation/web-api/concepts/redirect-uri //dead link
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

// Scopes needed for the application
// See: https://developer.spotify.com/documentation/web-api/concepts/scopes
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
];

/*
 * GET /api/auth/config (debug endpoint)
 * Shows the redirect URI being used (for debugging)
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id_configured: !!SPOTIFY_CLIENT_ID,
    client_secret_configured: !!SPOTIFY_CLIENT_SECRET,
    frontend_url: FRONTEND_URL,
  });
  console.log('router.get /config')
});

/* 
* GET/api/auth/status
* Checks if the user has a valid access token
*/
//
router.get('/status', (req: Request, res: Response) => {
  const accessToken = req.cookies?.spotify_access_token;
  res.json({
    authenticated: Boolean(accessToken)
  });

});
/*
 * GET /api/auth/login
 * Initiates the Spotify OAuth flow by redirecting to Spotify's authorization page
 * See: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */
//should the route be handling the response codes?
router.get('/login', (req: Request, res: Response) => {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: 'Spotify Client ID not configured' });
  }

  if (!SPOTIFY_REDIRECT_URI) {
    console.error('SPOTIFY_REDIRECT_URI is not set');
    return res.status(500).json({ error: 'Redirect URI not configured' });
  }

  // Generate state parameter for CSRF protection (strongly recommended by Spotify)
  const state = generateRandomString(16);
  
  // Store state in httpOnly cookie for verification on callback
  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000, // 10 minutes
  });
  // Also store state server-side to avoid host-based cookie issues in dev
  pendingStates.add(state);
  
  const scope = SCOPES.length > 0 ? SCOPES.join(' ') : undefined;

  // Build query parameters according to Spotify API docs
  const params: Record<string, string> = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
  };

  // Add scope only if scopes are defined (optional parameter per Spotify docs)
  if (scope) {
    params.scope = scope;
  }

  // Optional: show_dialog can be set to 'true' to force re-authorization
  // Set to 'false' or omit for automatic redirect if already authorized
  params.show_dialog = 'false';

  // Log the redirect URI for debugging
  console.log('Redirect URI being used:', SPOTIFY_REDIRECT_URI);

  const queryString = new URLSearchParams(params).toString();
  res.redirect(`https://accounts.spotify.com/authorize?${queryString}`);
});

/*
 * GET /api/auth/callback
 * Handles the callback from Spotify after user authorization
 */
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;
  const storedState = req.cookies?.spotify_auth_state;

  // Verify state parameter for cross-site request forgery (CSRF) protection (as recommended by Spotify)
  const cookieMatches = state !== null && state === storedState;
  const memoryMatches = state !== null && pendingStates.has(state);
  if (!cookieMatches && !memoryMatches) {
    console.error('State mismatch - possible CSRF attack', {
      stateReceived: state,
      cookieState: storedState,
      hasInMemory: pendingStates.has(state)
    });
    res.clearCookie('spotify_auth_state');
    return res.status(403).json({ error: 'State parameter mismatch' });
  }

  // Clear the state cookie after verification
  res.clearCookie('spotify_auth_state');
  // Remove from in-memory store
  if (state) pendingStates.delete(state);

  if (error) {
    console.error('Spotify auth error:', error);
    return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return res.status(500).json({ error: 'Failed to exchange authorization code for token' });
    }

    const tokenData = await tokenResponse.json() as SpotifyTokenResponse;

    res.cookie('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in * 1000,
    });

    if (tokenData.refresh_token) {
      res.cookie('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in * 1000,
      });
    } 

    res.redirect(`${FRONTEND_URL}?auth=success`)
    console.log('Redirecting to frontend with auth=success');
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

/*
 * POST /api/auth/refresh
 * Refreshes the access token using the refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.spotify_refresh_token;
  console.log('refresh_token', refreshToken);

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh error:', errorData);
      return res.status(500).json({ error: 'Failed to refresh token' });
    }

    const tokenData = await tokenResponse.json() as SpotifyTokenResponse;
    // Update the access token cookie
    res.cookie('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in * 1000,
    });

    // Update refresh token cookie if a new one is provided
    if (tokenData.refresh_token) {
      res.cookie('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in * 1000, // Keeping same as you requested
      });
    }

    res.json({
      success: true,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Error during token refresh:', error);
    res.status(500).json({ error: 'Internal server error during token refresh' });
  }
});

/*
 * Helper function to generate random string for state parameter
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export default router;

