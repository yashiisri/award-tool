// import { useNavigate } from 'react-router-dom'
// import { Shield, Crown, Users, ChevronRight, ArrowLeft } from 'lucide-react'

// const ROLES = [
//   {
//     role: 'admin',
//     icon: Shield,
//     title: 'Admin',
//     subtitle: 'Platform Administrator',
//     desc: 'Full control over categories, nominees, vote periods, and audit logs.',
//   },
//   {
//     role: 'head_jury',
//     icon: Crown,
//     title: 'Head Jury',
//     subtitle: 'Senior Evaluator',
//     desc: 'Oversee nominations, review jury feedback, and manage award decisions.',
//   },
//   {
//     role: 'jury',
//     icon: Users,
//     title: 'Jury',
//     subtitle: 'Evaluator',
//     desc: 'Validate nominees, score candidates, and submit structured feedback.',
//   },
// ]

// export default function RoleSelect() {
//   const navigate = useNavigate()

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: '#F7F9FC',
//       fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
//       display: 'flex',
//       flexDirection: 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: '24px',
//     }}>

//       {/* Back */}
//       <div style={{ position: 'fixed', top: 24, left: 32 }}>
//         <button
//           onClick={() => navigate('/')}
//           style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#9BA8B5', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
//           onMouseEnter={e => e.currentTarget.style.color = '#00338D'}
//           onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}
//         >
//           <ArrowLeft size={15} /> Back
//         </button>
//       </div>

//       {/* Header */}
//       <div style={{ textAlign: 'center', marginBottom: 52 }}>
//         <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '5px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20 }}>
//           <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Access Portal</span>
//         </div>
//         <h1 style={{ fontSize: 52, fontWeight: 900, color: '#0A1628', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 12 }}>
//           Select your role
//         </h1>
//         <p style={{ color: '#9BA8B5', fontSize: 16, fontWeight: 400, lineHeight: 1.6 }}>
//           Choose how you will be accessing the platform today.
//         </p>
//       </div>

//       {/* Cards */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, width: '100%', maxWidth: 900 }}>
//         {ROLES.map(({ role, icon: Icon, title, subtitle, desc }) => (
//           <div
//             key={role}
//             onClick={() => navigate(`/login/${role}`)}
//             style={{
//               background: 'white',
//               border: '1px solid #E8ECF0',
//               borderRadius: 16,
//               padding: '36px 32px',
//               cursor: 'pointer',
//               transition: 'all 0.2s ease',
//             }}
//             onMouseEnter={e => {
//               e.currentTarget.style.borderColor = '#00338D'
//               e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,51,141,0.1)'
//               e.currentTarget.style.transform = 'translateY(-3px)'
//             }}
//             onMouseLeave={e => {
//               e.currentTarget.style.borderColor = '#E8ECF0'
//               e.currentTarget.style.boxShadow = 'none'
//               e.currentTarget.style.transform = 'translateY(0)'
//             }}
//           >
//             <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
//               <Icon size={24} color="#00338D" strokeWidth={1.7} />
//             </div>

//             <div style={{ color: '#0091DA', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{subtitle}</div>
//             <h3 style={{ color: '#0A1628', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h3>
//             <p style={{ color: '#6B7A8D', fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>{desc}</p>

//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//               <span style={{ color: '#B0BAC6', fontSize: 13, fontWeight: 500 }}>Sign in / Register</span>
//               <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                 <ChevronRight size={15} color="#00338D" />
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }



import { useNavigate } from 'react-router-dom'
import { Shield, Crown, Users, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const ROLES = [
  {
    role: 'admin',
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    desc: 'Full control over categories, nominees, vote periods, and audit logs.',
    accent: '#00338D',
    light: '#EEF3FF',
    mid: '#DDEAFF',
    glow: 'rgba(0,51,141,0.12)',
    tag: 'Full Access',
  },
  {
    role: 'head_jury',
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    desc: 'Oversee nominations, review jury feedback, and manage award decisions.',
    accent: '#6D28D9',
    light: '#F3F0FF',
    mid: '#E8E0FF',
    glow: 'rgba(109,40,217,0.12)',
    tag: 'Senior Role',
  },
  {
    role: 'jury',
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    desc: 'Validate nominees, score candidates, and submit structured feedback.',
    accent: '#0891B2',
    light: '#ECFEFF',
    mid: '#CFFAFE',
    glow: 'rgba(8,145,178,0.12)',
    tag: 'Evaluator',
  },
]

function RoleCard({ role, icon: Icon, title, subtitle, desc, accent, light, mid, glow, tag, index }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [clicked, setClicked] = useState(false)
  const [visible, setVisible] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300 + index * 130)
    return () => clearTimeout(t)
  }, [index])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
  }

  const handleClick = () => {
    setClicked(true)
    setTimeout(() => navigate(`/login/${role}`), 380)
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 24,
        padding: '36px 32px 32px',
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered
            ? `translateY(-12px) perspective(800px) rotateX(${(mousePos.y - 0.5) * -5}deg) rotateY(${(mousePos.x - 0.5) * 5}deg)`
            : clicked ? 'scale(0.97)' : 'translateY(0)'
          : 'translateY(50px)',
        transition: visible
          ? hovered
            ? 'transform 0.12s ease, box-shadow 0.2s ease'
            : clicked ? 'transform 0.18s ease' : 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease'
          : `opacity 0.7s ease ${index * 130 + 300}ms, transform 0.7s cubic-bezier(0.23,1,0.32,1) ${index * 130 + 300}ms`,
        background: hovered
          ? `linear-gradient(160deg, ${light}, white 60%)`
          : 'white',
        border: `1.5px solid ${hovered ? accent + '28' : '#EEF0F4'}`,
        boxShadow: hovered
          ? `0 32px 64px ${glow}, 0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px ${accent}18`
          : '0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Spotlight glow on hover */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24,
        background: hovered
          ? `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${light}CC, transparent 60%)`
          : 'none',
        transition: 'background 0.1s ease',
      }} />

      {/* Animated top border line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        borderRadius: '24px 24px 0 0',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
        transition: 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.23,1,0.32,1)',
        transformOrigin: 'center',
      }} />

      {/* Corner tag */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        padding: '4px 10px',
        background: hovered ? mid : '#F4F6F9',
        border: `1px solid ${hovered ? accent + '30' : '#E8ECF0'}`,
        borderRadius: 20,
        fontSize: 10, fontWeight: 700, color: hovered ? accent : '#9BA8B5',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        transition: 'all 0.3s ease',
        fontFamily: "'DM Mono', monospace",
      }}>{tag}</div>

      {/* Icon */}
      <div style={{
        width: 58, height: 58, borderRadius: 18, marginBottom: 26,
        background: hovered ? accent : light,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        transform: hovered ? 'scale(1.08) rotate(-6deg)' : 'scale(1) rotate(0)',
        boxShadow: hovered ? `0 12px 32px ${glow}, 0 4px 12px ${glow}` : 'none',
        position: 'relative',
      }}>
        {hovered && (
          <div style={{
            position: 'absolute', inset: -5, borderRadius: 22,
            border: `1.5px solid ${accent}35`,
            animation: 'icon-ring 1.2s ease-out infinite',
          }} />
        )}
        <Icon size={26} color={hovered ? 'white' : accent} strokeWidth={1.6} style={{ transition: 'all 0.3s ease' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: hovered ? accent : '#9BA8B5',
          marginBottom: 8, transition: 'color 0.3s ease',
          fontFamily: "'DM Mono', monospace",
        }}>{subtitle}</div>

        <h3 style={{
          fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1,
          color: hovered ? '#0A1628' : '#1A2535',
          marginBottom: 12, transition: 'color 0.3s ease',
        }}>{title}</h3>

        <p style={{
          fontSize: 14, lineHeight: 1.8, marginBottom: 28,
          color: hovered ? '#4A5A6D' : '#8A95A3',
          transition: 'color 0.3s ease',
        }}>{desc}</p>

        {/* CTA row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 20,
          borderTop: `1px solid ${hovered ? accent + '18' : '#F0F2F5'}`,
          transition: 'border-color 0.3s ease',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: hovered ? accent : '#B0BAC6',
            transition: 'color 0.3s ease', letterSpacing: '-0.005em',
          }}>
            Sign in / Register
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: hovered ? accent : '#F4F6F9',
            border: `1px solid ${hovered ? 'transparent' : '#E8ECF0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
            transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            boxShadow: hovered ? `0 6px 20px ${glow}` : 'none',
          }}>
            <ChevronRight size={15} color={hovered ? 'white' : '#C0C8D4'} style={{ transition: 'color 0.3s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoleSelect() {
  const navigate = useNavigate()
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F0F4FF 0%, #FAFBFE 40%, #F5F7FC 100%)',
      fontFamily: "'Sora', 'Inter', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px',
      position: 'relative', overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }

        @keyframes float-a { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-28px) rotate(1.5deg)} }
        @keyframes float-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes icon-ring { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
        @keyframes badge-in { from{opacity:0;transform:translateY(-14px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes title-in { from{opacity:0;transform:translateY(28px);filter:blur(4px)} to{opacity:1;transform:translateY(0);filter:blur(0)} }
        @keyframes sub-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.6} }
        @keyframes shimmer-line { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes orb-drift { 0%,100%{transform:scale(1) translate(0,0)} 33%{transform:scale(1.1) translate(10px,-15px)} 66%{transform:scale(0.95) translate(-8px,10px)} }

        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#F0F4FF}
        ::-webkit-scrollbar-thumb{background:rgba(0,51,141,0.15);border-radius:3px}
      `}</style>

      {/* Background decorative orbs */}
      <div style={{
        position: 'fixed', top: '-8%', right: '-4%', width: 520, height: 520,
        background: 'radial-gradient(circle, rgba(0,51,141,0.07) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'orb-drift 18s ease-in-out infinite', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-6%', left: '-6%', width: 440, height: 440,
        background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'orb-drift 22s ease-in-out infinite reverse', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '50%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'float-b 14s ease-in-out infinite', filter: 'blur(50px)',
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,51,141,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,51,141,0.025) 1px, transparent 1px)`,
        backgroundSize: '72px 72px', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Floating shapes */}
      <div style={{
        position: 'fixed', top: '18%', left: '7%', width: 80, height: 80,
        border: '1.5px solid rgba(0,51,141,0.07)', borderRadius: 20,
        animation: 'float-a 10s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(15deg)',
      }} />
      <div style={{
        position: 'fixed', bottom: '22%', right: '8%', width: 56, height: 56,
        border: '1.5px solid rgba(109,40,217,0.07)', borderRadius: '50%',
        animation: 'float-b 13s ease-in-out infinite', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '60%', left: '4%', width: 40, height: 40,
        border: '1.5px solid rgba(8,145,178,0.07)', borderRadius: 10,
        animation: 'float-a 16s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: 0,
        transform: 'rotate(30deg)',
      }} />

      {/* Back button */}
      <div style={{ position: 'fixed', top: 26, left: 32, zIndex: 10,
        opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateX(0)' : 'translateX(-12px)',
        transition: 'all 0.6s cubic-bezier(0.23,1,0.32,1) 0.1s',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '1px solid #E8ECF0',
            color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            padding: '8px 16px', borderRadius: 10, letterSpacing: '-0.01em',
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00338D'; e.currentTarget.style.borderColor = '#C7D2FE'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,51,141,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7A8D'; e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 2, maxWidth: 600 }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 20, padding: '7px 18px',
          background: 'white', border: '1px solid #DDEAFF',
          borderRadius: 40, boxShadow: '0 2px 12px rgba(0,51,141,0.08)',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-14px)',
          transition: 'all 0.7s cubic-bezier(0.23,1,0.32,1) 0.1s',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'dot-pulse 2s ease-in-out infinite', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ color: '#00338D', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
            NobleCrest · Access Portal
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(44px, 7vw, 64px)', fontWeight: 900,
          color: '#0A1628', letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 14,
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s',
        }}>
          Select your{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00338D 0%, #0091DA 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            role
          </span>
        </h1>

        <p style={{
          color: '#8A95A3', fontSize: 16, lineHeight: 1.7, fontWeight: 400,
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s cubic-bezier(0.23,1,0.32,1) 0.32s',
        }}>
          Choose how you'll be accessing the platform today.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 22, width: '100%', maxWidth: 960, position: 'relative', zIndex: 2,
      }}>
        {ROLES.map((r, i) => <RoleCard key={r.role} {...r} index={i} />)}
      </div>

      {/* Footer hint */}
      <div style={{
        marginTop: 48, position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: headerVisible ? 1 : 0,
        transition: 'opacity 0.8s ease 1s',
      }}>
        <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, transparent, #D0D8E4)' }} />
        <span style={{ color: '#C0C8D4', fontSize: 11.5, letterSpacing: '0.06em', fontFamily: "'DM Mono', monospace" }}>
          Secured · Auditable · Enterprise-grade
        </span>
        <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, #D0D8E4, transparent)' }} />
      </div>
    </div>
  )
}