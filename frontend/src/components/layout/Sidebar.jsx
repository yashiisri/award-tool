import { Link, useLocation } from 'react-router-dom'
import { LogOut, Trophy } from 'lucide-react'

const ROLE_META = {
  admin:     { label: 'Administrator', accent: '#00338D', light: '#EEF2FA' },
  head_jury: { label: 'Head Jury',     accent: '#7F3F98', light: '#F5EEF8' },
  jury:      { label: 'Jury Member',   accent: '#0091DA', light: '#EAF5FC' },
}

export default function Sidebar({ navItems, role, username, onLogout }) {
  const location = useLocation()
  const meta = ROLE_META[role] || ROLE_META.jury

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-[#00338D] rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-black text-[#00338D] text-sm leading-tight">AIMA</div>
            <div className="text-xs text-gray-400">Powered by KPMG</div>
          </div>
        </div>

        {/* Welcome badge */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: meta.light }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ backgroundColor: meta.accent }}>
            {(username || meta.label)?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-400 leading-none">Welcome</div>
            <div className="text-sm font-bold leading-tight mt-0.5 truncate" style={{ color: meta.accent }}>
              {username || meta.label}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const active = location.pathname === path
          return (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group"
              style={active ? { backgroundColor: meta.light, color: meta.accent } : { color: '#6b7280' }}>
              <Icon className="w-4 h-4 flex-shrink-0" style={active ? { color: meta.accent } : {}} />
              <span className="flex-1">{label}</span>
              {badge && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{badge}</span>}
              {active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
