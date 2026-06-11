import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart2, Link2, MousePointerClick, Plus, Search, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import UrlCard from '../components/UrlCard'
import SkeletonRow from '../components/SkeletonRow'
import CreateUrlModal from '../components/CreateUrlModal'
import EditUrlModal from '../components/EditUrlModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { listUrls, deleteUrl, getDashboard, updateUrl } from '../services/urls'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/getErrorMessage'

const PAGE_SIZE = 10

export default function Dashboard() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    retry: 1,
  })

  const { data: urlsData, isLoading: urlsLoading } = useQuery({
    queryKey: ['urls', page, search, statusFilter],
    queryFn: () => listUrls({ page, limit: PAGE_SIZE, search, status: statusFilter }),
    keepPreviousData: true,
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUrl(id),
    onSuccess: () => {
      toast.success('URL deleted')
      qc.invalidateQueries({ queryKey: ['urls'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Gagal menghapus URL')),
  })

  const urls = urlsData?.urls || urlsData?.data || []
  const total = urlsData?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const stats = [
    { icon: Link2, label: 'Total URLs', value: dashData?.totalUrls ?? 0, color: 'violet' },
    { icon: MousePointerClick, label: 'Total Clicks', value: dashData?.totalClicks ?? 0, color: 'blue' },
    { icon: TrendingUp, label: 'Active URLs', value: dashData?.activeUrls ?? 0, color: 'emerald' },
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Manage and track all your short links</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} loading={dashLoading} />
          ))}
        </div>

        {/* URL Table */}
        <div className="card p-0 overflow-hidden">
          {/* Table controls */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-zinc-800">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search URLs…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field py-2 text-sm w-full sm:w-36"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Slug</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Original URL</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Clicks</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Created</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {urlsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : urls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-zinc-600">
                      <Link2 size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No URLs yet</p>
                      <p className="text-sm mt-1">Click "New URL" to shorten your first link</p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {urls.map((url) => (
                      <UrlCard
                        key={url.id}
                        url={url}
                        onEdit={setEditTarget}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center z-20 hover:shadow-violet-500/50 hover:scale-105 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="New URL"
      >
        <Plus size={24} />
      </motion.button>

      <CreateUrlModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUrlModal url={editTarget} onClose={() => setEditTarget(null)} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        url={deleteTarget}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
      />
    </Layout>
  )
}
