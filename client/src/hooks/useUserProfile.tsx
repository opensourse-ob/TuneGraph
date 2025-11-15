import { useState, useEffect } from 'react'

interface UserProfile {
  display_name: string
  id: string
  images: Array<{ url: string; height: number; width: number }>
  followers: {
    total: number
  }
  country?: string
  email?: string
}

interface UseUserProfileResult {
  userProfile: UserProfile | null
  isLoading: boolean
  error: Error | null
}

export const useUserProfile = (): UseUserProfileResult => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUserProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use 'me' as the user ID to get the current user's profile
      const response = await fetch('/api/spotify/users/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error fetching user profile')
      }

      const data = await response.json()
      console.log('User profile:', data)
      setUserProfile(data)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching user profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  return { userProfile, isLoading, error }
}
