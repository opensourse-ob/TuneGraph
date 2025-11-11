// import {useEffect, useState} from 'react'
import NavBar from './NavBar.tsx'
import { Button } from './ui/button.tsx'
import OneTab from './Card'
import TopArtists from './TopArtists.tsx'
import TopSongs from './TopSongs.tsx'
import { useState } from 'react'
import TimeRangeTabs from './TimeRangeTabs'

const MainContainer = () => {
  const [timeRange, setTimeRange] = useState('medium_term')
  const timeRanges = [
    { value: 'short_term', label: '4 weeks' },
    { value: 'medium_term', label: 'Last 3 months' },
    { value: 'long_term', label: 'Past Year' },
  ]

  return (
    <>
      <NavBar />
      <div className="bg-slate-950 p-4">
        <div>
          <div className="flex flex-col justify-center w-full mx-auto max-w-7xl rounded-lg">
            <TimeRangeTabs
              value={timeRange}
              onChange={setTimeRange}
              timeRanges={timeRanges}
            />
            <div className="flex justify-between gap-6">
              <div className="flex-1">
                <TopArtists timeRange={timeRange} />
              </div>
              <div className="flex-1">
                <TopSongs timeRange={timeRange} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default MainContainer
