import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { useTopArtists } from '@/hooks/useTopArtists'

interface TopArtistsProps {
  timeRange: string
}

const TopArtists: React.FC<TopArtistsProps> = ({ timeRange }) => {
  const { topArtists, isLoading, error } = useTopArtists(timeRange, 20)

  const getArtistImage = (images: (typeof topArtists)[0]['images']) => {
    return images && images.length > 0 ? images[0].url : null
  }

  return (
    <div className="text-white-500 mt-4">
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
            <div>{error.message}</div>
          ) : (
            <div className="space-y-6">
              {topArtists.map(artist => {
                const artistImage = getArtistImage(artist.images)
                return (
                  <div
                    key={artist.id}
                    className="flex flex-row items-center sm:gap-0 sm:space-y-8 w-full"
                  >
                    <div className="flex justify-start items-center sm:gap-8 gap-6 w-full min-w-0">
                      {/* Artist Rank */}
                      <div className="font-bold sm:text-2xl flex justify-center text-slate-400 items-center w-8 sm:w-12 tabular-nums shrink-0">
                        {artist.rank}
                      </div>
                      {/* Artist Image */}
                      {artistImage && (
                        <img
                          src={artistImage}
                          className="lg:w-32 lg:h-32 w-16 h-16 object-cover rounded-full shrink-0"
                        />
                      )}
                      {/* Artist Name and Genres */}
                      <div className="flex flex-col lg:flex-row w-full min-w-0 gap-1 lg:gap-0 lg:justify-between lg:items-center">
                        <div className="flex min-w-0 sm:text-base text-sm truncate">
                          {artist.name}
                        </div>
                        <div className="text-slate-400 text-xs sm:text-sm truncate lg:text-right lg:max-w-[180px]">
                          <span className="lg:hidden">
                            {artist.genres && artist.genres.length > 0
                              ? artist.genres[0].charAt(0).toUpperCase() +
                                artist.genres[0].slice(1)
                              : 'Unknown genres'}
                          </span>
                          <span className="hidden lg:inline">
                            {artist.genres && artist.genres.length > 0
                              ? artist.genres
                                  .map(
                                    genre =>
                                      genre.charAt(0).toUpperCase() +
                                      genre.slice(1)
                                  )
                                  .join(', ')
                              : 'Unknown genres'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TopArtists
