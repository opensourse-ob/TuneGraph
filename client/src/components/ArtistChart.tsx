import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useTopArtists } from '@/hooks/useTopArtists'

interface ArtistChartProps {
  timeRange: string
  limit?: number
}

export function ArtistChart({ timeRange, limit = 10 }: ArtistChartProps) {
  const { topArtists, isLoading, error } = useTopArtists(timeRange, limit)

  if (isLoading) {
    return <div className="text-white">Loading chart data...</div>
  }

  if (error) {
    return <div className="text-red-500">Error loading chart data</div>
  }

  if (topArtists.length === 0) {
    return <div className="text-white">No artist data available</div>
  }

  // Transform artist data for the chart
  const chartData = topArtists.map(artist => ({
    name: artist.name,
    popularity: artist.popularity,
  }))

  // Create chart config with a single "popularity" key for the bar color
  const chartConfig: ChartConfig = {
    popularity: {
      label: 'Popularity',
      color: '#008726', // Single color for all bar
    },
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: -20 }}
      >
        <XAxis type="number" dataKey="popularity" hide />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fill: '#e2e8f0', fontSize: 16 }}
          width={210}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="popularity"
          fill="var(--color-popularity)"
          radius={5}
          name="Popularity"
        />
      </BarChart>
    </ChartContainer>
  )
}
