import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ChartDataPoint {
  name: string
  value: number
}

interface RechartsAreaChartProps {
  data: ChartDataPoint[]
  color?: string
  height?: number
}

export function RechartsAreaChart({ data, color = '#7C4DFF', height = 120 }: RechartsAreaChartProps) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#63636E' }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: 'rgba(20, 20, 22, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#EDEDEF',
          }}
          labelStyle={{ color: '#A1A1AA' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface RechartsBarChartProps {
  data: ChartDataPoint[]
  color?: string
  height?: number
}

export function RechartsBarChart({ data, color = '#7C4DFF', height = 120 }: RechartsBarChartProps) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#63636E' }}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: 'rgba(20, 20, 22, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#EDEDEF',
          }}
          labelStyle={{ color: '#A1A1AA' }}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
