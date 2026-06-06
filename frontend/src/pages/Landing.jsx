import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BarChart2, Check, Copy, ExternalLink, Link2, Shield, Sparkles, X, Zap } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { createUrl } from '../services/urls'
import { useClipboard } from '../hooks/useClipboard'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Redirects in under 50ms globally with edge caching.' },
  { icon: BarChart2, title: 'Deep Analytics', desc: 'Track clicks, devices, countries and referrers in real time.' },
  { icon: Shield, title: 'Secure by Default', desc: 'HTTPS everywhere, password protection, and expiry dates.' },
]

// ── Popup: input nama alias ────────────────────────────────────────────────────
function SlugPopup({ originalUrl, onConfirm, onCancel, loading }) {
  const [nama, setNama] = useState('')
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const handleConfirm = (e) => {
    e.preventDefault()
    if (!nama.trim()) return
    onConfirm(nama.trim())
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        onClick={onCancel}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/60 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <h3 className="font-semibold text-zinc-100 text-base">Beri nama link-mu</h3>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* URL asli (preview) */}
          <div className="bg-zinc-800/60 rounded-xl px-3 py-2.5 mb-5 border border-zinc-700/60">
            <p className="text-xs text-zinc-500 mb-0.5">URL asli</p>
            <p className="text-zinc-300 text-xs truncate">{originalUrl}</p>
          </div>

          {/* Form input nama */}
          <form onSubmit={handleConfirm}>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nama alias <span className="text-violet-400">*</span>
            </label>

            {/* Preview URL */}
            <div className="flex items-center bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2.5 mb-1 focus-within:border-violet-500 transition-colors">
              <span className="text-zinc-500 text-sm whitespace-nowrap mr-1 select-none">
                {baseUrl}/
              </span>
              <input
                autoFocus
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="nama-link-kamu"
                className="flex-1 bg-transparent text-zinc-100 text-sm outline-none placeholder-zinc-600"
                maxLength={50}
              />
            </div>

            <p className="text-xs text-zinc-600 mb-5">
              Hanya huruf, angka, <code className="text-zinc-500">-</code> dan <code className="text-zinc-500">_</code>. Contoh: <span className="text-violet-400">{baseUrl}/promo-lebaran</span>
            </p>

            {/* Preview hasil */}
            {nama && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2.5 mb-5 flex items-center gap-2"
              >
                <Link2 size={13} className="text-violet-400 flex-shrink-0" />
                <span className="text-violet-300 text-sm font-medium truncate">
                  {baseUrl}/{nama}
                </span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 hover:text-zinc-200 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!nama.trim() || loading}
                className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowRight size={15} />
                )}
                Buat Link
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const [url, setUrl] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [result, setResult] = useState(null)
  const { copied, copy } = useClipboard()

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const mutation = useMutation({
    mutationFn: createUrl,
    onSuccess: (data) => {
      setResult(data)
      setShowPopup(false)
      setUrl('')
      toast.success('Link berhasil dibuat!')
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || 'Gagal membuat link. Coba lagi.'
      toast.error(msg)
    },
  })

  // Step 1: validasi URL → buka popup
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    try {
      new URL(url) // validasi format
    } catch {
      toast.error('URL tidak valid. Pastikan diawali https://')
      return
    }
    setShowPopup(true)
  }

  // Step 2: dari popup → submit ke API dengan slug dari nama
  const handleConfirmSlug = (nama) => {
    mutation.mutate({ originalUrl: url, slug: nama })
  }

  const shortUrl = result ? `${baseUrl}/${result.slug}` : ''

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-600/8 blur-[120px]" />
      </div>

      {/* Popup */}
      {showPopup && (
        <SlugPopup
          originalUrl={url}
          onConfirm={handleConfirmSlug}
          onCancel={() => setShowPopup(false)}
          loading={mutation.isPending}
        />
      )}

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Link2 size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-100 tracking-tight">Snip</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap size={12} />
            Free URL shortener with analytics
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            Short links,{' '}
            <span className="gradient-text">big impact</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
            Paste URL panjangmu, beri nama yang mudah diingat, dan bagikan. Tanpa akun.
          </p>
        </motion.div>

        {/* URL form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="card p-4 shadow-2xl shadow-black/40">
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL panjangmu di sini…"
                required
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={mutation.isPending || !url.trim()}
                className="btn-primary whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={15} />
                Persingkat
              </button>
            </div>

            {/* Hint */}
            {!result && (
              <p className="text-xs text-zinc-600 mt-3 text-left">
                Klik <span className="text-zinc-400 font-medium">Persingkat</span> → isi nama alias → link siap dibagikan ✨
              </p>
            )}

            {/* Result card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 bg-zinc-800/60 rounded-xl p-4 border border-zinc-700"
                >
                  {/* Short URL */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500 mb-0.5">Short link kamu 🎉</p>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-400 font-semibold text-sm hover:text-violet-300 transition-colors flex items-center gap-1.5 truncate"
                      >
                        {shortUrl}
                        <ExternalLink size={12} className="flex-shrink-0" />
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await copy(shortUrl)
                        toast.success('Link disalin!')
                      }}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${copied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Disalin!' : 'Salin'}
                    </button>
                  </div>

                  {/* Original URL */}
                  <div className="bg-zinc-900/60 rounded-lg px-3 py-2 border border-zinc-800">
                    <p className="text-xs text-zinc-600 mb-0.5">Mengarah ke</p>
                    <p className="text-zinc-400 text-xs truncate">{result.originalUrl}</p>
                  </div>

                  {/* Buat lagi */}
                  <button
                    type="button"
                    onClick={() => { setResult(null); setUrl('') }}
                    className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
                  >
                    + Persingkat URL lain
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="card hover:border-zinc-700 transition-all duration-200 group hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                <Icon size={18} className="text-violet-400" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-zinc-900/80 to-blue-600/10"
        >
          <h2 className="text-2xl font-bold text-zinc-100 mb-3">Ready to track every click?</h2>
          <p className="text-zinc-400 text-sm mb-6">Buat akun gratis untuk analytics lengkap, kelola semua link, dan lebih banyak lagi.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            Buat akun gratis
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-6 text-center text-zinc-600 text-xs">
        © {new Date().getFullYear()} Snip. Built with React &amp; Tailwind CSS.
      </footer>
    </div>
  )
}
