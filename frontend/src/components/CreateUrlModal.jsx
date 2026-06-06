import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Tag, Clock, Lock, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUrl } from '../services/urls'
import toast from 'react-hot-toast'

export default function CreateUrlModal({ isOpen, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ originalUrl: '', slug: '', expiresAt: '', password: '' })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const mutation = useMutation({
    mutationFn: createUrl,
    onSuccess: () => {
      toast.success('URL created!')
      qc.invalidateQueries({ queryKey: ['urls'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
      setForm({ originalUrl: '', slug: '', expiresAt: '', password: '' })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create URL')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.originalUrl) return
    const payload = { originalUrl: form.originalUrl }
    if (form.slug) payload.slug = form.slug
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString()
    if (form.password) payload.password = form.password
    mutation.mutate(payload)
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-lg card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center">
                <Link2 size={16} className="text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">Shorten a URL</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Destination URL *</label>
              <input
                type="url"
                placeholder="https://example.com/very/long/url"
                value={form.originalUrl}
                onChange={set('originalUrl')}
                required
                className="input-field"
              />
            </div>

            <button
              type="button"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? '− Hide' : '+ Show'} advanced options
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      <Tag size={12} className="inline mr-1" />Custom Slug
                    </label>
                    <input
                      type="text"
                      placeholder="my-custom-slug"
                      value={form.slug}
                      onChange={set('slug')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      <Clock size={12} className="inline mr-1" />Expiry Date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={set('expiresAt')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      <Lock size={12} className="inline mr-1" />Password Protect
                    </label>
                    <input
                      type="password"
                      placeholder="Optional password"
                      value={form.password}
                      onChange={set('password')}
                      className="input-field"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
                {mutation.isPending ? 'Creating…' : 'Shorten URL'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
