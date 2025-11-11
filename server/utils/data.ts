// Scopes needed for the application
// See: https://developer.spotify.com/documentation/web-api/concepts/scopes
export const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative",
];

//this info for developer, he gets it after register on spotify
export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
export const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3001/api/auth/callback";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";