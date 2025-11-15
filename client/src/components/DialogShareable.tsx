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
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas-pro'
import { useTopArtists } from '@/hooks/useTopArtists'
import { useTopSongs } from '@/hooks/useTopSongs'
import { useUserProfile } from '@/hooks/useUserProfile'

interface ShareDialogProps {
  timeRange: string
}

export function ShareDialog({ timeRange = 'medium_term' }: ShareDialogProps) {
  const { topArtists, isLoading: isLoadingArtists } = useTopArtists(
    timeRange,
    3
  )
  const { topSongs, isLoading: isLoadingTopSongs } = useTopSongs(timeRange, 3)
  const { userProfile, isLoading: isLoadingProfile } = useUserProfile()
  const [isGenerating, setIsGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const isLoading = isLoadingArtists || isLoadingTopSongs || isLoadingProfile

  const handleDownload = async () => {
    if (!contentRef.current) return
    setIsGenerating(true)

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      canvas.toBlob(blob => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `tunegraph-stats-${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
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
          <Button className="bg-green-600 hover:bg-green-700">
            Create Shareable
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border border-slate-700">
          <DialogHeader>
            <div ref={contentRef} className="p-8 bg-slate-900 ">
              {isLoading ? (
                <div className="text-white">Loading...</div>
              ) : (
                <div className="space-y-6">
                  {/* User Profile Section */}
                  {userProfile && (
                    <div className="flex items-center justify-center gap-4 mb-6">
                      {userProfile.images?.[0]?.url && (
                        <img
                          src={userProfile.images[0].url}
                          className="w-16 h-16 rounded-full border-2 border-green-600"
                          alt={userProfile.display_name}
                        />
                      )}
                      <div>
                        <DialogTitle className="text-slate-300 text-xl font-bold">
                          {userProfile.display_name}'s Top Music
                        </DialogTitle>
                      </div>
                    </div>
                  )}

                  {/* Top Artists & Songs Section */}
                  <div className="flex gap-2 ">
                    <div className="space-y-4">
                      {topArtists.map(artist => {
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

                  {/* TuneGraph Branding */}
                  <div className="flex items-center justify-center space-x-2 pt-4">
                    <div className="bg-green-600 rounded-full p-2 flex items-center justify-center">
                      <MusicIcon className="w-8 h-8 text-black " />
                    </div>
                    <h2 className="justify-center align-center text-2xl text-white font-bold ">
                      TuneGraph
                    </h2>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="bg-slate-700">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleDownload}
            >
              {isGenerating ? 'Generating...' : 'Save Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
