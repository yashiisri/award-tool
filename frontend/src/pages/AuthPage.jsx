import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shield, Crown, Users, Trophy, ArrowLeft, Eye, EyeOff, Mail, Lock, User, ChevronRight } from 'lucide-react'
import api from '../api/axios'

const ROLE_CONFIG = {
  admin: {
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    accent: '#00338D',
    gradient: 'linear-gradient(135deg, #00338D 0%, #0055A8 100%)',
  },
  head_jury: {
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    accent: '#6D28D9',
    gradient: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
  },
  jury: {
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    accent: '#0369A1',
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
  },
}

function Field({ icon: Icon, accent, delay, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', animation: `riseIn 0.4s ease both ${delay}s` }}>
      <Icon
        size={16}
        style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? accent : '#94A3B8', transition: 'color 0.2s ease' }}
      />
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '13px 16px 13px 40px',
          borderRadius: 10,
          border: `1.5px solid ${focused ? accent : '#E2E8F0'}`,
          background: focused ? 'white' : '#F8FAFC',
          color: '#0F172A',
          fontSize: 14,
          fontFamily: 'inherit',
          outline: 'none',
          boxShadow: focused ? `0 0 0 3px ${accent}18` : 'none',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      />
      {children}
    </div>
  )
}

export default function AuthPage({ onLogin }) {
  const { role } = useParams()
  const navigate = useNavigate()
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.jury

  const [mode, setMode] = useState('login')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return
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

  const Icon = cfg.icon

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F9FC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatSoft { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, -14px); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        input::placeholder { color: #94A3B8; }
        .auth-icon-box { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both; }
        .auth-submit-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .auth-submit-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.15); }
      `}</style>

      <div
        style={{
          width: '100%', maxWidth: 960, borderRadius: 20, overflow: 'hidden',
          background: 'white', border: '1px solid #E8ECF0',
          boxShadow: '0 24px 64px rgba(15,23,42,0.08)',
          display: 'flex', minHeight: 580,
          animation: 'cardIn 0.5s ease both',
        }}
        className="auth-card"
      >
        <style>{`@media (max-width: 900px) { .auth-card { flex-direction: column !important; } .auth-panel { display: none !important; } }`}</style>

        {/* Branded panel */}
        <div className="auth-panel" style={{
          width: '42%', flexShrink: 0, background: cfg.gradient,
          padding: 44, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'floatSoft 14s ease-in-out infinite' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={17} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'white', fontSize: 14, letterSpacing: '-0.01em' }}>NobleCrest.AI</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Powered by KPMG</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="auth-icon-box" style={{
              width: 64, height: 64, borderRadius: 16, marginBottom: 24,
              background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={28} color="white" />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>
              {cfg.title} Portal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>
              {cfg.subtitle} — access your personalised dashboard and manage the awards process.
            </p>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, position: 'relative' }}>© 2026 KPMG. All rights reserved.</div>
        </div>

        {/* Form panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px' }}>
          <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
            <button
              onClick={() => navigate('/select-role')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                color: '#94A3B8', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: 28,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = cfg.accent}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              <ArrowLeft size={14} /> Back to role selection
            </button>

            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 28 }}>
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s ease',
                    background: mode === m ? cfg.accent : 'transparent',
                    color: mode === m ? 'white' : '#64748B',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p style={{ fontSize: 13.5, color: '#94A3B8' }}>
                {mode === 'login' ? `Sign in to your ${cfg.title} account` : `Register as ${cfg.title} to get started`}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field icon={User} accent={cfg.accent} delay={0.05}
                type="text" placeholder="Username" value={form.username} onChange={set('username')} required />

              {mode === 'register' && (
                <Field icon={Mail} accent={cfg.accent} delay={0.1}
                  type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
              )}

              <Field icon={Lock} accent={cfg.accent} delay={0.15}
                type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required>
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </Field>

              {mode === 'register' && (
                <Field icon={Lock} accent={cfg.accent} delay={0.2}
                  type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
              )}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', fontSize: 13 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 13 }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  background: cfg.gradient, color: 'white', fontSize: 14, fontWeight: 700,
                  fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, marginTop: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'} <ChevronRight size={15} />
                  </>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 20 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: cfg.accent, fontSize: 13, fontFamily: 'inherit' }}
              >
                {mode === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
