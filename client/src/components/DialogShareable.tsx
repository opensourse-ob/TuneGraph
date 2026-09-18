import { Button } from '@/components/ui/button'
import { MusicIcon } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from './ui/dialog'
import { useState, useRef } from 'react'
import html2canvas from 'html2canvas-pro'
import type { UseTopArtistsResult } from '@/hooks/useTopArtists'
import type { UseTopSongsResult } from '@/hooks/useTopSongs'
import { useUserProfile } from '@/hooks/useUserProfile'

function Artwork({ src, label }: { src?: string | null; label: string }) {
  const [failedSource, setFailedSource] = useState<string>()
  return src && failedSource !== src ? (
    <img
      src={src}
      crossOrigin="anonymous"
      alt={label}
      onError={() => setFailedSource(src)}
      className="w-12 h-12 shrink-0 rounded object-cover"
    />
  ) : (
    <div
      role="img"
      aria-label={`${label}: image unavailable`}
      className="w-12 h-12 shrink-0 rounded bg-slate-700 flex items-center justify-center text-slate-200"
    >
      <MusicIcon aria-hidden="true" />
    </div>
  )
}

export function ShareDialog({
  artists,
  songs,
}: {
  artists: UseTopArtistsResult
  songs: UseTopSongsResult
}) {
  const {
    userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile()
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportError, setExportError] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const isLoading = artists.isLoading || songs.isLoading || profileLoading
  const loadError = Boolean(artists.error || songs.error || profileError)
  const canExport =
    !isLoading &&
    !loadError &&
    artists.topArtists.length > 0 &&
    songs.topSongs.length > 0
  const displayName = userProfile?.display_name || 'Your Spotify Profile'

  const handleDownload = async () => {
    if (!contentRef.current || !canExport || isGenerating) return
    setIsGenerating(true)
    setExportError('')
    try {
      // Wait for visible artwork before capturing; broken images use the same fallback.
      await Promise.all(
        Array.from(contentRef.current.querySelectorAll('img')).map(image =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve, reject) => {
                const finish = () => {
                  clearTimeout(timeout)
                  image.removeEventListener('load', finish)
                  image.removeEventListener('error', finish)
                  resolve()
                }
                const timeout = setTimeout(() => {
                  image.removeEventListener('load', finish)
                  image.removeEventListener('error', finish)
                  reject(new Error('Artwork loading timed out'))
                }, 10000)
                image.addEventListener('load', finish)
                image.addEventListener('error', finish)
              })
        )
      )
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      })
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          value =>
            value ? resolve(value) : reject(new Error('PNG encoding failed')),
          'image/png'
        )
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      try {
        link.href = url
        link.download = 'tunegraph-top-music.png'
        document.body.appendChild(link)
        link.click()
      } finally {
        link.remove()
        URL.revokeObjectURL(url)
      }
    } catch {
      setExportError('Unable to create the image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          Create Shareable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700">
        <DialogTitle className="text-slate-200">Your music card</DialogTitle>
        <DialogDescription>
          Preview your top music and download it as a PNG.
        </DialogDescription>
        {isLoading ? (
          <p role="status" className="text-slate-200">
            Loading your music card...
          </p>
        ) : loadError ? (
          <p role="alert" className="text-slate-200">
            Unable to load your music card. Please close it and reload the
            dashboard.
          </p>
        ) : (
          <div
            ref={contentRef}
            data-testid="share-content-card"
            className="p-6 bg-slate-900 text-slate-200 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Artwork
                src={userProfile?.images?.[0]?.url}
                label={displayName}
              />
              <h2 className="text-xl font-bold break-words">
                {displayName}'s Top Music
              </h2>
            </div>
            <section className="space-y-3">
              <h3 className="font-semibold text-green-400">Top artists</h3>
              {artists.topArtists.slice(0, 3).map(artist => (
                <div key={artist.id} className="flex items-center gap-3">
                  <Artwork src={artist.images?.[0]?.url} label={artist.name} />
                  <span className="min-w-0 break-words">{artist.name}</span>
                </div>
              ))}
              {!artists.topArtists.length && (
                <p>No top artists available for this range.</p>
              )}
            </section>
            <section className="space-y-3">
              <h3 className="font-semibold text-green-400">Top tracks</h3>
              {songs.topSongs.slice(0, 3).map((song, index) => (
                <div
                  key={`${song.name}-${index}`}
                  className="flex items-center gap-3"
                >
                  <Artwork src={song.albumCover} label={song.name} />
                  <div className="min-w-0 break-words">
                    <p>{song.name}</p>
                    <p className="text-sm text-slate-400">
                      {song.artist.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
              {!songs.topSongs.length && (
                <p>No top tracks available for this range.</p>
              )}
            </section>
            <div className="flex items-center justify-center gap-2 pt-3 border-t border-slate-700">
              <MusicIcon className="text-green-500" />
              <span className="text-xl font-bold">TuneGraph</span>
            </div>
          </div>
        )}
        {exportError && (
          <p role="alert" className="text-slate-200">
            {exportError}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" className="bg-slate-700">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={!canExport || isGenerating}
            className="bg-green-600 hover:bg-green-700"
            onClick={handleDownload}
          >
            {isGenerating ? 'Generating...' : 'Save Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
