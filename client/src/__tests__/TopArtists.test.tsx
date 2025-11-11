import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TopArtists from '../components/TopArtists'

describe('TopArtists', () => {
  it('renders the title', () => {
    render(<TopArtists timeRange="medium_term" />)
    expect(screen.getByText(/Top Artists/i)).toBeTruthy()
  })

  it('renders a loading state', () => {
    render(<TopArtists timeRange="medium_term" />)
    expect(screen.queryByText(/Loading/i)).toBeTruthy()
  })
})
