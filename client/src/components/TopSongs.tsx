import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

interface TopSong {
  rank: number
  name: string
  artist: string
  albumCover: string
}

interface TopSongsProps {
  timeRange: string
}

const TopSongs: React.FC<TopSongsProps> = ({ timeRange }) => {
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

  const getSongImage = (albumCover: TopSong['albumCover']) => {
    return albumCover
  }

  return (
    <div className="text-white-500 mt-4">
      <Card className="bg-slate-900 text-white border-slate-800">
        <CardHeader>
          <CardTitle className="flex justify-center text-slate-200 text-2xl">
            Top Songs
          </CardTitle>
          <CardDescription className="flex justify-center text-slate-300">
            Your most listened to songs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div> Loading...</div>
          ) : error ? (
            <div>{error}</div>
          ) : (
            <div className="space-y-6">
              {topSongs.map(song => {
                const songImage = getSongImage(song.albumCover)
                return (
                  <div
                    key={song.name}
                    className="flex flex-row items-center sm:gap-0 sm:space-y-8 w-full"
                  >
                    <div className="flex justify-start items-center sm:gap-8 gap-6 w-full">
                      {/* Song Rank */}
                      <div className="font-bold sm:text-2xl flex justify-center text-slate-400 items-center">
                        {song.rank}
                      </div>
                      {/* Song Image */}
                      {songImage && (
                        <img
                          src={songImage}
                          className="sm:w-32 sm:h-32 w-16 h-16 object-cover"
                        />
                      )}
                      {/* Song Name */}
                      <div className="flex w-32  sm:text-base text-sm">
                        {song.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TopSongs
