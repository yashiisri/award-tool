import { useNavigate } from 'react-router-dom'
import { Shield, Crown, Users, ChevronRight, Trophy, ArrowLeft } from 'lucide-react'

const ROLES = [
  {
    role: 'admin',
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    desc: 'Full control over categories, nominees, vote periods, and audit logs.',
    accent: '#00338D',
    light: '#EEF2FA',
  },
  {
    role: 'head_jury',
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    desc: 'Oversee nominations, review jury feedback, and manage award decisions.',
    accent: '#7F3F98',
    light: '#F5EEF8',
  },
  {
    role: 'jury',
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    desc: 'Validate nominees, score candidates, and submit structured feedback.',
    accent: '#0091DA',
    light: '#EAF5FC',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-[#00338D] transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-[#1B3A6B] text-sm">AIMA Awards</span>
        </div>
        <div className="w-16" />
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#0091DA] uppercase tracking-widest">Access Portal</span>
          <h1 className="text-4xl md:text-5xl font-black text-[#00338D] mt-2 mb-3">Select Your Role</h1>
          <p className="text-gray-500 text-base">Choose how you'll be accessing the platform today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {ROLES.map(({ role, icon: Icon, title, subtitle, desc, accent, light }) => (
            <div
              key={role}
              onClick={() => navigate(`/login/${role}`)}
              className="group cursor-pointer bg-white border-2 border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ '--accent': accent }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110" style={{ backgroundColor: light }}>
                <Icon className="w-8 h-8 transition-colors" style={{ color: accent }} />
              </div>

              <div className="mb-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{subtitle}</span>
              </div>
              <h3 className="text-2xl font-black text-[#1a1a2e] mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">{desc}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">Sign in / Register</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform" style={{ backgroundColor: light }}>
                  <ChevronRight className="w-4 h-4" style={{ color: accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
