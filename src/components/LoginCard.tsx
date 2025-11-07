import { Card } from './ui/card'
import { Button } from './ui/button'
import { MusicIcon, CheckCircle } from 'lucide-react'

const LoginCard = () => {
  const handleLogin = () => {
    const spotifyLogin = '/api/auth/login'
    window.location.href = spotifyLogin
  }

  const FEATURES = [
    'View your top artists, tracks, and genres',
    'Analyze listening patterns over different time periods',
    'Create and share beautiful stat cards',
  ]

  return (
    <div className="p-8 flex justify-center">
      <Card className="bg-slate-900 border-slate-600 flex justify-center items-center w-full max-w-md gap-6 px-8">
        {/* Icon */}
        <div className="bg-green-600 rounded-full p-4 flex items-center justify-center">
          <MusicIcon className="w-16 h-16 text-black " />
        </div>
        {/* Title & Subtitle */}
        <div className="flex flex-col gap-2 items-center justify-center">
          <h1 className="text-2xl text-white font-bold">TuneGraph</h1>
          <h2 className="text-base text-center text-slate-300">
            Discover your listening patterns and create shareable stats.
          </h2>
        </div>
        <Button
          onClick={handleLogin}
          className="flex-row w-full bg-green-600 hover:bg-green-500"
        >
          <img src="/spotify.svg" className="w-5 h-5 invert" />
          Login with Spotify
        </Button>
        <div className="flex items-center gap-4 w-full">
          <div className="grow h-px bg-slate-600" />
          <span className="text-slate-400 text-xs tracking-widest font-semibold">
            FEATURES
          </span>
          <div className="grow h-px bg-slate-600" />
        </div>
        <ul className="mt-2 space-y-4 text-sm text-slate-400">
          {FEATURES.map(feature => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <p className="text-slate-400 text-xs ">
          By logging in, you agree to share your Spotify listening data.
        </p>
      </Card>
    </div>
  )
}
export default LoginCard
