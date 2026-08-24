import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shield, Crown, Users, ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import api from '../api/axios'
import LogoPair from '../components/layout/LogoPair'
import ThemeToggle from '../components/layout/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const ROLE_CONFIG = {
  admin:     { icon: Shield, title: 'Administrator',  org: 'KPMG',  useKpmg: true,  subtitle: 'Platform Administration & Oversight' },
  head_jury: { icon: Crown,  title: 'Head Jury',      org: 'AIMA',  useKpmg: false, subtitle: 'Senior Evaluation & Final Certification' },
  jury:      { icon: Users,  title: 'Jury Member',    org: 'AIMA',  useKpmg: false, subtitle: 'Nominee Evaluation & Scoring' },
}

function AimaWordmark() {
  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>AIMA</div>
      <div style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 4 }}>All India Management Association</div>
    </div>
  )
}

export default function AuthPage({ onLogin }) {
  const { role } = useParams()
  const nav = useNavigate()
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.jury
  const { theme } = useTheme()
  const isAima = theme === 'aima'
  const panelBg      = isAima ? '#FFFFFF' : 'var(--kpmg-navy)'
  const panelBorder  = isAima ? '1px solid var(--border-light)' : 'none'
  const shapeColor    = isAima ? 'rgba(0,51,141,0.06)' : 'rgba(255,255,255,0.05)'
  const shapeColor2   = isAima ? 'rgba(0,51,141,0.04)' : 'rgba(255,255,255,0.04)'
  const orgLabelColor = isAima ? '#9A7B1F' : 'var(--gold)'
  const titleColor    = isAima ? 'var(--kpmg-navy)' : '#fff'
  const titleSubColor = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.35)'
  const subtitleColor = isAima ? 'var(--text-secondary)' : 'rgba(255,255,255,0.45)'
  const bulletColor   = isAima ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)'
  const footerColor   = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.18)'
  const logoVariant   = isAima ? 'light' : 'dark'

  const [mode, setMode]     = useState('login')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]     = useState({ username: '', email: '', password: '', confirmPassword: '' })

  const set = f => e => setForm({ ...form, [f]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess('')
    if (mode === 'register' && form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.post('/auth/register', { username: form.username, email: form.email, password: form.password, role })
        setSuccess('Account created. You may now sign in.')
        setMode('login')
        setForm({ username: '', email: '', password: '', confirmPassword: '' })
      } else {
        const { data } = await api.post('/auth/login', { username: form.username, password: form.password })
        onLogin(data.access_token, data.role, form.username)
      }
    } catch (err) { setError(err.response?.data?.detail || 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left: branded panel ── */}
      <div style={{
        width: 420, flexShrink: 0,
        background: panelBg,
        borderRight: panelBorder,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '36px 44px', position: 'relative', overflow: 'hidden',
        transition: 'background 0.2s',
      }}>
        {/* Geometric shapes */}
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, border: `1px solid ${shapeColor}`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 20, right: -90, width: 300, height: 300, border: `1px solid ${shapeColor2}`, borderRadius: '50%' }} />
        {/* Gold left edge */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, var(--gold), transparent)' }} />

        {/* Logo + theme toggle */}
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <LogoPair variant={logoVariant} kpmgHeight={28} aimaHeight={32} gap={12} />
          <ThemeToggle variant={isAima ? 'light' : 'dark'} size="xs" />
        </div>

        {/* Center content */}
        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 32, height: 2, background: 'var(--gold)', opacity: 0.7 }} />
            <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: orgLabelColor, opacity: 0.9, fontWeight: 600 }}>{cfg.org}</span>
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 38, fontWeight: 500,
            color: titleColor, lineHeight: 1.12,
            letterSpacing: '-0.01em', marginBottom: 16,
          }}>
            {cfg.title}<br />
            <span style={{ color: titleSubColor, fontSize: 32 }}>Portal</span>
          </h2>

          <p style={{ color: subtitleColor, fontSize: 13, lineHeight: 1.7, fontWeight: isAima ? 400 : 300, maxWidth: 280, marginBottom: 36 }}>
            {cfg.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Secure, role-based access', 'Real-time evaluation data', 'Full audit trail'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 4, background: 'var(--gold)', opacity: 0.7 }} />
                <span style={{ color: bulletColor, fontSize: 12, fontWeight: isAima ? 400 : 300 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, color: footerColor, letterSpacing: '0.04em' }}>
          © 2026 KPMG in India · All rights reserved
        </div>
      </div>

      {/* ── Right: form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F4F5F7', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Back */}
          <button onClick={() => nav('/select-role')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
            marginBottom: 36, padding: 0, letterSpacing: '0.02em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--kpmg-blue)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={13} /> Back to role selection
          </button>

          {/* Mode toggle (admin only) */}
          {role === 'admin' && (
            <div style={{ display: 'flex', background: 'var(--border-light)', padding: 3, gap: 3, marginBottom: 28 }}>
              {[['login','Sign In'],['register','Register']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                  flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
                  background: mode === m ? 'var(--kpmg-blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26, fontWeight: 600,
              color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', marginBottom: 6,
            }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {mode === 'login' ? `${cfg.title} · ${cfg.org}` : `Register as ${cfg.title}`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <Field icon={User} placeholder="Username" type="text"
              value={form.username} onChange={set('username')} required />

            {mode === 'register' && (
              <Field icon={Mail} placeholder="Email address" type="email"
                value={form.email} onChange={set('email')} required />
            )}

            <Field icon={Lock} placeholder="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password} onChange={set('password')} required
              suffix={
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {mode === 'register' && (
              <Field icon={Lock} placeholder="Confirm password"
                type={showPw ? 'text' : 'password'}
                value={form.confirmPassword} onChange={set('confirmPassword')} required />
            )}

            {error && (
              <div style={{ padding: '10px 12px', background: '#FEF2F2', borderLeft: '3px solid #DC2626', fontSize: 12, color: '#DC2626' }}>{error}</div>
            )}
            {success && (
              <div style={{ padding: '10px 12px', background: '#F0FDF4', borderLeft: '3px solid #16A34A', fontSize: 12, color: '#16A34A' }}>{success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px',
              background: loading ? '#9BA8B5' : 'var(--kpmg-blue)',
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 2, transition: 'background 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-navy)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-blue)' }}>
              {loading && <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {role === 'admin' && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 18 }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                style={{ color: 'var(--kpmg-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, suffix, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={14} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: focused ? 'var(--kpmg-blue)' : 'var(--text-muted)',
        transition: 'color 0.15s',
      }} />
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%', padding: '10px 12px 10px 36px',
          background: '#fff',
          border: `1px solid ${focused ? 'var(--kpmg-blue)' : 'var(--border)'}`,
          borderLeft: `2px solid ${focused ? 'var(--kpmg-blue)' : 'var(--border)'}`,
          fontSize: 13, color: 'var(--text-primary)',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
          ...(props.suffix ? { paddingRight: 40 } : {}),
        }}
      />
      {suffix}
    </div>
  )
}
