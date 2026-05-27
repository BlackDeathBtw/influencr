'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface SpendPoint { month: string; amount: number }
interface StatusPoint { name: string; value: number }

interface Props {
  spendTrend: SpendPoint[]
  campaignStatuses: StatusPoint[]
  dealPipeline: StatusPoint[]
}

const CAMPAIGN_COLORS: Record<string, string> = {
  planning: '#a1a1aa',
  active: '#16a34a',
  paused: '#d97706',
  completed: '#2563eb',
}

const DEAL_COLORS: Record<string, string> = {
  outreach: '#a1a1aa',
  negotiating: '#d97706',
  confirmed: '#16a34a',
  declined: '#dc2626',
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-xs text-muted-foreground/70">{label}</p>
    </div>
  )
}

function SpendChart({ data }: { data: SpendPoint[] }) {
  if (data.every(d => d.amount === 0)) return <EmptyState label="No paid payments yet" />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4a827" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#d4a827" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#a1a1aa' }}
          itemStyle={{ color: '#d4a827' }}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Paid out']}
        />
        <Area type="monotone" dataKey="amount" stroke="#d4a827" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CampaignDonut({ data }: { data: StatusPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <EmptyState label="No campaigns yet" />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="78%"
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={CAMPAIGN_COLORS[entry.name] ?? '#a1a1aa'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: '#fff' }}
          formatter={(v, name) => [v, name]}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          formatter={value => <span style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'capitalize' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function DealPipelineChart({ data }: { data: StatusPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <EmptyState label="No deals tracked yet" />
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#a1a1aa' }}
          axisLine={false}
          tickLine={false}
          width={76}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          formatter={(v) => [v, 'deals']}
        />
        <Bar dataKey="value" radius={4} maxBarSize={20}>
          {data.map(entry => (
            <Cell key={entry.name} fill={DEAL_COLORS[entry.name] ?? '#a1a1aa'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardCharts({ spendTrend, campaignStatuses, dealPipeline }: Props) {
  return (
    <div className="grid lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-medium text-foreground mb-1">Spend (6 months)</p>
        <p className="text-xs text-muted-foreground mb-4">Total paid out to influencers</p>
        <div className="h-40">
          <SpendChart data={spendTrend} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-medium text-foreground mb-1">Campaigns</p>
        <p className="text-xs text-muted-foreground mb-4">Status breakdown</p>
        <div className="h-40">
          <CampaignDonut data={campaignStatuses} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-medium text-foreground mb-1">Deal pipeline</p>
        <p className="text-xs text-muted-foreground mb-4">Influencer deal statuses</p>
        <div className="h-40">
          <DealPipelineChart data={dealPipeline} />
        </div>
      </div>
    </div>
  )
}
