import { BarChart2, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useClipboard } from '../hooks/useClipboard'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from '../utils/date'

const STATUS_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  expired: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  deleted: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

export default function UrlCard({ url, onEdit, onDelete }) {
  const { copy } = useClipboard()
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin
  const shortUrl = `${baseUrl}/${url.slug}`

  const handleCopy = async () => {
    await copy(shortUrl)
    toast.success('Short URL copied!')
  }

  const status = url.deletedAt ? 'deleted' : url.expiresAt && new Date(url.expiresAt) < new Date() ? 'expired' : 'active'
  const truncated = url.originalUrl?.length > 45 ? url.originalUrl.slice(0, 45) + '...' : url.originalUrl

  return (
    <motion.tr
      className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors group"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-violet-400 font-mono text-sm font-medium">{url.slug}</span>
          <a href={shortUrl} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <ExternalLink size={12} />
          </a>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-zinc-400 text-sm" title={url.originalUrl}>
          {truncated}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-zinc-300 text-sm font-medium">{(url.clicks ?? 0).toLocaleString()}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-zinc-500 text-xs">
          {url.createdAt ? formatDistanceToNow(new Date(url.createdAt)) : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy short URL"
          >
            <Copy size={14} />
          </button>
          <Link
            to={`/dashboard/urls/${url.id}/analytics`}
            className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="View analytics"
          >
            <BarChart2 size={14} />
          </Link>
          <button
            onClick={() => onEdit(url)}
            className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(url)}
            className="p-1.5 rounded-lg hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}
