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
  genre: string[]
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
    <div className="text-white-500 p-1 m-2">
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
                  <div className="space-y-2">
                    {topArtists.map(artist => {
                      const artistImage = getArtistImage(artist.images)
                      return (
                        <div
                          key={artist.id}
                          className="flex items-center gap-4"
                        >
                          <div className="font-bold text-2xl w-16 h-16 flex justify-center items-center">
                            {artist.rank}
                          </div>
                          {artistImage && (
                            <img
                              src={artistImage}
                              className="w-32 h-32 object-cover"
                            />
                          )}
                          <div className="flex-1">{artist.name}</div>
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
