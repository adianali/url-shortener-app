import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'

function AnimatedNumber({ value }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    const controls = animate(count, typeof value === 'number' ? value : 0, {
      duration: 1.2,
      ease: 'easeOut',
    })
    return controls.stop
  }, [value, count])

  return <motion.span>{rounded}</motion.span>
}

export default function StatCard({ icon: Icon, label, value, sub, color = 'violet', loading = false }) {
  const colorMap = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  }
  const iconBg = colorMap[color] || colorMap.violet

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
            <div className="h-8 w-16 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-20 bg-zinc-800 rounded" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="card group cursor-default"
      whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-zinc-100 mb-1">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
          {sub && <p className="text-zinc-500 text-xs">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} border flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className={iconBg.split(' ').find(c => c.startsWith('text-'))} />
        </div>
      </div>
    </motion.div>
  )
}
