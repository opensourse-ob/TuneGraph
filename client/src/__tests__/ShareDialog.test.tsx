import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  renderHook,
} from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import html2canvas from 'html2canvas-pro'
import { ShareDialog } from '../components/DialogShareable'
import NavBar from '../components/NavBar'
import { useUserProfile } from '../hooks/useUserProfile'
import { useTopArtists, type UseTopArtistsResult } from '../hooks/useTopArtists'
import { useTopSongs, type UseTopSongsResult } from '../hooks/useTopSongs'

vi.mock('html2canvas-pro', () => ({ default: vi.fn() }))
vi.mock('../hooks/useUserProfile', () => ({ useUserProfile: vi.fn() }))
const artist = (index: number) => ({
  id: String(index),
  rank: index,
  name: `Artist ${index}`,
  genres: [],
  images: [
    { url: `https://images.example/artist-${index}`, height: 100, width: 100 },
  ],
  popularity: 80,
  external_urls: { spotify: '' },
})
const track = (index: number) => ({
  rank: index,
  name: `Track ${index}`,
  artist: [`Performer ${index}`],
  albumCover: `https://images.example/track-${index}`,
})
let artists: UseTopArtistsResult
let songs: UseTopSongsResult
let click: ReturnType<typeof vi.spyOn>
let downloadedName: string
beforeEach(() => {
  artists = {
    topArtists: [1, 2, 3, 4].map(artist),
    isLoading: false,
    error: null,
  }
  songs = { topSongs: [1, 2, 3, 4].map(track), isLoading: false, error: null }
  vi.mocked(useUserProfile).mockReturnValue({
    userProfile: {
      id: 'profile',
      display_name: 'Olga',
      images: [],
      followers: { total: 0 },
    },
    isLoading: false,
    error: null,
  })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValue(new Error('Unexpected network request'))
  )
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:card'),
      revokeObjectURL: vi.fn(),
    })
  )
  downloadedName = ''
  click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download
    })
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
  vi.mocked(html2canvas).mockResolvedValue({
    toBlob: (callback: BlobCallback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
  } as HTMLCanvasElement)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
function open() {
  render(<ShareDialog artists={artists} songs={songs} />)
  fireEvent.click(screen.getByRole('button', { name: 'Create Shareable' }))
}
describe('music card preview and export', () => {
  it('renders the dashboard data, three artists and tracks, performer names and branding', () => {
    render(<NavBar artists={artists} songs={songs} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create Shareable' }))
    const card = within(screen.getByTestId('share-content-card'))
    expect(card.getByText("Olga's Top Music")).toBeInTheDocument()
    for (const index of [1, 2, 3]) {
      expect(card.getByText(`Artist ${index}`)).toBeInTheDocument()
      expect(card.getByText(`Track ${index}`)).toBeInTheDocument()
      expect(card.getByText(`Performer ${index}`)).toBeInTheDocument()
      expect(card.getByAltText(`Artist ${index}`)).toHaveAttribute(
        'crossorigin',
        'anonymous'
      )
    }
    expect(card.queryByText('Artist 4')).not.toBeInTheDocument()
    expect(card.queryByText('Track 4')).not.toBeInTheDocument()
    expect(card.getByText('TuneGraph')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('uses image fallbacks for absent artwork and failed images', () => {
    artists.topArtists = [{ ...artist(1), images: [] }]
    songs.topSongs = [{ ...track(1), albumCover: '' }]
    open()
    expect(
      screen.getByRole('img', { name: 'Olga: image unavailable' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Artist 1: image unavailable' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Track 1: image unavailable' })
    ).toBeInTheDocument()
  })
  it('replaces failed externally hosted artwork with a fallback', () => {
    open()
    fireEvent.error(screen.getByAltText('Artist 1'))
    expect(
      screen.getByRole('img', { name: 'Artist 1: image unavailable' })
    ).toBeInTheDocument()
  })
  it('handles fewer than three results', () => {
    artists.topArtists = [artist(1)]
    songs.topSongs = [track(1)]
    open()
    expect(screen.getByText('Artist 1')).toBeInTheDocument()
    expect(screen.getByText('Performer 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeEnabled()
  })
  it.each(['artists', 'tracks', 'profile'])(
    'disables export while %s is loading',
    source => {
      if (source === 'artists') artists.isLoading = true
      if (source === 'tracks') songs.isLoading = true
      if (source === 'profile')
        vi.mocked(useUserProfile).mockReturnValue({
          userProfile: null,
          isLoading: true,
          error: null,
        })
      open()
      expect(screen.getByRole('status')).toHaveTextContent('Loading')
      fireEvent.click(screen.getByRole('button', { name: 'Save Image' }))
      expect(screen.getByRole('button', { name: 'Save Image' })).toBeDisabled()
      expect(html2canvas).not.toHaveBeenCalled()
    }
  )
  it('blocks empty-data exports and displays an explanation', () => {
    artists.topArtists = []
    open()
    expect(
      screen.getByText('No top artists available for this range.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeDisabled()
  })
  it('shows a sanitized load error', () => {
    songs.error = new Error('sensitive upstream detail')
    open()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load your music card'
    )
    expect(screen.queryByText(/sensitive upstream/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeDisabled()
  })
  it('exports only the content card with a deterministic filename and cleans up', async () => {
    open()
    const card = screen.getByTestId('share-content-card')
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save Image' }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(html2canvas).toHaveBeenCalledWith(
      card,
      expect.objectContaining({ useCORS: true, allowTaint: false, scale: 2 })
    )
    expect(downloadedName).toBe('tunegraph-top-music.png')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:card')
    expect(document.querySelector('a[download]')).toBeNull()
  })
  it('reports encoding failure and re-enables export', async () => {
    vi.mocked(html2canvas).mockResolvedValue({
      toBlob: (callback: BlobCallback) => callback(null),
    } as HTMLCanvasElement)
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Save Image' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to create the image'
    )
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeEnabled()
    expect(click).not.toHaveBeenCalled()
  })
})
describe('top music request failures', () => {
  it.each(['artists', 'tracks'])(
    'does not silently treat a failed %s request as success',
    async source => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 429 }))
      const { result } = renderHook(() =>
        source === 'artists'
          ? useTopArtists('medium_term')
          : useTopSongs('medium_term')
      )
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error?.message).toBe(
        'Unable to load your top music. Please try again.'
      )
    }
  )
})
