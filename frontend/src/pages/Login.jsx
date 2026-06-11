import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Link2, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})   // { email?, password?, form? }

  // Validasi lokal sebelum hit API
  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email wajib diisi'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Format email tidak valid'
    if (!password) e.password = 'Password wajib diisi'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()  
    e.stopPropagation()

    const localErrs = validate()
    if (Object.keys(localErrs).length) {
      setErrors(localErrs)
      return
    }

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      const code = err?.response?.data?.error?.code
      const serverMsg = err?.response?.data?.error?.message

      if (code === 'AUTH_EMAIL_NOT_FOUND') {
        const msg = serverMsg || 'Email tidak terdaftar'
        setErrors({ email: msg })
        toast.error(msg)
      } else if (code === 'AUTH_WRONG_PASSWORD') {
        const msg = serverMsg || 'Password salah'
        setErrors({ password: msg })
        toast.error(msg)
      } else {
        const msg = serverMsg || 'Terjadi kesalahan, coba lagi'
        setErrors({ form: msg })
        toast.error(msg)
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/10 blur-[100px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <Link2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-100">Alsnip</span>
        </Link>

        <div className="relative">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-violet-600/40 via-blue-600/20 to-cyan-600/20 blur-sm" />
          <div className="relative card">
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Welcome back</h1>
            <p className="text-zinc-500 text-sm mb-6">Sign in to your account</p>

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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((p) => ({ ...p, email: '' }))
                  }}
                  placeholder="you@example.com"
                  className={`input-field ${errors.email ? 'border-red-500/60 focus:border-red-500' : ''}`}
                />
                {errors.email && (
                  <p
                    className="text-red-400 text-xs mt-1"
                  >
                    ⚠ {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                    }}
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
                  <p
                    className="text-red-400 text-xs mt-1"
                  >
                    ⚠ {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Masuk…' : 'Sign in'}
              </button>
            </form>

            <p className="text-zinc-500 text-sm text-center mt-5">
              Belum punya akun?{' '}
              <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Daftar gratis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
