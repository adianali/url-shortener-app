import { motion } from 'framer-motion'
import { Bell, Key, Link2, Settings as SettingsIcon, User } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Manage your account preferences</p>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                <User size={16} className="text-violet-400" />
              </div>
              <h2 className="font-semibold text-zinc-100">Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                  className="input-field opacity-60 cursor-not-allowed"
                />
                <p className="text-zinc-600 text-xs mt-1">Email changes are not yet supported.</p>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <Key size={16} className="text-blue-400" />
              </div>
              <h2 className="font-semibold text-zinc-100">Security</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Current password</label>
                <input type="password" placeholder="••••••••" className="input-field" disabled />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">New password</label>
                <input type="password" placeholder="••••••••" className="input-field" disabled />
              </div>
              <button disabled className="btn-primary opacity-50 cursor-not-allowed">
                Change password
              </button>
              <p className="text-zinc-600 text-xs">Password changes coming soon.</p>
            </div>
          </motion.div>

          {/* Notifications stub */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                <Bell size={16} className="text-cyan-400" />
              </div>
              <h2 className="font-semibold text-zinc-100">Notifications</h2>
            </div>
            <p className="text-zinc-500 text-sm">Notification preferences coming soon.</p>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
