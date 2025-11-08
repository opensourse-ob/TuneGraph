import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface TopSong {
  rank: number
  name: string
  artist: string
  albumCover: string
}

const TopSongs = () => {
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [timeRange, setTimeRange] = useState('medium_term')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const timeRanges = [
    { value: 'short_term', label: '4 weeks' },
    { value: 'medium_term', label: 'Last 3 months' },
    { value: 'long_term', label: 'Past Year' },
  ]

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

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
  }
  const getSongImage = (albumCover: TopSong['albumCover']) => {
    return albumCover
  }

  return (
    <div className="text-white-500">
      <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          {timeRanges.map(range => (
            <TabsTrigger
              key={range.value}
              value={range.value}
              className="text-slate-200 data-[state=active]:bg-slate-900"
            >
              {range.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {timeRanges.map(range => (
          <TabsContent key={range.value} value={range.value} className="mt-4">
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
                          key={song}
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

                          {/* Song Genre */}
                          {/* Show only the first genre on mobile, all on sm+ */}
                          <div className="flex-1 flex justify-end text-xs sm:text-sm sm:min-w-xs text-right text-slate-400">
                            {/* Mobile: first genre only */}
                            <span className="block sm:hidden truncate overflow-hidden">
                              {song.genres && song.genres.length > 0
                                ? song.genres[0].charAt(0).toUpperCase() +
                                  song.genres[0].slice(1)
                                : 'Unknown genres'}
                            </span>
                            {/* Desktop: all genres */}
                            <span className="hidden sm:block">
                              {song.genres && song.genres.length > 0
                                ? song.genres
                                    .map(
                                      genre =>
                                        genre.charAt(0).toUpperCase() +
                                        genre.slice(1)
                                    )
                                    .join(', ')
                                : 'Unknown genres'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export default TopSongs
