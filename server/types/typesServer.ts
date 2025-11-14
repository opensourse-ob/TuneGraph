// respons when refreshing tokens
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

//one artist's data returned from spotify
export interface SpotifyArtist {
  name: string;
  id: string;
  genres: string[];
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  external_urls: { spotify: string };
}

//respons from spotify when requesting top artists
export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

//one music track returned from spotify
export interface SpotifyTrack {
  name: string;
  id: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}

//respons from spotify
export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

export interface SpotifyUserProfile {
  user_id: "string",
  display_name: "string",
  country: "string",
  email: "string",

  followers: {
    href: "string",
    total: "number"
  },
  href: "string",
  id: "string",
  images: [
    {
      url: "string",
      height: "number",
      width: "number"
    }
  ]
}