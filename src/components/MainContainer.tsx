// import {useEffect, useState} from 'react'
import NavBar from './NavBar.tsx'
import { Button } from './ui/button.tsx'
import OneTab from './Card'
import { Clock, Music, Headphones, ArrowUp } from 'lucide-react'
import TopArtists from './TopArtists.tsx'
import TopSongs from './TopSongs.tsx'

const MainContainer = props => {
  const iconClock = Clock
  const iconMusic = Music
  const iconHeadphones = Headphones
  const iconArrowUp = ArrowUp
  const icons = [iconClock, iconMusic, iconArrowUp, iconHeadphones]

  // const tabs = timeLines.map((timeLine, index) => {
  //    return <OneTab className={classNameInfo} key={index} timeline={timeLine} cardNames={cardNames} icons={icons} />
  //  });

  return (
    <>
      <NavBar />
      <div className="bg-slate-950 p-4">
        <div>
          <div className="flex flex-col justify-center w-full mx-auto max-w-7xl rounded-lg">
            {/* {tabs} */}
            <TopArtists />
            <TopSongs />
          </div>
        </div>
      </div>
    </>
  )
}
export default MainContainer
