import { useState, useEffect } from 'react'

interface TopSong {
  rank: number
  name: string
  artist: string[]
  albumCover: string
}

interface UseTopSongsResult {
  topSongs: TopSong[]
  isLoading: boolean
  error: Error | null
}

export const useTopSongs = (
  timeRange: string,
  limit: number = 20
): UseTopSongsResult => {
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTopSongs = async (timeRange: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/spotify/top-songs?time_range=${timeRange}&limit=20`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Error fetching top artists')
      }

      const data = await response.json()
      console.log(data.items)
      setTopSongs(data.items)
    } catch (err) {
      // setError(err)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTopSongs(timeRange)
  }, [timeRange])

  return { topSongs, isLoading, error }
}
