import { Button } from './ui/button'
import { MusicIcon } from 'lucide-react'

const NavBar = () => {
  return (
    <nav className="flex justify-between items-center bg-slate-900 border-b border-slate-800 py-3 px-16">
      <div className="flex space-x-2 items-center">
        <div className="bg-green-600 rounded-full p-4 flex items-center justify-center">
          <MusicIcon className="w-4 h-4 text-black " />
        </div>
        <h2 className="justify-center align-center text-3xl text-white font-bold ">
          TuneGraph
        </h2>
      </div>

      <Button className="bg-green-500">share</Button>
    </nav>
  )
}
//main name and share button
//nav bar into flexblock, flex row space between thn margins
export default NavBar
