import type { UseTopArtistsResult } from '@/hooks/useTopArtists'
import type { UseTopSongsResult } from '@/hooks/useTopSongs'
import { MusicIcon } from 'lucide-react'
import { ShareDialog } from './DialogShareable'

const NavBar = ({
  artists,
  songs,
}: {
  artists: UseTopArtistsResult
  songs: UseTopSongsResult
}) => {
  return (
    <nav className="flex sticky top-0 z-50 justify-between items-center bg-slate-900 border-b border-slate-800 py-3 sm:px-16 px-4">
      <div className="flex space-x-2 items-center">
        <div className="bg-green-600 rounded-full p-2 flex items-center justify-center">
          <MusicIcon className="w-8 h-8 text-black " />
        </div>
        <h2 className="justify-center align-center text-2xl text-white font-bold ">
          TuneGraph
        </h2>
      </div>

      <ShareDialog artists={artists} songs={songs} />
    </nav>
  )
}
//main name and share button
//nav bar into flexblock, flex row space between thn margins
export default NavBar
