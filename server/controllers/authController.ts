import { Request, Response } from "express"; 
// Import Express types for request/response objects

import type { SpotifyTokenResponse } from "../types/typesServer";
// Import TypeScript interface describing Spotify token response structure

import { SCOPES, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, FRONTEND_URL } from "../utils/data";
// Import environment variables and configuration constants

import { generateRandomString } from "../utils/generateRandomString";
// Import helper function that creates a random string (used for security state value)


// Store random state values temporarily during the OAuth flow
const STATE_TTL_MS = 10 * 60 * 1000;
// Application cookie retention policy, not Spotify's refresh-token expiry.
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const pendingStates = new Map<string, number>();

function pruneExpiredStates() {
  const now = Date.now();
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state);
  }
}

// Clean up idle entries as well as pruning on login/callback.
setInterval(pruneExpiredStates, STATE_TTL_MS).unref();

// Note: Spotify requires 127.0.0.1 instead of localhost for redirect URI
// (This avoids redirect issues on local dev)



/*
 * GET /api/auth/config (debug endpoint)
 * Shows the redirect URI being used (for debugging)
 */
//return app's config
export const getConfig = (req: Request, res: Response) => {
  // Return key app configuration values for debugging
  res.json({
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id_configured: !!SPOTIFY_CLIENT_ID,
    client_secret_configured: !!SPOTIFY_CLIENT_SECRET,
    frontend_url: FRONTEND_URL,
  });
  console.log("router.get /config");
};

/*
 * GET/api/auth/status
 * Checks if the user has a valid access token
 */
//check if cookie has token for user
export const checkStatus = (req: Request, res: Response) => {
  // Check if access token cookie exists (means user is logged in)
  const accessToken = req.cookies?.spotify_access_token;

  // Respond with authentication status
  res.json({
    authenticated: Boolean(accessToken),
  });
};

//------------------------------------------LOGIN-------------------------------------
/*
 * GET /api/auth/login
 * Initiates the Spotify OAuth flow by redirecting to Spotify's authorization page
 * See: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */
//should the route be handling the response codes?
export const login = (req: Request, res: Response) => {
  // Ensure required Spotify credentials are set
  if (!SPOTIFY_CLIENT_ID) return res.status(500).json({ error: "Spotify Client ID not configured" });
  if (!SPOTIFY_REDIRECT_URI) return res.status(500).json({ error: "Redirect URI not configured" });

  // Generate random "state" string for CSRF protection
  pruneExpiredStates();
  const previousState = req.cookies?.spotify_auth_state;
  if (typeof previousState === "string") pendingStates.delete(previousState);
  const state = generateRandomString(32);

  // Save it in an HTTP-only cookie (cannot be accessed from frontend)
  res.cookie("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_MS, // 10 minutes
  });

  // Also store the same state in server memory (useful in local dev)
  pendingStates.set(state, Date.now() + STATE_TTL_MS);

  // Combine Spotify scopes into a single string
  const scope = SCOPES.length > 0 ? SCOPES.join(" ") : undefined;

  // Build parameters required by Spotify's authorization URL
  const params: Record<string, string> = {
    response_type: "code",  // We use the "authorization code" grant type
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: state,
  };

  // Add optional "scope" if available
  if (scope) params.scope = scope;

  // Skip re-asking user for permissions if already authorized
  params.show_dialog = "false";

  // Convert parameters into URL query string format
  const queryString = new URLSearchParams(params).toString();

  // Redirect user to Spotify login page with proper parameters
  res.redirect(`https://accounts.spotify.com/authorize?${queryString}`);
};

//----------------------------CALLBACK-----------------------------------------
/*
 * GET /api/auth/callback
 * Handles the callback from Spotify after user authorization
 */
export const callback = async (req: Request, res: Response) => {
  const code = req.query.code;
  const state = req.query.state;
  const error = req.query.error;
  const storedState = req.cookies?.spotify_auth_state;
  pruneExpiredStates();

  const validState = typeof state === "string" && state.length > 0
    && typeof storedState === "string" && storedState.length > 0
    && state === storedState && pendingStates.has(state);

  // Clear the browser state even when the callback is rejected.
  res.clearCookie("spotify_auth_state");
  if (!validState) {
    // Invalidate this browser's pending attempt; do not consume another browser's state.
    if (typeof storedState === "string") pendingStates.delete(storedState);
    console.error("OAuth state validation failed");
    return res.status(403).json({ error: "State parameter mismatch" });
  }

  // Consume before any asynchronous token exchange, preventing concurrent reuse.
  pendingStates.delete(state as string);
  if (typeof error === "string" && error) {
    return res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(error)}`);
  }
  if (typeof code !== "string" || !code) {
    return res.status(400).json({ error: "Authorization code not provided" });
  }

  // Check credentials
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: "Spotify credentials not configured" });
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    // Handle failed token request
    if (!tokenResponse.ok) {
      console.error("Token exchange failed", { status: tokenResponse.status });
      return res.status(500).json({ error: "Failed to exchange authorization code for token" });
    }

    // Parse Spotify’s response into our typed object
    const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;

    if (!tokenData || typeof tokenData.access_token !== "string" || !tokenData.access_token
      || !Number.isFinite(tokenData.expires_in) || tokenData.expires_in <= 0) {
      console.error("Token exchange returned an invalid response");
      return res.status(500).json({ error: "Invalid token response" });
    }

    // A new authorization must not inherit a previous account's refresh token.
    res.clearCookie("spotify_refresh_token");
    // Save access token as secure cookie
    res.cookie("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in * 1000,
    });

    // Save refresh token (if present)
    if (typeof tokenData.refresh_token === "string" && tokenData.refresh_token) {
      res.cookie("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_TTL_MS,
      });
    }

    // Redirect back to frontend with success flag
    res.redirect(`${FRONTEND_URL}?auth=success`);
    console.log("Redirecting to frontend with auth=success");
  } catch {
    console.error("Token exchange encountered an internal error");
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

//--------------------------refresh access token----------------------
/*
 * POST /api/auth/refresh
 * Refreshes the access token using the refresh token
 */
export const refreshToken = async (req: Request, res: Response) => {
  // Read stored refresh token from cookies
  const refreshToken = req.cookies?.spotify_refresh_token;

  // If no refresh token — cannot continue
  if (typeof refreshToken !== "string" || !refreshToken) return res.status(400).json({ error: "Refresh token is required" });

  // Verify credentials exist
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: "Spotify credentials not configured" });
  }

  try {
    // Send POST request to Spotify for a new access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    // Handle failed response
    if (!tokenResponse.ok) {
      // Read only the OAuth error identifier; never log or return its description/body.
      let oauthError: unknown;
      if (tokenResponse.status === 400) {
        try { oauthError = (await tokenResponse.json() as { error?: unknown }).error; } catch {}
      }
      console.error("Token refresh failed", { status: tokenResponse.status });
      if (oauthError === "invalid_grant") {
        res.clearCookie("spotify_access_token");
        res.clearCookie("spotify_refresh_token");
        return res.status(401).json({ error: "Spotify authorization expired; log in again" });
      }
      return res.status(500).json({ error: "Failed to refresh token" });
    }

    // Parse new token data
    const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;

    if (!tokenData || typeof tokenData.access_token !== "string" || !tokenData.access_token
      || !Number.isFinite(tokenData.expires_in) || tokenData.expires_in <= 0) {
      console.error("Token refresh returned an invalid response");
      return res.status(500).json({ error: "Invalid token response" });
    }

    // Update cookies with new access token
    res.cookie("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in * 1000,
    });

    // Update refresh token if Spotify sent a new one
    if (typeof tokenData.refresh_token === "string" && tokenData.refresh_token) {
      res.cookie("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_TTL_MS,
      });
    }

    // Send confirmation to frontend
    res.json({
      success: true,
      expires_in: tokenData.expires_in,
    });
  } catch {
    console.error("Token refresh encountered an internal error");
    res.status(500).json({ error: "Internal server error during token refresh" });
  }
};

