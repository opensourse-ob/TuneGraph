import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface TopArtist {
  rank: number
  name: string
  id: string
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  popularity: number
  external_urls: { spotify: string }
}

const TopArtists = () => {
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [timeRange, setTimeRange] = useState('medium_term')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const timeRanges = [
    { value: 'short_term', label: '4 weeks' },
    { value: 'medium_term', label: 'Last 3 months' },
    { value: 'long_term', label: 'Past Year' },
  ]

  const fetchTopArtists = async (timeRange: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/spotify/top-artists?time_range=${timeRange}&limit=20`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Error fetching top artists')
      }

      const data = await response.json()
      console.log(data.items)
      setTopArtists(data.items)
    } catch (err) {
      // setError(err)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTopArtists(timeRange)
  }, [timeRange])

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
  }
  const getArtistImage = (images: TopArtist['images']) => {
    return images && images.length > 0 ? images[0].url : null
  }

  return (
    <div className="text-white-500">
      <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-emerald-500">
          {timeRanges.map(range => (
            <TabsTrigger
              key={range.value}
              value={range.value}
              className="text-slate-200 data-[state=active]:bg-slate-700/60"
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
                  Top Artists
                </CardTitle>
                <CardDescription className="flex justify-center text-slate-300">
                  Your most listened to artists
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div> Loading...</div>
                ) : error ? (
                  <div>{error}</div>
                ) : (
                  <div className="space-y-6">
                    {topArtists.map(artist => {
                      const artistImage = getArtistImage(artist.images)
                      return (
                        <div
                          key={artist.id}
                          className="flex flex-row items-center sm:gap-0 sm:space-y-8 w-full"
                        >
                          <div className="flex justify-start items-center sm:gap-8 gap-6 w-full">
                            {/* Artist Rank */}
                            <div className="font-bold sm:text-2xl flex justify-center text-slate-400 items-center">
                              {artist.rank}
                            </div>
                            {/* Artist Image */}
                            {artistImage && (
                              <img
                                src={artistImage}
                                className="sm:w-32 sm:h-32 w-16 h-16 object-cover rounded-full"
                              />
                            )}
                            {/* Artist Name */}
                            <div className="flex w-32  sm:text-base text-sm">
                              {artist.name}
                            </div>
                          </div>

                          {/* Artist Genre */}
                          {/* Show only the first genre on mobile, all on sm+ */}
                          <div className="flex-1 flex justify-end text-xs sm:min-w-xs text-right text-slate-400">
                            {/* Mobile: first genre only */}
                            <span className="block sm:hidden truncate text-wrap overflow-hidden">
                              {artist.genres && artist.genres.length > 0
                                ? artist.genres[0].charAt(0).toUpperCase() +
                                  artist.genres[0].slice(1)
                                : 'Unknown genres'}
                            </span>
                            {/* Desktop: all genres */}
                            <span className="hidden sm:block">
                              {artist.genres && artist.genres.length > 0
                                ? artist.genres
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

export default TopArtists
