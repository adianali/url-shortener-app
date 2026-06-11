import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, Tag, Clock, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUrl } from '../services/urls'
import toast from 'react-hot-toast'

export default function EditUrlModal({ url, onClose }) {
  const qc = useQueryClient()
  const isOpen = !!url

  const [form, setForm] = useState({ originalUrl: '', slug: '', expiresAt: '' })

  // Sync form ketika url berubah
  useEffect(() => {
    if (url) {
      setForm({
        originalUrl: url.originalUrl || '',
        slug: url.slug || '',
        expiresAt: url.expiresAt
          ? new Date(url.expiresAt).toISOString().slice(0, 16)
          : '',
      })
    }
  }, [url])

  const mutation = useMutation({
    mutationFn: (payload) => updateUrl(url.id, payload),
    onSuccess: () => {
      toast.success('URL updated!')
      qc.invalidateQueries({ queryKey: ['urls'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to update URL')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.originalUrl) return
    const payload = { originalUrl: form.originalUrl }
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString()
    else payload.expiresAt = null
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
              <h2 className="text-lg font-semibold text-zinc-100">Edit URL</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Original URL */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Destination URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com/..."
                value={form.originalUrl}
                onChange={set('originalUrl')}
                required
                className="input-field"
              />
            </div>

            {/* Slug — read only, tidak bisa diubah agar link lama tetap valid */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Tag size={12} className="inline mr-1" />
                Slug (tidak dapat diubah)
              </label>
              <input
                type="text"
                value={form.slug}
                readOnly
                className="input-field opacity-50 cursor-not-allowed"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Clock size={12} className="inline mr-1" />
                Expiry Date (kosongkan untuk tidak ada batas)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={set('expiresAt')}
                className="input-field"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
