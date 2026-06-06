import { Check, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClipboard } from '../hooks/useClipboard'
import toast from 'react-hot-toast'

export default function CopyButton({ text, size = 'md', className = '' }) {
  const { copied, copy } = useClipboard()

  const handleCopy = async () => {
    const ok = await copy(text)
    if (ok) toast.success('Copied to clipboard!')
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16

  return (
    <button
      onClick={handleCopy}
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-200
        ${size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'}
        ${copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600'
        } ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={iconSize} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
