import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import LogoPair from './LogoPair'

const ROLE_META = {
  admin:     { label: 'Administrator', org: 'KPMG' },
  head_jury: { label: 'Head Jury',     org: 'AIMA' },
  jury:      { label: 'Jury Member',   org: 'AIMA' },
}

// White sidebar in the same gold-accent / navy / Playfair language as the
// sign-in screens, instead of the flat dark panel a generic dashboard
// template defaults to.
export default function Sidebar({ navItems, role, username, onLogout }) {
  const location = useLocation()
  const meta = ROLE_META[role] || ROLE_META.jury
  const initial = (username || meta.label)?.[0]?.toUpperCase()

  return (
    <aside style={{
      width: 260,
      flexShrink: 0,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRight: '1px solid var(--border-light)',
    }}>

      {/* Logo area */}
      <div style={{ padding: '20px 20px 16px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--gold), transparent 75%)' }} />
        <LogoPair variant="light" kpmgHeight={20} aimaHeight={24} gap={10} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <div style={{ width: 16, height: 1.5, background: 'var(--gold)' }} />
          <span style={{ fontSize: 9.5, color: 'var(--gold-bright)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
            Managing India Awards
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-light)' }} />

      {/* User */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 7,
          background: 'var(--kpmg-navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--kpmg-navy)', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {username || meta.label}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {meta.label} · {meta.org}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ path, basePath, icon: Icon, label, badge }) => {
          const active = location.pathname === (basePath || path)
          return (
            <Link
              key={basePath || path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 12px', borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13.5, fontWeight: active ? 600 : 400,
                color: active ? 'var(--kpmg-blue)' : 'var(--text-secondary)',
                background: active ? '#EEF3FF' : 'transparent',
                borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent' } }}
            >
              <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ padding: '1px 7px', borderRadius: 3, background: '#DC2626', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 11,
          padding: '9px 12px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 400,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
