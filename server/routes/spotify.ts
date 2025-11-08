import { Router, Request, Response } from "express";
import { todo } from "node:test";

const router = Router();

interface SpotifyArtist {
  name: string;
  id: string;
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  external_urls: { spotify: string };
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

interface SpotifyTrack {
  name: string;
  id: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}
interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

// Middleware to check if user is authenticated
//------------------------------get access token for future request-------------------
const requireAuth = (req: Request, res: Response, next: () => void) => {
  const accessToken = req.cookies?.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).accessToken = accessToken;
  next();
};

//------------------------fn for requests to spotify api-----------------------
// Helper function to make authenticated Spotify API requests
const spotifyApiRequest = async (accessToken: string, endpoint: string) => {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`, //provide the access token
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Spotify API error: ${res.status} - ${errorData}}`);
  }

  return res.json();
};

//----------------------- Helper function - Error handling----------------------------
const handleError = (error: unknown, res: Response, errorMessage: string) => {
  console.error(errorMessage, error);
  const details = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ error: errorMessage, details });
};

// Helper function - grabs query params
//grab params from request. everything after ? is query
//to avoid repetetiv code
const getQueryParams = (req: Request) => ({
  timeRange: req.query.time_range as string,
  limit: req.query.limit as string,
});

/*
 * GET /api/spotify/top-artists
 * Fetches user's top artists for a given time period
 * Query params: time_range (short_term, medium_term, long_term), limit (default: 20)
 */

router.get("/top-artists", requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    const { timeRange, limit } = getQueryParams(req);

    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    )) as SpotifyTopArtistsResponse;

    // Shape object to match UI needs
    const topArtists = data.items.map(
      (artist: SpotifyArtist, index: number) => ({
        rank: index + 1, // +1 because of 0th indexing (can't have rank 0)
        name: artist.name,
        id: artist.id,
        genres: artist.genres || [],
        images: artist.images,
        popularity: artist.popularity,
        external_urls: artist.external_urls,
      })
    );

    res.json({
      time_range: timeRange,
      items: topArtists,
    });
  } catch (error: unknown) {
    handleError(error, res, "Failed to fetch top artists");
  }
});

router.get("/top-songs", requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    const { timeRange, limit } = getQueryParams(req);

    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    )) as SpotifyTopTracksResponse;

    // Shape object to match UI needs
    const topSongs = data.items.map((track: SpotifyTrack, index: number) => ({
      rank: index + 1,
      name: track.name,
      artist: track.artists.map((artist) => artist.name),
      albumCover: track.album.images[0]?.url || null,
    }));

    res.json({
      //send respons to the front
      time_range: timeRange,
      items: topSongs,
    });
  } catch (error: unknown) {
    handleError(error, res, "Failed to fetch top songs");
  }
});

//-------------------------get top genres-----------------------------------
router.get("/top-genres", requireAuth, async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken;
    const { timeRange, limit } = getQueryParams(req);

    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=${limit || 50}`
    )) as SpotifyTopArtistsResponse;

    const genreCount: Record<string, number> = {};

    // Weight by rank
    //create an obj of genres and its rate
    data.items.forEach((artist: SpotifyArtist, index: number) => {
      const weight = data.items.length - index;
      artist.genres.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + weight;
      });
    });

    // Convert to array and sort by count
    const topGenres = Object.entries(genreCount) //arr of arrs
      .map(([name, count]) => ({ name, count })) //convert into arr of objs
      .sort((a, b) => b.count - a.count) //
      .slice(0, Number(limit) || 20) //take first 20
      .map((genre, index) => ({
        rank: index + 1, //in spotifi it starts with 0 => 1
        name: genre.name,
        count: genre.count,
      }));

    res.json({
      time_range: timeRange,
      items: topGenres,
    });
  } catch (error: unknown) {
    handleError(error, res, "Failed to fetch top genres");
  }
});

export default router;
