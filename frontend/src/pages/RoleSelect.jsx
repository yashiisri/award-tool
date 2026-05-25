import { useNavigate } from 'react-router-dom'
import { Shield, Crown, Users, ChevronRight, ArrowLeft } from 'lucide-react'

const ROLES = [
  {
    role: 'admin',
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    desc: 'Full control over categories, nominees, vote periods, and audit logs.',
  },
  {
    role: 'head_jury',
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    desc: 'Oversee nominations, review jury feedback, and manage award decisions.',
  },
  {
    role: 'jury',
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    desc: 'Validate nominees, score candidates, and submit structured feedback.',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F9FC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>

      {/* Back */}
      <div style={{ position: 'fixed', top: 24, left: 32 }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#9BA8B5', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#00338D'}
          onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '5px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20 }}>
          <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Access Portal</span>
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#0A1628', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 12 }}>
          Select your role
        </h1>
        <p style={{ color: '#9BA8B5', fontSize: 16, fontWeight: 400, lineHeight: 1.6 }}>
          Choose how you will be accessing the platform today.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, width: '100%', maxWidth: 900 }}>
        {ROLES.map(({ role, icon: Icon, title, subtitle, desc }) => (
          <div
            key={role}
            onClick={() => navigate(`/login/${role}`)}
            style={{
              background: 'white',
              border: '1px solid #E8ECF0',
              borderRadius: 16,
              padding: '36px 32px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00338D'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,51,141,0.1)'
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E8ECF0'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Icon size={24} color="#00338D" strokeWidth={1.7} />
            </div>

            <div style={{ color: '#0091DA', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{subtitle}</div>
            <h3 style={{ color: '#0A1628', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h3>
            <p style={{ color: '#6B7A8D', fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>{desc}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#B0BAC6', fontSize: 13, fontWeight: 500 }}>Sign in / Register</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={15} color="#00338D" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
