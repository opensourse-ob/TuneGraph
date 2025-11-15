import { Request, Response } from 'express'
// Import Express types for request/response objects

import type {
  SpotifyArtist,
  SpotifyTopArtistsResponse,
  SpotifyTrack,
  SpotifyUserProfile,
  SpotifyTopTracksResponse,
} from '../types/typesServer'
// Import TypeScript interfaces that describe the structure of Spotify API data

import { spotifyApiRequest } from '../utils/spotifyApiRequest'
// Helper for making authorized API requests to Spotify

import { handleError } from '../utils/handleError'
// Helper for consistent error handling and logging

import { getQueryParams } from '../utils/getQueryParams'
// Helper that extracts query parameters (time_range, limit) from request

export const getTopArtists = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken
    // Retrieve user's Spotify access token added earlier by middleware

    const { timeRange, limit } = getQueryParams(req)
    // Extract time_range and limit query params (e.g., short_term, 10)

    // Call Spotify API for user's top artists
    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    )) as SpotifyTopArtistsResponse

    // Transform Spotify data to match frontend's expected structure
    const topArtists = data.items.map(
      (artist: SpotifyArtist, index: number) => ({
        rank: index + 1, // Convert 0-based index → 1-based rank
        name: artist.name,
        id: artist.id,
        genres: artist.genres || [],
        images: artist.images,
        popularity: artist.popularity,
        external_urls: artist.external_urls,
      })
    )

    // Send formatted result back to client
    res.json({
      time_range: timeRange,
      items: topArtists,
    })
  } catch (error: unknown) {
    // Log and send error if API call fails
    handleError(error, res, 'Failed to fetch top artists')
  }
}

export const getTopSongs = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken
    // Get access token for authenticated Spotify user

    const { timeRange, limit } = getQueryParams(req)
    // Extract query params (time range + result limit)

    // Call Spotify API for top tracks
    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    )) as SpotifyTopTracksResponse

    // Format Spotify track data for frontend
    const topSongs = data.items.map((track: SpotifyTrack, index: number) => ({
      rank: index + 1, // Rank number
      name: track.name, // Track name
      artist: track.artists.map(artist => artist.name), // Array of artist names
      albumCover: track.album.images[0]?.url || null, // Get first album image or null
    }))

    // Send formatted songs to client
    res.json({
      time_range: timeRange,
      items: topSongs,
    })
  } catch (error: unknown) {
    // Handle and return API errors
    handleError(error, res, 'Failed to fetch top songs')
  }
}

//-------------------------get top genres-----------------------------------
export const getTopGenres = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken
    // Get access token from middleware

    const { timeRange, limit } = getQueryParams(req)
    // Extract time range and limit from query params

    // Request user's top artists (needed to calculate genres)
    const data = (await spotifyApiRequest(
      accessToken,
      `/me/top/artists?time_range=${timeRange}&limit=${limit || 50}`
    )) as SpotifyTopArtistsResponse

    const genreCount: Record<string, number> = {}
    // Create an object to count genre frequencies

    // Count each genre occurrence, weighted by artist rank
    data.items.forEach((artist: SpotifyArtist, index: number) => {
      const weight = data.items.length - index
      // Higher-ranked artists get more "weight"

      artist.genres.forEach((genre: string) => {
        // Increment genre count (or set to weight if first time)
        genreCount[genre] = (genreCount[genre] || 0) + weight
      })
    })

    // Convert genreCount object into sorted array
    const topGenres = Object.entries(genreCount) // [['pop', 100], ['rock', 80]]
      .map(([name, count]) => ({ name, count })) // [{name:'pop', count:100}, ...]
      .sort((a, b) => b.count - a.count) // Sort descending by count
      .slice(0, Number(limit) || 20) // Keep only top 20
      .map((genre, index) => ({
        rank: index + 1, // Assign rank (1-based)
        name: genre.name,
        count: genre.count,
      }))

    // Return processed list of genres
    res.json({
      time_range: timeRange,
      items: topGenres,
    })
  } catch (error: unknown) {
    // Handle unexpected API or logic errors
    handleError(error, res, 'Failed to fetch top genres')
  }
}

//---------------------get user profile-----------
// Handles both current user (when id="me") and specific user by ID

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const accessToken = (req as any).accessToken
    // Get access token from middleware

    const user_id = req.params.id
    // Extract user ID from URL parameter (can be "me" for current user)

    if (!user_id) {
      return res.status(400).json({ error: 'no user id' })
    }

    // Determine endpoint: /me for current user, /users/{id} for specific user
    const endpoint = user_id === 'me' ? '/me' : `/users/${user_id}`

    // Call Spotify API for user profile
    const data = (await spotifyApiRequest(
      accessToken,
      endpoint
    )) as SpotifyUserProfile

    // Return the user profile data
    res.status(200).json(data)
  } catch (error: unknown) {
    handleError(error, res, 'Failed to fetch user profile')
  }
}
