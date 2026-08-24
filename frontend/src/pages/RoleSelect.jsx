import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import kpmgLogo from '../kpmg-logo.svg'
import aimaLogo from '../aima-logo.png'
import LogoPair from '../components/layout/LogoPair'
import ThemeToggle from '../components/layout/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const ROLES = [
  {
    role: 'head_jury',
    org: 'AIMA',
    title: 'Head Jury',
    desc: 'Consolidate jury scores, oversee the evaluation process and certify final rankings.',
    useKpmg: false,
  },
  {
    role: 'jury',
    org: 'AIMA',
    title: 'Jury Member',
    desc: 'Review approved nominees, evaluate against defined criteria and submit your rankings.',
    useKpmg: false,
  },
]

function RoleCard({ role, org, title, desc, useKpmg }) {
  const nav = useNavigate()
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={() => nav(`/login/${role}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#A8BBDA' : 'var(--border-light)'}`,
        borderTop: `3px solid ${hov ? 'var(--kpmg-blue)' : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hov ? '0 12px 36px rgba(0,32,91,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        transform: hov ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Logo area */}
      <div style={{
        padding: '32px 28px 28px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 100,
        background: hov ? '#F8FAFF' : '#FAFBFD',
        transition: 'background 0.18s',
      }}>
        <img
          src={useKpmg ? kpmgLogo : aimaLogo}
          alt={useKpmg ? 'KPMG' : 'AIMA'}
          style={{ height: useKpmg ? 44 : 52, width: 'auto', objectFit: 'contain', maxWidth: '80%' }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--kpmg-blue)', marginBottom: 6, opacity: 0.7 }}>{org}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--kpmg-navy)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1 }}>{desc}</p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 16, marginTop: 4,
          borderTop: '1px solid var(--border-light)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: hov ? 'var(--kpmg-blue)' : 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'color 0.15s' }}>
            Sign In
          </span>
          <div style={{
            width: 30, height: 30,
            background: hov ? 'var(--kpmg-blue)' : 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
          }}>
            <ArrowRight size={14} color={hov ? '#fff' : 'var(--text-muted)'} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleSelect() {
  const nav = useNavigate()
  const { theme } = useTheme()
  const isAima = theme === 'aima'

  const pageBg     = isAima ? '#FFFFFF' : 'var(--kpmg-navy)'
  const headerBorder = isAima ? '1px solid var(--border-light)' : '1px solid rgba(255,255,255,0.08)'
  const dividerColor = isAima ? 'var(--border)' : 'rgba(255,255,255,0.15)'
  const navSubText   = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.45)'
  const backBtnBorder = isAima ? 'var(--border)' : 'rgba(255,255,255,0.2)'
  const backBtnText   = isAima ? 'var(--text-secondary)' : 'rgba(255,255,255,0.6)'
  const headingColor  = isAima ? 'var(--kpmg-navy)' : '#fff'
  const bodyColor     = isAima ? 'var(--text-secondary)' : 'rgba(255,255,255,0.4)'
  const eyebrowText   = isAima ? '#9A7B1F' : 'var(--gold)'
  const footerLine    = isAima ? 'var(--border)' : 'rgba(255,255,255,0.15)'
  const footerText    = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.2)'
  const logoVariant   = isAima ? 'light' : 'dark'

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.2s',
    }}>
      {/* Top bar */}
      <header style={{ padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: headerBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoPair variant={logoVariant} kpmgHeight={26} aimaHeight={30} gap={12} />
          <div style={{ width: 1, height: 20, background: dividerColor }} />
          <span style={{ color: navSubText, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Managing India Awards</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ThemeToggle variant={isAima ? 'light' : 'dark'} size="xs" />
          <button onClick={() => nav('/')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: `1px solid ${backBtnBorder}`,
            color: backBtnText, fontSize: 12, cursor: 'pointer',
            padding: '6px 14px', letterSpacing: '0.02em', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = isAima ? 'var(--kpmg-blue)' : 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = isAima ? 'var(--kpmg-blue)' : '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = backBtnBorder; e.currentTarget.style.color = backBtnText }}>
            <ArrowLeft size={12} /> Back
          </button>
        </div>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>

        {/* Gold rule + heading */}
        <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: eyebrowText, opacity: 0.9 }}>Select Your Role</span>
            <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 500,
            color: headingColor,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            marginBottom: 12,
          }}>
            How will you be<br />accessing the platform?
          </h1>
          <p style={{ color: bodyColor, fontSize: 14, fontWeight: isAima ? 400 : 300, lineHeight: 1.6 }}>
            Each role provides a purpose-built workspace with the appropriate access and tools.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%', maxWidth: 620 }}>
          {ROLES.map(r => <RoleCard key={r.role} {...r} />)}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 44, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 1, background: footerLine }} />
          <span style={{ color: footerText, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secured · Auditable · Enterprise-Grade</span>
          <div style={{ width: 24, height: 1, background: footerLine }} />
        </div>

        {/* Low-key administrator entry — intentionally not a card; platform ops only */}
        <button
          onClick={() => nav('/login/admin')}
          style={{
            marginTop: 22, background: 'none', border: 'none', cursor: 'pointer',
            color: footerText, fontSize: 11, letterSpacing: '0.04em', padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = footerText}
        >
          Administrator sign-in
        </button>
      </div>
    </div>
  )
}
