import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import TopSongs from '../components/TopSongs'
import { mockTopSongs } from '@/components/fakespotifydb'

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => mockTopSongs,
  } as any)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TopSongs', () => {
  it('renders the title', () => {
    render(<TopSongs timeRange="medium_term" />)
    expect(screen.getByText(/Top Songs/i)).toBeTruthy()
  })

  it('renders a loading state', () => {
    render(<TopSongs timeRange="medium_term" />)
    expect(screen.queryByText(/Loading/i)).toBeTruthy()
  })

  it('renders the song title', async () => {
    render(<TopSongs timeRange="medium_term" />)
    expect(await screen.findByText(/Blinding Lights/i)).toBeInTheDocument()
  })

  it('renders an album cover', async () => {
    render(<TopSongs timeRange="medium_term" />)
    const images = await screen.findAllByRole('img')
    expect(images).toHaveLength(mockTopSongs.items.length)
  })
})
