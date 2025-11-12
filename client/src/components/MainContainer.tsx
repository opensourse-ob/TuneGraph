// import {useEffect, useState} from 'react'
import NavBar from './NavBar.tsx'
import { Button } from './ui/button.tsx'
import OneTab from './Card'
import TopArtists from './TopArtists.tsx'
import TopSongs from './TopSongs.tsx'
import { useState } from 'react'
import TimeRangeTabs from './TimeRangeTabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select.tsx'

const MainContainer = () => {
  const [mobileView, setMobileView] = useState<'artists' | 'songs'>('artists')
  const [timeRange, setTimeRange] = useState('medium_term')
  const timeRanges = [
    { value: 'short_term', label: '4 weeks' },
    { value: 'medium_term', label: 'Last 3 months' },
    { value: 'long_term', label: 'Past Year' },
  ]

  return (
    <>
      <NavBar />
      <div className="bg-slate-950 p-8">
        <div>
          <div className="flex flex-col justify-center w-full mx-auto max-w-7xl rounded-lg">
            {/* Mobile filter dropdown */}
            <div className="block sm:hidden mb-4">
              <Select
                value={mobileView}
                onValueChange={v => setMobileView(v as 'artists' | 'songs')}
              >
                <SelectTrigger className="w-full bg-slate-800 text-white">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artists">Top Artists</SelectItem>
                  <SelectItem value="songs">Top Songs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TimeRangeTabs
              value={timeRange}
              onChange={setTimeRange}
              timeRanges={timeRanges}
            />
            {/* Desktop: show both artist and songs */}
            <div className="hidden sm:flex justify-between gap-6">
              <div className="flex-1">
                <TopArtists timeRange={timeRange} />
              </div>
              <div className="flex-1">
                <TopSongs timeRange={timeRange} />
              </div>
            </div>
            <div className="block sm:hidden">
              {mobileView === 'artists' ? (
                <TopArtists timeRange={timeRange} />
              ) : (
                <TopSongs timeRange={timeRange} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default MainContainer
