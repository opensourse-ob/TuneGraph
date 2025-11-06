# TuneGraph Express Backend

This is the Express server for the TuneGraph application.

## Running the Server

### Run server only:
```bash
npm run dev:server
```

### Run both frontend and backend:
```bash
npm run dev:all
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication Endpoints

#### `GET /api/auth/config`
- **Description:** Returns Spotify OAuth config information for debugging (redirect URI, client id status, etc).


#### `GET /api/auth/login`
- **Description:** Initiates the Spotify OAuth authorization flow (redirects user to Spotify's login page).
- **Response:** Redirects to Spotify authorization page

#### `GET /api/auth/callback`
- **Description:** Handles the callback from Spotify after user authorization. Exchanges authorization code for access/refresh tokens and stores them in httpOnly cookies. Redirects to frontend with `?auth=success`.
- **Cookies Set:** 
  - `spotify_access_token` (httpOnly, expires based on token expiration)
  - `spotify_refresh_token` (httpOnly, expires based on token expiration)

#### `POST /api/auth/refresh`
- **Description:** Refreshes the Spotify access token using the refresh token stored in cookies. Updates the access token cookie automatically.
- **Authentication:** Requires `spotify_refresh_token` cookie
- **Request Body:** None (reads refresh token from cookie)
- **Response:** `{ success: true, expires_in: number }`
- **Cookies Updated:** `spotify_access_token` (and `spotify_refresh_token` if a new one is issued)

### Spotify API Endpoints

- WIP





---




## Development

The server is set up to:
- Use TypeScript with ESM modules
- Auto-reload with nodemon on file changes
- Handle CORS for frontend requests
- Parse JSON request bodies
- Use Express 5.x

Add your API routes in `server/index.ts` or create separate route files as your app grows.



## Useful links

UI charts info
https://ui.shadcn.com/charts/bar#charts

spotify api dev info
https://developer.spotify.com/documentation/web-api

jira link:
https://dylanapangilinan.atlassian.net/jira/software/projects/SCRUM/summary

spotify api documentation
https://developer.spotify.com/documentation/web-api

google shared descriptions
https://docs.google.com/document/d/1Wo6mfWi8EDkGmFsOufUj_nt2rvP7M_to-yP-eLYU920/edit?tab=t.0

figma notes
https://www.figma.com/board/dUMRON1hCLnw1YipAhLRvE/goblin-sharks?node-id=6-180&t=P7r2YxWkkRcw2yzC-0