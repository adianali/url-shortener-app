import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart2, Clock, Globe, MousePointerClick, Users } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import CopyButton from '../components/CopyButton'
import { getAnalytics, getSummary } from '../services/analytics'
import { getUrl } from '../services/urls'

const PERIODS = ['7d', '30d', '90d']
const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

function ChartSkeleton({ h = 200 }) {
  return <div className={`w-full rounded-xl bg-zinc-800/60 animate-pulse`} style={{ height: h }} />
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-zinc-100 text-sm font-semibold">
          {p.value?.toLocaleString()} {p.name}
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { id } = useParams()
  const [period, setPeriod] = useState('7d')
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const { data: urlData, isLoading: urlLoading } = useQuery({
    queryKey: ['url', id],
    queryFn: () => getUrl(id),
    retry: 1,
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', id],
    queryFn: () => getSummary(id),
    retry: 1,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', id, period],
    queryFn: () => getAnalytics(id, { period }),
    retry: 1,
  })

  const url = urlData?.url || urlData
  const shortUrl = url ? `${baseUrl}/${url.slug}` : ''

  const clicksData = analytics?.clicks || analytics?.timeSeries || []
  const deviceData = analytics?.devices || summary?.devices || []
  const browserData = analytics?.browsers || summary?.browsers || []
  const countryData = analytics?.countries || summary?.countries || []
  const referrers = analytics?.referrers || summary?.referrers || []

  const stats = [
    { icon: MousePointerClick, label: 'Total Clicks', value: summary?.totalClicks ?? 0, color: 'violet' },
    { icon: Users, label: 'Unique Visitors', value: summary?.uniqueVisitors ?? 0, color: 'blue' },
    { icon: Clock, label: 'Last 24h', value: summary?.last24h ?? 0, color: 'cyan' },
    { icon: BarChart2, label: 'Last 7d', value: summary?.last7d ?? 0, color: 'emerald' },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Back + Header */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="card mb-6">
          {urlLoading ? (
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-64 bg-zinc-800 rounded" />
            </div>
          ) : url ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-violet-400 font-mono font-semibold">{shortUrl}</span>
                  <CopyButton text={shortUrl} size="sm" />
                </div>
                <p className="text-zinc-500 text-sm truncate">{url.originalUrl}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} loading={summaryLoading} />
          ))}
        </div>

        {/* Clicks over time */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-zinc-100">Clicks Over Time</h2>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${period === p ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {analyticsLoading ? (
            <ChartSkeleton h={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={clicksData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#clicksGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#8b5cf6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device + Browser donuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="font-semibold text-zinc-100 mb-4">Devices</h2>
            {analyticsLoading ? (
              <ChartSkeleton h={180} />
            ) : deviceData.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-zinc-100 mb-4">Browsers</h2>
            {analyticsLoading ? (
              <ChartSkeleton h={180} />
            ) : browserData.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={browserData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {browserData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Countries + Referrers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-zinc-100 mb-4">
              <Globe size={16} className="inline mr-2 text-zinc-400" />
              Top Countries
            </h2>
            {analyticsLoading ? (
              <ChartSkeleton h={200} />
            ) : countryData.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, countryData.length * 36)}>
                <BarChart data={countryData.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-zinc-100 mb-4">Top Referrers</h2>
            {analyticsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : referrers.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-12">No referrer data yet</p>
            ) : (
              <div className="space-y-2">
                {referrers.slice(0, 8).map((ref, i) => (
                  <motion.div
                    key={ref.name || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-3 py-2"
                  >
                    <span className="text-zinc-300 text-sm truncate max-w-[70%]">{ref.name || 'Direct'}</span>
                    <span className="text-violet-400 font-mono text-sm font-medium flex-shrink-0">{(ref.value || ref.clicks || 0).toLocaleString()}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
