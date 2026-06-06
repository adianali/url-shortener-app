import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, url, loading }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-md card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">Delete URL</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={18} />
            </button>
          </div>

          <p className="text-zinc-400 text-sm mb-2">
            Are you sure you want to delete this URL? This action cannot be undone.
          </p>
          {url && (
            <div className="bg-zinc-800/60 rounded-lg px-3 py-2 mb-6">
              <p className="text-violet-400 font-mono text-sm font-medium">{url.slug}</p>
              <p className="text-zinc-500 text-xs mt-0.5 truncate">{url.originalUrl}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
