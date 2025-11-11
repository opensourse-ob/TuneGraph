//------------------------fn for requests to spotify api-----------------------
// Helper function to make authenticated Spotify API requests
export const spotifyApiRequest = async (accessToken: string, endpoint: string) => {
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