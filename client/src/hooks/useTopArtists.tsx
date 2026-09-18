import { useState, useEffect } from 'react'

interface TopArtist {
  rank: number
  name: string
  id: string
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  popularity: number
  external_urls: { spotify: string }
}

export interface UseTopArtistsResult {
  topArtists: TopArtist[]
  isLoading: boolean
  error: Error | null
}

export const useTopArtists = (
  timeRange: string,
  limit: number = 20
): UseTopArtistsResult => {
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTopArtists = async (timeRange: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/spotify/top-artists?time_range=${timeRange}&limit=${limit}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Error fetching top artists')
      }

      const data = await response.json()
      setTopArtists(data.items)
    } catch (err) {
      setError(new Error('Unable to load your top music. Please try again.'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTopArtists(timeRange)
  }, [timeRange, limit])

  return { topArtists, isLoading, error }
}
