import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Link2, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})   // { email?, password?, confirm?, form? }

  // Validasi lokal sebelum hit API
  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Format email tidak valid'
    if (!password) e.password = 'Password wajib diisi'
    else if (password.length < 6) e.password = 'Password minimal 6 karakter'
    if (!confirm) e.confirm = 'Konfirmasi password wajib diisi'
    else if (confirm !== password) e.confirm = 'Password tidak cocok'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()       // ← tidak refresh page
    e.stopPropagation()

    const localErrs = validate()
    if (Object.keys(localErrs).length) {
      setErrors(localErrs)
      return
    }
    // Jangan setErrors({}) — error lama tetap tampil sampai ada response baru

    try {
      await register({ email, password })
      toast.success('Akun berhasil dibuat! Selamat datang 🎉')
      navigate('/dashboard')
    } catch (err) {
      const code = err?.response?.data?.error?.code
      const serverMsg = err?.response?.data?.error?.message

      if (code === 'AUTH_EMAIL_TAKEN') {
        const msg = serverMsg || 'Email sudah terdaftar, silakan login'
        setErrors({ email: msg })
        toast.error(msg)
      } else if (code === 'VALIDATION_ERROR') {
        // Petakan detail validasi Zod ke field masing-masing
        const details = err?.response?.data?.error?.details || []
        if (details.length) {
          const fieldErrs = {}
          details.forEach((d) => { fieldErrs[d.field] = d.message })
          setErrors(fieldErrs)
        } else {
          setErrors({ form: serverMsg || 'Data tidak valid' })
        }
      } else {
        const msg = serverMsg || 'Gagal membuat akun, coba lagi'
        setErrors({ form: msg })
        toast.error(msg)
      }
    }
  }

  const clearErr = (field) => setErrors((p) => ({ ...p, [field]: '' }))

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        layout={false}
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Link2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-100">Alsnip</span>
        </Link>

        <div className="relative">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-violet-600/40 via-blue-600/20 to-cyan-600/20 blur-sm" />
          <div className="relative card">
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Buat akun</h1>
            <p className="text-zinc-500 text-sm mb-6">Mulai persingkat link secara gratis</p>

            {/* Banner error umum */}
            {errors.form && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl mb-4"
              >
                {errors.form}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErr('email') }}
                  placeholder="you@example.com"
                  className={`input-field ${errors.email ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    ⚠ {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearErr('password') }}
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    ⚠ {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Konfirmasi Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearErr('confirm') }}
                  placeholder="••••••••"
                  className={`input-field ${errors.confirm ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
                {errors.confirm && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                  >
                    ⚠ {errors.confirm}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Mendaftar…' : 'Buat akun'}
              </button>
            </form>

            <p className="text-zinc-500 text-sm text-center mt-5">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
