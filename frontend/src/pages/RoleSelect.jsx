import { useNavigate } from 'react-router-dom'
import { Shield, Crown, Users, ChevronRight, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

const ROLES = [
  {
    role: 'admin',
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    desc: 'Full control over categories, nominees, vote periods, and audit logs.',
    accent: '#00338D',
    light: '#EEF3FF',
  },
  {
    role: 'head_jury',
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    desc: 'Oversee nominations, review jury feedback, and manage award decisions.',
    accent: '#6D28D9',
    light: '#F3F0FF',
  },
  {
    role: 'jury',
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    desc: 'Validate nominees, score candidates, and submit structured feedback.',
    accent: '#0891B2',
    light: '#ECFEFF',
  },
]

function RoleCard({ role, icon: Icon, title, subtitle, desc, accent, light, index, visible }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => navigate(`/login/${role}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 18,
        padding: '32px 28px',
        cursor: 'pointer',
        background: 'white',
        border: `1px solid ${hovered ? accent + '40' : '#E8ECF0'}`,
        boxShadow: hovered ? `0 16px 36px ${accent}1A` : '0 1px 3px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        opacity: visible ? 1 : 0,
        transition: `border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.5s ease ${index * 80}ms`,
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, marginBottom: 22,
        background: light,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <Icon size={23} color={accent} strokeWidth={1.7} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        {subtitle}
      </div>
      <h3 style={{ color: '#0A1628', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h3>
      <p style={{ color: '#6B7A8D', fontSize: 14, lineHeight: 1.75, marginBottom: 26 }}>{desc}</p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 18, borderTop: '1px solid #F0F2F5',
      }}>
        <span style={{ color: '#9BA8B5', fontSize: 13, fontWeight: 500 }}>Sign in / Register</span>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: hovered ? accent : '#F4F6F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hovered ? 'translateX(3px)' : 'translateX(0)',
          transition: 'background 0.2s ease, transform 0.2s ease',
        }}>
          <ChevronRight size={15} color={hovered ? 'white' : '#B0BAC6'} />
        </div>
      </div>
    </div>
  )
}

export default function RoleSelect() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F9FC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -18px) scale(1.05); }
        }
      `}</style>
      <div aria-hidden style={{
        position: 'absolute', top: '-10%', right: '-6%', width: 420, height: 420,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,51,141,0.06), transparent 70%)',
        animation: 'floatBlob 18s ease-in-out infinite', pointerEvents: 'none', zIndex: -1,
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: '-12%', left: '-6%', width: 360, height: 360,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.05), transparent 70%)',
        animation: 'floatBlob 22s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: -1,
      }} />

      <div style={{ position: 'fixed', top: 24, left: 32 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #E8ECF0',
            color: '#6B7A8D', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00338D'; e.currentTarget.style.borderColor = '#C7D2FE' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7A8D'; e.currentTarget.style.borderColor = '#E8ECF0' }}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <div style={{
        textAlign: 'center', marginBottom: 48,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.5s ease',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          padding: '5px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20,
        }}>
          <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Access Portal</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
          Select your role
        </h1>
        <p style={{ color: '#8A95A3', fontSize: 15.5, fontWeight: 400, lineHeight: 1.6 }}>
          Choose how you'll be accessing the platform today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, width: '100%', maxWidth: 920 }}>
        {ROLES.map((r, i) => <RoleCard key={r.role} {...r} index={i} visible={visible} />)}
      </div>
    </div>
  )
}
