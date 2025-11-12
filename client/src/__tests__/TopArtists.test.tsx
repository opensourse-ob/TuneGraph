import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import TopArtists from '../components/TopArtists'
import { mockTopArtists } from '@/components/fakespotifydb'

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => mockTopArtists,
  } as any)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TopArtists', () => {
  it('renders the title', () => {
    render(<TopArtists timeRange="medium_term" />)
    expect(screen.getByText(/Top Artists/i)).toBeTruthy()
  })

  it('renders a loading state', () => {
    render(<TopArtists timeRange="medium_term" />)
    expect(screen.queryByText(/Loading/i)).toBeTruthy()
  })

  it('renders artist names', async () => {
    render(<TopArtists timeRange="medium_term" />)
    expect(await screen.findByText(/The Weeknd/i)).toBeInTheDocument()
  })

  it('renders an image', async () => {
    render(<TopArtists timeRange="medium_term" />)
    const images = await screen.findAllByRole('img')
    expect(images).toHaveLength(mockTopArtists.items.length)
  })

  it('renders a genre', async () => {
    render(<TopArtists timeRange="medium_term" />)
    const el = await screen.findByText(/Contemporary R&B/i)
    expect(el).toBeInTheDocument()
  })
})
