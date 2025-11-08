import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface TimeRangeTabsProps {
  value: string
  onChange: (value: string) => void
  timeRanges?: { value: string; label: string }[]
}

const defaultTimeRanges = [
  { value: 'short_term', label: '4 weeks' },
  { value: 'medium_term', label: 'Last 3 months' },
  { value: 'long_term', label: 'Past Year' },
]

const TimeRangeTabs = ({
  value,
  onChange,
  timeRanges = defaultTimeRanges,
}: TimeRangeTabsProps) => (
  <Tabs value={value} onValueChange={onChange}>
    <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-emerald-500">
      {timeRanges.map(range => (
        <TabsTrigger
          key={range.value}
          value={range.value}
          className="text-slate-200 data-[state=active]:bg-slate-700/60"
        >
          {range.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
)

export default TimeRangeTabs
