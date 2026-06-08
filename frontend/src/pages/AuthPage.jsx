// import { useState } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { Shield, Crown, Users, Trophy, ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
// import api from '../api/axios'

// const ROLE_CONFIG = {
//   admin: {
//     icon: Shield,
//     title: 'Admin',
//     subtitle: 'Platform Administrator',
//     accent: '#1B3A6B',
//     light: '#EEF2FA',
//     heroGradient: 'from-[#1B3A6B] to-[#0D1F3C]',
//   },
//   head_jury: {
//     icon: Crown,
//     title: 'Head Jury',
//     subtitle: 'Senior Evaluator',
//     accent: '#7F3F98',
//     light: '#F5EEF8',
//     heroGradient: 'from-[#7F3F98] to-[#5B2D6E]',
//   },
//   jury: {
//     icon: Users,
//     title: 'Jury',
//     subtitle: 'Evaluator',
//     accent: '#0077B6',
//     light: '#E8F4FD',
//     heroGradient: 'from-[#0077B6] to-[#005a8a]',
//   },
// }

// export default function AuthPage({ onLogin }) {
//   const { role } = useParams()
//   const navigate = useNavigate()
//   const config = ROLE_CONFIG[role] || ROLE_CONFIG.jury

//   const [mode, setMode] = useState('login')
//   const [showPassword, setShowPassword] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })

//   const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setSuccess('')

//     if (mode === 'register' && form.password !== form.confirmPassword) {
//       setError('Passwords do not match')
//       return
//     }

//     setLoading(true)
//     try {
//       if (mode === 'register') {
//         await api.post('/auth/register', { username: form.username, email: form.email, password: form.password, role })
//         setSuccess('Account created! You can now sign in.')
//         setMode('login')
//         setForm({ username: '', email: '', password: '', confirmPassword: '' })
//       } else {
//         const { data } = await api.post('/auth/login', { username: form.username, password: form.password })
//         onLogin(data.access_token, data.role, form.username)
//       }
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Something went wrong')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const Icon = config.icon

//   return (
//     <div className="min-h-screen bg-[#F4F5F7] flex">
//       {/* Left panel — branded */}
//       <div className={`hidden lg:flex lg:w-5/12 bg-gradient-to-br ${config.heroGradient} flex-col justify-between p-12 relative overflow-hidden`}>
//         <div className="absolute inset-0 opacity-10"
//           style={{
//             backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
//             backgroundSize: '40px 40px',
//           }}
//         />
//         <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

//         <div className="relative z-10 flex items-center gap-3">
//           <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
//             <Trophy className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <span className="font-black text-white text-base">NobleCrest.AI</span>
//             <div className="text-white/50 text-xs">Powered by KPMG</div>
//           </div>
//         </div>

//         <div className="relative z-10">
//           <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-8">
//             <Icon className="w-10 h-10 text-white" />
//           </div>
//           <h2 className="text-5xl font-black text-white mb-4 leading-tight">{config.title}<br />Portal</h2>
//           <p className="text-white/70 text-base leading-relaxed max-w-xs">{config.subtitle} — access your personalised dashboard and manage the awards process.</p>
//         </div>

//         <div className="relative z-10 text-white/40 text-xs">© 2025 KPMG. All rights reserved.</div>
//       </div>

//       {/* Right panel — form */}
//       <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-14 bg-white">
//         <div className="max-w-md w-full mx-auto">
//           <button onClick={() => navigate('/select-role')} className="flex items-center gap-2 text-gray-400 hover:text-[#00338D] transition-colors mb-10 text-sm font-medium">
//             <ArrowLeft className="w-4 h-4" />
//             Back to role selection
//           </button>

//           {/* Mode toggle */}
//           <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
//             {['login', 'register'].map((m) => (
//               <button
//                 key={m}
//                 onClick={() => { setMode(m); setError(''); setSuccess('') }}
//                 className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
//                 style={mode === m ? { backgroundColor: config.accent, color: 'white' } : { color: '#6b7280' }}
//               >
//                 {m === 'login' ? 'Sign In' : 'Register'}
//               </button>
//             ))}
//           </div>

//           <div className="mb-8">
//             <h1 className="text-3xl font-black text-[#1a1a2e] mb-1">
//               {mode === 'login' ? 'Welcome back' : 'Create account'}
//             </h1>
//             <p className="text-gray-400 text-sm">
//               {mode === 'login' ? `Sign in to your ${config.title} account` : `Register as ${config.title} to get started`}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="relative">
//               <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={form.username}
//                 onChange={set('username')}
//                 className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
//                 style={{ '--tw-ring-color': config.accent }}
//                 onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
//                 onBlur={e => e.target.style.boxShadow = ''}
//                 required
//               />
//             </div>

//             {mode === 'register' && (
//               <div className="relative">
//                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type="email"
//                   placeholder="Email address"
//                   value={form.email}
//                   onChange={set('email')}
//                   className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
//                   onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
//                   onBlur={e => e.target.style.boxShadow = ''}
//                   required
//                 />
//               </div>
//             )}

//             <div className="relative">
//               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 placeholder="Password"
//                 value={form.password}
//                 onChange={set('password')}
//                 className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
//                 onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
//                 onBlur={e => e.target.style.boxShadow = ''}
//                 required
//               />
//               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
//                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//               </button>
//             </div>

//             {mode === 'register' && (
//               <div className="relative">
//                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   placeholder="Confirm password"
//                   value={form.confirmPassword}
//                   onChange={set('confirmPassword')}
//                   className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none transition-all text-sm"
//                   onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${config.accent}40`}
//                   onBlur={e => e.target.style.boxShadow = ''}
//                   required
//                 />
//               </div>
//             )}

//             {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
//             {success && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-4 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2"
//               style={{ backgroundColor: config.accent }}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   {mode === 'login' ? 'Signing in...' : 'Creating account...'}
//                 </span>
//               ) : (
//                 mode === 'login' ? 'Sign In' : 'Create Account'
//               )}
//             </button>
//           </form>

//           <p className="text-center text-gray-400 text-sm mt-6">
//             {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
//             <button
//               onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
//               className="font-semibold hover:underline"
//               style={{ color: config.accent }}
//             >
//               {mode === 'login' ? 'Register here' : 'Sign in'}
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Shield, Crown, Users, Trophy, ArrowLeft, Eye, EyeOff, Mail, Lock, User, Sparkles, ChevronRight, Star } from 'lucide-react'
import api from '../api/axios'

/* ─── Role Config ──────────────────────────────────────────────── */
const ROLE_CONFIG = {
  admin: {
    icon: Shield,
    title: 'Admin',
    subtitle: 'Platform Administrator',
    accent: '#1B3A6B',
    gradient: 'linear-gradient(135deg, #1B3A6B 0%, #2d5bb9 60%, #5b83d7 100%)',
    soft: 'linear-gradient(135deg, #eef3ff 0%, #dde8ff 50%, #c8d9ff 100%)',
    glow: '#2d5bb9',
    tag: '#dde8ff',
    tagText: '#1B3A6B',
  },
  head_jury: {
    icon: Crown,
    title: 'Head Jury',
    subtitle: 'Senior Evaluator',
    accent: '#6b21a8',
    gradient: 'linear-gradient(135deg, #6b21a8 0%, #9333ea 60%, #c084fc 100%)',
    soft: 'linear-gradient(135deg, #f5f0ff 0%, #ede0ff 50%, #dcc8ff 100%)',
    glow: '#9333ea',
    tag: '#ede0ff',
    tagText: '#6b21a8',
  },
  jury: {
    icon: Users,
    title: 'Jury',
    subtitle: 'Evaluator',
    accent: '#0369a1',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
    soft: 'linear-gradient(135deg, #f0f9ff 0%, #ddf3ff 50%, #bae8ff 100%)',
    glow: '#0ea5e9',
    tag: '#ddf3ff',
    tagText: '#0369a1',
  },
}

/* ─── Floating Orb ─────────────────────────────────────────────── */
function Orb({ size, top, left, right, bottom, color, delay, blur = 80 }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        top, left, right, bottom,
        filter: `blur(${blur}px)`,
        animation: `orbDrift 14s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
      }}
    />
  )
}

/* ─── Input Field ──────────────────────────────────────────────── */
function Field({ icon: Icon, accent, glow, delay, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ animation: `riseIn .45s ease both ${delay}s`, opacity: 0 }} className="relative">
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-400"
        style={{
          boxShadow: focused ? `0 0 0 2.5px ${glow}55, 0 4px 20px ${glow}18` : `0 0 0 1.5px rgba(0,0,0,0.08)`,
        }}
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <Icon className="w-4 h-4 transition-colors duration-300" style={{ color: focused ? glow : '#94a3b8' }} />
      </div>
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none transition-all duration-300"
        style={{
          background: focused ? '#fff' : '#f8fafc',
          color: '#1e293b',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      />
      {children}
    </div>
  )
}

/* ─── Main ─────────────────────────────────────────────────────── */
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
  const [mounted, setMounted] = useState(false)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  useEffect(() => { setTimeout(() => setMounted(true), 30) }, [])

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
    } finally { setLoading(false) }
  }

  const Icon = cfg.icon

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        @keyframes orbDrift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(18px,-22px) scale(1.04); }
          66%      { transform: translate(-14px,16px) scale(0.97); }
        }
        @keyframes riseIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cardIn {
          from { opacity:0; transform:scale(.96) translateY(18px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateX(8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        @keyframes leftIn {
          from { opacity:0; transform:translateX(-18px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(.85); }
          to   { opacity:1; transform:scale(1); }
        }

        input::placeholder { color:#94a3b8; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
          -webkit-text-fill-color: #1e293b !important;
        }
        .shimmer-overlay {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          background-size: 200% auto;
          animation: shimmer 2.2s linear infinite;
        }
      `}</style>

      {/* ── Full page ── */}
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: cfg.soft, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Soft orbs in background */}
        <Orb size="520px" top="-180px" right="-140px" color={`${cfg.glow}22`} delay={0} />
        <Orb size="380px" bottom="-120px" left="-100px" color={`${cfg.glow}18`} delay={-5} />
        <Orb size="260px" top="35%" left="25%" color={`${cfg.glow}12`} delay={-9} blur={60} />

        {/* Subtle mesh texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${cfg.glow}12 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* ── Card ── */}
        <div
          className="relative w-full max-w-5xl mx-4 rounded-[2.5rem] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(40px)',
            boxShadow: `0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8), 0 0 60px ${cfg.glow}18`,
            animation: mounted ? 'cardIn .65s cubic-bezier(.16,1,.3,1) forwards' : 'none',
          }}
        >
          <div className="flex min-h-[640px]">

            {/* ── Left branded panel ── */}
            <div
              className="hidden lg:flex w-[42%] flex-col justify-between p-12 relative overflow-hidden"
              style={{ background: cfg.gradient }}
            >
              {/* Noise/grain overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                  backgroundSize: '180px 180px',
                }}
              />
              {/* Large circle decoration */}
              <div
                className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
              <div
                className="absolute top-24 -right-16 w-[200px] h-[200px] rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />

              {/* Logo */}
              <div className="relative z-10 flex items-center gap-3" style={{ animation: 'leftIn .7s ease .1s both' }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-[15px]" style={{ fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.02em' }}>
                    NobleCrest.AI
                  </div>
                  <div className="text-white/50 text-[10px] tracking-widest uppercase mt-0.5">Powered by KPMG</div>
                </div>
              </div>

              {/* Hero */}
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-[88px] h-[88px] rounded-3xl flex items-center justify-center mb-8 relative"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)',
                    animation: 'popIn .6s ease .25s both',
                  }}
                >
                  <Icon className="w-10 h-10 text-white" />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <Star className="w-3 h-3" style={{ color: cfg.accent }} />
                  </div>
                </div>

                <div style={{ animation: 'leftIn .7s ease .35s both' }}>
                  <h2
                    className="text-5xl font-bold text-white leading-tight mb-3"
                    style={{ fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.04em' }}
                  >
                    {cfg.title}<br />
                    <span className="text-white/45">Portal</span>
                  </h2>
                  <p className="text-white/65 text-sm leading-relaxed max-w-[240px]">
                    {cfg.subtitle} — access your personalised dashboard and manage the awards process.
                  </p>
                </div>

                {/* Pills */}
                <div className="flex gap-2 mt-7 flex-wrap" style={{ animation: 'leftIn .7s ease .45s both' }}>
                  {['Secure Access', 'Real-time', 'Verified'].map((label) => (
                    <div
                      key={label}
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/80"
                      style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 text-white/30 text-[11px]">© 2026 KPMG. All rights reserved.</div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-14 bg-white/60">
              <div className="max-w-[400px] w-full mx-auto">

                {/* Back */}
                <button
                  onClick={() => navigate('/select-role')}
                  className="flex items-center gap-2 text-sm font-medium mb-10 group transition-colors duration-200"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => e.currentTarget.style.color = cfg.accent}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  Back to role selection
                </button>

                {/* Toggle */}
                <div
                  className="flex rounded-2xl p-1 mb-8"
                  style={{
                    background: '#f1f5f9',
                    animation: 'riseIn .45s ease .05s both',
                  }}
                >
                  {['login', 'register'].map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setError(''); setSuccess('') }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden"
                      style={
                        mode === m
                          ? {
                              background: cfg.gradient,
                              color: '#fff',
                              boxShadow: `0 4px 18px ${cfg.glow}35`,
                            }
                          : { color: '#94a3b8' }
                      }
                    >
                      {mode === m && <span className="shimmer-overlay absolute inset-0 pointer-events-none" />}
                      {m === 'login' ? 'Sign In' : 'Register'}
                    </button>
                  ))}
                </div>

                {/* Heading */}
                <div
                  key={mode}
                  className="mb-7"
                  style={{ animation: 'fadeSlide .3s ease both' }}
                >
                  <h1
                    className="text-[2rem] font-bold mb-1"
                    style={{ fontFamily: "'Clash Display', sans-serif", letterSpacing: '-0.04em', color: '#0f172a' }}
                  >
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h1>
                  <p className="text-sm text-slate-400">
                    {mode === 'login'
                      ? `Sign in to your ${cfg.title} account`
                      : `Register as ${cfg.title} to get started`}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Field icon={User} accent={cfg.accent} glow={cfg.glow} delay={0.12}
                    type="text" placeholder="Username" value={form.username} onChange={set('username')} required />

                  {mode === 'register' && (
                    <Field icon={Mail} accent={cfg.accent} glow={cfg.glow} delay={0.18}
                      type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
                  )}

                  <Field icon={Lock} accent={cfg.accent} glow={cfg.glow} delay={0.22}
                    type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required>
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors duration-200"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </Field>

                  {mode === 'register' && (
                    <Field icon={Lock} accent={cfg.accent} glow={cfg.glow} delay={0.27}
                      type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  )}

                  {error && (
                    <div
                      className="px-4 py-3 rounded-2xl text-sm"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', animation: 'riseIn .3s ease both' }}
                    >
                      {error}
                    </div>
                  )}
                  {success && (
                    <div
                      className="px-4 py-3 rounded-2xl text-sm"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', animation: 'riseIn .3s ease both' }}
                    >
                      {success}
                    </div>
                  )}

                  {/* Submit button */}
                  <div style={{ animation: 'riseIn .45s ease .32s both', opacity: 0, paddingTop: '4px' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-2xl font-semibold text-sm text-white relative overflow-hidden group flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: cfg.gradient,
                        boxShadow: `0 8px 32px ${cfg.glow}35`,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                      onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = `0 12px 40px ${cfg.glow}55, 0 2px 0 rgba(255,255,255,0.2) inset`)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${cfg.glow}35`)}
                    >
                      <span className="shimmer-overlay absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {loading ? (
                        <>
                          <div
                            className="w-4 h-4 border-2 rounded-full"
                            style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }}
                          />
                          {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                        </>
                      ) : (
                        <>
                          {mode === 'login' ? 'Sign In' : 'Create Account'}
                          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <p
                  className="text-center text-sm mt-5 text-slate-400"
                  style={{ animation: 'riseIn .45s ease .38s both', opacity: 0 }}
                >
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
                    className="font-semibold transition-colors duration-200"
                    style={{ color: cfg.accent }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {mode === 'login' ? 'Register here' : 'Sign in'}
                  </button>
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}