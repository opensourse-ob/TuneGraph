import { HttpError } from './httpError'

export const spotifyApiRequest = async (accessToken: string, endpoint: string): Promise<unknown> => {
  if (typeof accessToken !== 'string' || !accessToken) throw new HttpError(401, 'Unauthorized')
  let res: Response
  try {
    res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  } catch {
    throw new HttpError(502, 'Spotify request failed')
  }
  if (!res.ok) {
    const status = res.status === 401 || res.status === 429 ? res.status : 502
    throw new HttpError(status, 'Spotify request failed')
  }
  try {
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new HttpError(502, 'Invalid Spotify response')
    }
    return data
  } catch {
    throw new HttpError(502, 'Invalid Spotify response')
  }
}
