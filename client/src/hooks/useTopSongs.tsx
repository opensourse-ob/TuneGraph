import { useState, useEffect } from 'react'

interface TopSong {
  rank: number
  name: string
  artist: string[]
  albumCover: string | null
}

export interface UseTopSongsResult {
  topSongs: TopSong[]
  isLoading: boolean
  error: Error | null
}

export const useTopSongs = (
  timeRange: string,
  limit: number = 20
): UseTopSongsResult => {
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTopSongs = async (timeRange: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/spotify/top-songs?time_range=${timeRange}&limit=${limit}`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Error fetching top artists')
      }

      const data = await response.json()
      setTopSongs(data.items)
    } catch (err) {
      setError(new Error('Unable to load your top music. Please try again.'))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTopSongs(timeRange)
  }, [timeRange, limit])

  return { topSongs, isLoading, error }
}
