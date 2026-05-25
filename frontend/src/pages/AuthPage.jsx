import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shield, Crown, Users, Trophy, ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import api from '../api/axios'

const ROLE_CONFIG = {
  admin: {
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    accent: '#1B3A6B',
    light: '#EEF2FA',
    heroGradient: 'from-[#1B3A6B] to-[#0D1F3C]',
  },
  head_jury: {
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    accent: '#7F3F98',
    light: '#F5EEF8',
    heroGradient: 'from-[#7F3F98] to-[#5B2D6E]',
  },
  jury: {
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    accent: '#0077B6',
    light: '#E8F4FD',
    heroGradient: 'from-[#0077B6] to-[#005a8a]',
  },
}

export default function AuthPage({ onLogin }) {
  const { role } = useParams()
  const navigate = useNavigate()
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.jury

  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await api.post('/auth/register', { username: form.username, email: form.email, password: form.password, role })
        setSuccess('Account created! You can now sign in.')
        setMode('login')
        setForm({ username: '', email: '', password: '', confirmPassword: '' })
      } else {
        const { data } = await api.post('/auth/login', { username: form.username, password: form.password })
        onLogin(data.access_token, data.role, form.username)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const Icon = config.icon

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex">
      {/* Left panel — branded */}
      <div className={`hidden lg:flex lg:w-5/12 bg-gradient-to-br ${config.heroGradient} flex-col justify-between p-12 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-white text-base">NobleCrest.AI</span>
            <div className="text-white/50 text-xs">Powered by KPMG</div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white mb-4 leading-tight">{config.title}<br />Portal</h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">{config.subtitle} — access your personalised dashboard and manage the awards process.</p>
        </div>

        <div className="relative z-10 text-white/40 text-xs">© 2025 KPMG. All rights reserved.</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-14 bg-white">
        <div className="max-w-md w-full mx-auto">
          <button onClick={() => navigate('/select-role')} className="flex items-center gap-2 text-gray-400 hover:text-[#00338D] transition-colors mb-10 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to role selection
          </button>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={mode === m ? { backgroundColor: config.accent, color: 'white' } : { color: '#6b7280' }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#1a1a2e] mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? `Sign in to your ${config.title} account` : `Register as ${config.title} to get started`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={set('username')}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
                style={{ '--tw-ring-color': config.accent }}
                onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
                onBlur={e => e.target.style.boxShadow = ''}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
                  onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
                  onBlur={e => e.target.style.boxShadow = ''}
                  required
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
                onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
                onBlur={e => e.target.style.boxShadow = ''}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
                  onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
                  onBlur={e => e.target.style.boxShadow = ''}
                  required
                />
              </div>
            )}

            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            {success && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: config.accent }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="font-semibold hover:underline"
              style={{ color: config.accent }}
            >
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
