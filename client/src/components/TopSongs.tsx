import { useTopSongs } from '@/hooks/useTopSongs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'

interface TopSongsProps {
  timeRange: string
}

const TopSongs: React.FC<TopSongsProps> = ({ timeRange }) => {
  const { topSongs, isLoading, error } = useTopSongs(timeRange, 20)

  const getSongImage = (albumCover: (typeof topSongs)[0]['albumCover']) => {
    return albumCover
  }

  return (
    <div className="text-white-500 mt-4">
      <Card className="bg-slate-900 text-white border-slate-800">
        <CardHeader>
          <CardTitle className="flex justify-center text-slate-200 text-2xl">
            Top Songs
          </CardTitle>
          <CardDescription className="flex justify-center text-slate-300">
            Your most listened to songs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div> Loading...</div>
          ) : error ? (
            <div>{error.message}</div>
          ) : (
            <div className="space-y-6">
              {topSongs.map(song => {
                const songImage = getSongImage(song.albumCover)
                return (
                  <div
                    key={song.name}
                    className="flex flex-row items-center sm:gap-0 sm:space-y-8 w-full"
                  >
                    <div className="flex justify-start items-center sm:gap-8 gap-6 w-full min-w-0">
                      {/* Song Rank */}
                      <div className="font-bold sm:text-2xl flex justify-center text-slate-400 items-center w-8 sm:w-12 tabular-nums shrink-0">
                        {song.rank}
                      </div>
                      {/* Song Image */}
                      {songImage && (
                        <img
                          src={songImage}
                          className="lg:w-32 lg:h-32 w-16 h-16 object-cover shrink-0"
                        />
                      )}
                      {/* Song Name and Artist */}
                      <div className="flex flex-col lg:flex-row w-full min-w-0 gap-1 lg:gap-0 lg:justify-between lg:items-center">
                        <div className="flex min-w-0 sm:text-base text-sm">
                          {song.name}
                        </div>
                        <div
                          className="text-slate-400 text-xs sm:text-sm truncate lg:text-right lg:max-w-[180px]"
                          title={song.artist.join(', ')}
                        >
                          <span className="lg:hidden">{song.artist[0]}</span>
                          <span className="hidden lg:inline">
                            {song.artist.join(', ')}
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

export default TopSongs
