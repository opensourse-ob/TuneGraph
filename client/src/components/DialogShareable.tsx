import { Button } from '@/components/ui/button'
import { MusicIcon } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from './ui/dialog'
import { useState, useEffect, useRef } from 'react'

interface TopSong {
  rank: number
  name: string
  artist: string
  albumCover: string
}

interface TopArtist {
  rank: number
  name: string
  id: string
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  popularity: number
  external_urls: { spotify: string }
}

interface ShareDialogProps {
  timeRange: string
}

export function ShareDialog({ timeRange = 'medium_term' }: ShareDialogProps) {
  const [topArtists, setTopArtists] = useState<TopArtist[]>([])
  const [topSongs, setTopSongs] = useState<TopSong[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch top 3 artists
        const artistsResponse = await fetch(
          `/api/spotify/top-artists?time_range=${timeRange}&limit=3`,
          { credentials: 'include' }
        )

        if (!artistsResponse.ok) {
          throw new Error('Error fetching top artists')
        }
        const artistsData = await artistsResponse.json()
        setTopArtists(artistsData.items || [])

        // Fetch top 3 songs
        const songsResponse = await fetch(
          `/api/spotify/top-songs?time_range=${timeRange}&limit=3`,
          { credentials: 'include' }
        )

        if (!songsResponse.ok) {
          throw new Error('Error fetching top artists')
        }
        const songsData = await songsResponse.json()
        setTopSongs(songsData.items || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  const handleDownload = async () => {
    if (!contentRef.current) return
    setIsGenerating(true)

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#FFFFFF',
      })
    } catch (err) {
      console.error('Error generating image:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button className="bg-green-600">Create Shareable</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-300 text-center mb-2">
              Save Your Stats
            </DialogTitle>
            <h2 className="text-slate-200 text-center font-bold mb-2">
              My Top Artists & Songs
            </h2>

            {isLoading ? (
              <div className="text-white">Loading...</div>
            ) : (
              <div className="space-y-8">
                {/* Top Artists Section */}
                <div className="flex gap-2 ">
                  <div className="space-y-4">
                    {topArtists.map((artist, index) => {
                      const artistImage = artist.images?.[0]?.url
                      return (
                        <div
                          key={artist.id}
                          className="flex items-center gap-4 text-slate-200 text-sm"
                        >
                          {artistImage && (
                            <img
                              src={artistImage}
                              className="w-12 h-12 object-cover border-2 border-slate-600 rounded-full"
                              alt={artist.name}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">{artist.name}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="space-y-4">
                    {topSongs.map((song, index) => (
                      <div
                        key={`${song.name}-${index}`}
                        className="flex items-center gap-4 text-slate-200 text-sm"
                      >
                        {song.albumCover && (
                          <img
                            src={song.albumCover}
                            className="w-12 h-12 object-cover border-2 border-slate-600"
                            alt={song.name}
                          />
                        )}
                        <div className="flex-1">
                          <div>{song.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="bg-green-600 rounded-full sm:p-4 p-2 flex items-center justify-center">
                    <MusicIcon className="w-4 h-4 text-black " />
                  </div>
                  <h2 className="justify-center align-center sm:text-3xl text-2xl text-white font-bold ">
                    TuneGraph
                  </h2>
                </div>
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="bg-slate-700">Cancel</Button>
            </DialogClose>
            <Button className="bg-green-600" type="submit">
              Save Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
