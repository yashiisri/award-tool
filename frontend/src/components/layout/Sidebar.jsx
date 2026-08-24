import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, ArrowLeft } from 'lucide-react'
import LogoPair from './LogoPair'

const ROLE_META = {
  admin:     { label: 'Administrator', org: 'KPMG' },
  head_jury: { label: 'Head Jury',     org: 'AIMA' },
  jury:      { label: 'Jury Member',   org: 'AIMA' },
}
const PILL_BG   = 'rgba(255,255,255,0.12)'
const PILL_TEXT = 'rgba(255,255,255,0.85)'

export default function Sidebar({ navItems, role, username, onLogout, showBackButton }) {
  const location = useLocation()
  const navigate = useNavigate()
  const meta = ROLE_META[role] || ROLE_META.jury
  const initial = (username || meta.label)?.[0]?.toUpperCase()

  return (
    <aside style={{
      width: 280,
      flexShrink: 0,
      background: 'var(--kpmg-navy)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {showBackButton && (
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500,
            borderBottom: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.02em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}

      {/* Logo area */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, var(--gold), transparent 80%)' }} />
        <LogoPair variant="dark" kpmgHeight={30} aimaHeight={34} gap={12} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10 }}>
          Managing India Awards
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', marginTop: 2 }}>
          Powered in partnership with KPMG
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--kpmg-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {username || meta.label}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 4, padding: '2px 8px',
            background: PILL_BG, color: PILL_TEXT,
            fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
          }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '18px 20px 8px', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
        Navigation
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ path, basePath, icon: Icon, label, badge }) => {
          const active = location.pathname === (basePath || path)
          return (
            <Link
              key={basePath || path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px',
                textDecoration: 'none',
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeft: `3px solid ${active ? 'var(--gold)' : 'transparent'}`,
                transition: 'all 0.15s ease',
                letterSpacing: active ? '0' : '0.01em',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
            >
              <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ padding: '1px 7px', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 400,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#FCA5A5' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
