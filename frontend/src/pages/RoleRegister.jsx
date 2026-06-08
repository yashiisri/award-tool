// import { useState } from 'react'
// import { useNavigate, useParams, Link } from 'react-router-dom'
// import { Award, Shield, Crown, Users, ArrowLeft, Mail, User, Lock, CheckCircle, Info } from 'lucide-react'
// import api from '../api/axios'

// export default function RoleRegister() {
//   const { role } = useParams()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)

//   const roleConfig = {
//     admin: {
//       icon: Shield,
//       title: 'Admin Registration',
//       color: 'from-blue-600 to-blue-800',
//       description: 'Create your admin account to manage the award system',
//       adminOnly: false,
//     },
//     head_jury: {
//       icon: Crown,
//       title: 'Head Jury Account',
//       color: 'from-purple-600 to-purple-800',
//       description: 'Head Jury accounts are created by the Admin',
//       adminOnly: true,
//     },
//     jury: {
//       icon: Users,
//       title: 'Jury Account',
//       color: 'from-indigo-600 to-indigo-800',
//       description: 'Jury accounts are created by the Admin',
//       adminOnly: true,
//     },
//   }

//   const config = roleConfig[role] || roleConfig.admin
//   const Icon = config.icon

//   // Jury and Head Jury cannot self-register — admin creates their accounts
//   if (config.adminOnly) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//         <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors">
//           <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
//         </button>
//         <div className="w-full max-w-md text-center">
//           <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-6 shadow-2xl`}>
//             <Icon className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
//           <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6">
//             <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <Info className="w-7 h-7 text-blue-500" />
//             </div>
//             <h2 className="text-xl font-bold text-gray-800 mb-3">Account Created by Admin</h2>
//             <p className="text-gray-500 text-sm leading-relaxed mb-6">
//               {role === 'jury' ? 'Jury' : 'Head Jury'} accounts are created by the platform Admin.
//               Please contact your administrator to get your login credentials.
//             </p>
//             <button
//               onClick={() => navigate(`/login/${role}`)}
//               className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
//             >
//               Go to Login
//             </button>
//             <div className="mt-4">
//               <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
//                 ← Choose a different role
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match')
//       setLoading(false)
//       return
//     }
//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters')
//       setLoading(false)
//       return
//     }

//     try {
//       await api.post('/auth/register', {
//         username: formData.username,
//         email: formData.email,
//         password: formData.password,
//         role,
//       })
//       setSuccess(true)
//       setTimeout(() => navigate(`/login/${role}`), 2000)
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Registration failed. Username may already exist.')
//       setLoading(false)
//     }
//   }

//   if (success) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
//           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
//             <CheckCircle className="w-10 h-10 text-white" />
//           </div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
//           <p className="text-gray-600">Redirecting you to login...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//       <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors">
//         <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
//       </button>

//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-4 shadow-2xl`}>
//             <Icon className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
//           <p className="text-gray-400">{config.description}</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <div className="flex items-center justify-center mb-6">
//             <Award className="w-8 h-8 text-blue-600 mr-2" />
//             <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <User className="w-4 h-4 inline mr-1" /> Username
//               </label>
//               <input type="text" name="username" value={formData.username} onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 placeholder="Choose a username" required />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Mail className="w-4 h-4 inline mr-1" /> Email Address
//               </label>
//               <input type="email" name="email" value={formData.email} onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 placeholder="your.email@example.com" required />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Lock className="w-4 h-4 inline mr-1" /> Password
//               </label>
//               <input type="password" name="password" value={formData.password} onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 placeholder="Create a strong password" required />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Lock className="w-4 h-4 inline mr-1" /> Confirm Password
//               </label>
//               <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                 placeholder="Confirm your password" required />
//             </div>

//             {error && (
//               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
//                 <p className="text-red-700 text-sm font-medium">{error}</p>
//               </div>
//             )}

//             <button type="submit" disabled={loading}
//               className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}>
//               {loading ? 'Creating Account...' : 'Create Account'}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600">
//               Already have an account?{' '}
//               <Link to={`/login/${role}`} className="font-semibold text-blue-600 hover:underline">
//                 Sign in here
//               </Link>
//             </p>
//           </div>
//           <div className="mt-4 text-center">
//             <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
//               ← Choose a different role
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default function RoleRegister() {
//   const { role } = useParams()
//   const navigate = useNavigate()
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   })
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [success, setSuccess] = useState(false)

//   const roleConfig = {
//     admin: {
//       icon: Shield,
//       title: 'Admin Registration',
//       color: 'from-blue-600 to-blue-800',
//       description: 'Create your admin account to manage the award system'
//     },
//     head_jury: {
//       icon: Crown,
//       title: 'Head Jury Registration',
//       color: 'from-purple-600 to-purple-800',
//       description: 'Register as Head Jury to oversee award decisions'
//     },
//     jury: {
//       icon: Users,
//       title: 'Jury Registration',
//       color: 'from-indigo-600 to-indigo-800',
//       description: 'Join as a jury member to evaluate nominees'
//     }
//   }

//   const config = roleConfig[role] || roleConfig.admin
//   const Icon = config.icon

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match')
//       setLoading(false)
//       return
//     }

//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters')
//       setLoading(false)
//       return
//     }

//     try {
//       await api.post('/auth/register', {
//         username: formData.username,
//         email: formData.email,
//         password: formData.password,
//         role: role
//       })

//       setSuccess(true)
//       setTimeout(() => {
//         navigate(`/login/${role}`)
//       }, 2000)
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Registration failed. Username may already exist.')
//       setLoading(false)
//     }
//   }

//   if (success) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
//           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
//             <CheckCircle className="w-10 h-10 text-white" />
//           </div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Registration Successful!</h2>
//           <p className="text-gray-600 mb-6">Redirecting you to login...</p>
//           <div className="w-full bg-gray-200 rounded-full h-2">
//             <div className="bg-green-500 h-2 rounded-full animate-progress"></div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
//       <button
//         onClick={() => navigate('/')}
//         className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors"
//       >
//         <ArrowLeft className="w-5 h-5 mr-2" />
//         Back to Home
//       </button>

//       <div className="w-full max-w-md">
//         {/* Role Badge */}
//         <div className="text-center mb-8">
//           <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-4 shadow-2xl`}>
//             <Icon className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
//           <p className="text-gray-400">{config.description}</p>
//         </div>

//         {/* Register Card */}
//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <div className="flex items-center justify-center mb-6">
//             <Award className="w-8 h-8 text-kpmg-blue mr-2" />
//             <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-5">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <User className="w-4 h-4 inline mr-1" />
//                 Username
//               </label>
//               <input
//                 type="text"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
//                 placeholder="Choose a username"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Mail className="w-4 h-4 inline mr-1" />
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
//                 placeholder="your.email@kpmg.com"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Lock className="w-4 h-4 inline mr-1" />
//                 Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
//                 placeholder="Create a strong password"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 <Lock className="w-4 h-4 inline mr-1" />
//                 Confirm Password
//               </label>
//               <input
//                 type="password"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
//                 placeholder="Confirm your password"
//                 required
//               />
//             </div>

//             {error && (
//               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
//                 <p className="text-red-700 text-sm font-medium">{error}</p>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={loading}
//               className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
//             >
//               {loading ? 'Creating Account...' : 'Create Account'}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600">
//               Already have an account?{' '}
//               <Link
//                 to={`/login/${role}`}
//                 className={`font-semibold bg-gradient-to-r ${config.color} bg-clip-text text-transparent hover:underline`}
//               >
//                 Sign in here
//               </Link>
//             </p>
//           </div>

//           <div className="mt-6 pt-6 border-t border-gray-200">
//             <p className="text-center text-sm text-gray-500">
//               Need a different role?{' '}
//               <button
//                 onClick={() => navigate('/')}
//                 className="text-kpmg-blue font-semibold hover:underline"
//               >
//                 Choose role
//               </button>
//             </p>
//           </div>
//         </div>

//         {/* Security Badge */}
//         <div className="mt-6 text-center">
//           <p className="text-gray-400 text-sm">
//             By registering, you agree to our Terms of Service and Privacy Policy
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Shield, Crown, Users, ArrowLeft, Eye, EyeOff, Info, CheckCircle2, Circle } from 'lucide-react'
import api from '../api/axios'

function GridLines() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid2" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid2)" />
      </svg>
    </div>
  )
}

const ROLE_CONFIG = {
  admin: {
    Icon: Shield,
    label: 'Admin',
    title: 'Create Admin Account',
    subtitle: 'Set up your administrator access',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.12)',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    adminOnly: false,
    orbs: [
      { width: 450, height: 450, background: '#f59e0b', top: '-15%', left: '-12%' },
      { width: 320, height: 320, background: '#b45309', bottom: '-8%', right: '-8%' },
    ],
  },
  head_jury: {
    Icon: Crown,
    label: 'Head Jury',
    title: 'Head Jury Access',
    subtitle: 'Accounts are provisioned by the Admin',
    accent: '#a78bfa',
    accentDim: 'rgba(167,139,250,0.12)',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    adminOnly: true,
    orbs: [
      { width: 400, height: 400, background: '#7c3aed', top: '-10%', right: '-10%' },
      { width: 260, height: 260, background: '#a78bfa', bottom: '-8%', left: '-8%' },
    ],
  },
  jury: {
    Icon: Users,
    label: 'Jury Member',
    title: 'Jury Member Access',
    subtitle: 'Accounts are provisioned by the Admin',
    accent: '#34d399',
    accentDim: 'rgba(52,211,153,0.12)',
    gradient: 'linear-gradient(135deg, #34d399, #059669)',
    adminOnly: true,
    orbs: [
      { width: 380, height: 380, background: '#059669', top: '-8%', left: '-8%' },
      { width: 290, height: 290, background: '#34d399', bottom: '-12%', right: '-10%' },
    ],
  },
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
      {checks.map(c => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {c.pass
            ? <CheckCircle2 size={12} color="#34d399" />
            : <Circle size={12} color="rgba(255,255,255,0.2)" />}
          <span style={{ fontSize: 11, color: c.pass ? '#34d399' : 'rgba(255,255,255,0.25)' }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function RoleRegister() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin
  const { Icon } = cfg

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', { username: formData.username, email: formData.email, password: formData.password, role })
      setSuccess(true)
      setTimeout(() => navigate(`/login/${role}`), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Username may already be taken.')
      setLoading(false)
    }
  }

  const inputFocus = (e, accent) => { e.target.style.borderColor = accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${accent}12` }
  const inputBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }

  // Admin-only block screen
  if (cfg.adminOnly) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: '#0a0a0f', minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        .orb { position:absolute; border-radius:50%; filter:blur(80px); animation: pulse-orb 6s ease-in-out infinite alternate; }
        @keyframes pulse-orb { 0%{opacity:0.12;transform:scale(1)} 100%{opacity:0.2;transform:scale(1.1)} }
        .glass-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(24px); }
        `}</style>
        {cfg.orbs.map((o, i) => (
          <div key={i} className="orb" style={{ width: o.width, height: o.height, background: o.background, top: o.top, left: o.left, bottom: o.bottom, right: o.right }} />
        ))}
        <GridLines />
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 28, left: 28, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: 13 }}>
          <ArrowLeft size={15} /> Back to Home
        </button>
        <div style={{ width: '100%', maxWidth: 400, padding: 20, textAlign: 'center', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: cfg.accentDim, border: `1px solid ${cfg.accent}30`, color: cfg.accent, fontSize: 12, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20 }}>
            <Icon size={13} />
            {cfg.label}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 8 }}>{cfg.title}</h1>

          <div className="glass-card" style={{ borderRadius: 24, padding: '36px 32px', marginTop: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: cfg.accentDim, border: `1px solid ${cfg.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Info size={26} color={cfg.accent} />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 12 }}>Invitation-Only Access</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              {cfg.label} accounts are created exclusively by the platform administrator. Please contact your admin to receive your login credentials.
            </p>
            <button
              onClick={() => navigate(`/login/${role}`)}
              style={{ width: '100%', padding: '14px', background: cfg.gradient, color: 'white', border: 'none', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Go to Login
            </button>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora,sans-serif', marginTop: 16 }}>
              ← Choose a different role
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success screen
  if (success) {
    return (
      <div style={{ fontFamily: "'Sora', sans-serif", background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
          .glass-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(24px); }
          @keyframes pop-in { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
          @keyframes progress-fill { from{width:0%} to{width:100%} }
          .check-pop { animation: pop-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
          .progress-bar { animation: progress-fill 2.3s linear forwards; }
        `}</style>
        <div className="glass-card check-pop" style={{ borderRadius: 24, padding: '48px 40px', maxWidth: 380, width: '90%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={36} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 10 }}>You're all set!</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Account created successfully. Redirecting you to the login portal…</p>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div className="progress-bar" style={{ height: '100%', background: cfg.gradient, borderRadius: 999 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: '#0a0a0f', minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        .fade-up { opacity: 0; transform: translateY(24px); transition: all 0.6s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.in { opacity: 1; transform: translateY(0); }
        .d1{transition-delay:0.05s} .d2{transition-delay:0.12s} .d3{transition-delay:0.18s}
        .d4{transition-delay:0.24s} .d5{transition-delay:0.3s} .d6{transition-delay:0.36s}
        .glass-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }
        .input-field { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; width:100%; padding:13px 16px; border-radius:11px; font-family:'Sora',sans-serif; font-size:14px; transition:all 0.25s ease; outline:none; box-sizing:border-box; }
        .input-field::placeholder { color:rgba(255,255,255,0.2); }
        .orb { position:absolute; border-radius:50%; filter:blur(80px); animation:pulse-orb 6s ease-in-out infinite alternate; }
        @keyframes pulse-orb { 0%{opacity:0.12;transform:scale(1)} 100%{opacity:0.2;transform:scale(1.1)} }
        .shimmer { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); margin:22px 0; }
      `}</style>

      {cfg.orbs.map((o, i) => (
        <div key={i} className="orb" style={{ width: o.width, height: o.height, background: o.background, top: o.top, left: o.left, bottom: o.bottom, right: o.right }} />
      ))}
      <GridLines />

      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 28, left: 28, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontSize: 13, transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'white'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
      >
        <ArrowLeft size={15} /> Back to Home
      </button>

      <div style={{ width: '100%', maxWidth: 460, zIndex: 10 }}>
        {/* Header */}
        <div className={`fade-up ${mounted ? 'in' : ''} d1`} style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: cfg.accentDim, border: `1px solid ${cfg.accent}30`, color: cfg.accent, fontSize: 12, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 18 }}>
            <Icon size={13} /> {cfg.label}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>{cfg.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>{cfg.subtitle}</p>
        </div>

        {/* Card */}
        <div className={`glass-card fade-up ${mounted ? 'in' : ''} d2`} style={{ borderRadius: 24, padding: '32px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: cfg.accentDim, border: `1px solid ${cfg.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={cfg.accent} />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Username */}
            <div className={`fade-up ${mounted ? 'in' : ''} d3`}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Username</label>
              <input className="input-field" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a unique username" required
                onFocus={e => inputFocus(e, cfg.accent)} onBlur={inputBlur} />
            </div>

            {/* Email */}
            <div className={`fade-up ${mounted ? 'in' : ''} d3`}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Email Address</label>
              <input className="input-field" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your.email@example.com" required
                onFocus={e => inputFocus(e, cfg.accent)} onBlur={inputBlur} />
            </div>

            {/* Password */}
            <div className={`fade-up ${mounted ? 'in' : ''} d4`} style={{ position: 'relative' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Password</label>
              <input className="input-field" type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" required style={{ paddingRight: 46 }}
                onFocus={e => inputFocus(e, cfg.accent)} onBlur={inputBlur} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0, display: 'flex' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <PasswordStrength password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div className={`fade-up ${mounted ? 'in' : ''} d5`} style={{ position: 'relative' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Confirm Password</label>
              <input className="input-field" type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" required style={{ paddingRight: 46 }}
                onFocus={e => inputFocus(e, cfg.accent)} onBlur={inputBlur} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0, display: 'flex' }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p style={{ color: '#fca5a5', fontSize: 11, marginTop: 6 }}>⚠ Passwords don't match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0 && (
                <p style={{ color: '#34d399', fontSize: 11, marginTop: 6 }}>✓ Passwords match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '11px 15px' }}>
                <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>⚠ {error}</p>
              </div>
            )}

            {/* Submit */}
            <div className={`fade-up ${mounted ? 'in' : ''} d6`} style={{ marginTop: 6 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', background: loading ? 'rgba(255,255,255,0.1)' : cfg.gradient, color: 'white', border: 'none', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', position: 'relative', overflow: 'hidden', opacity: loading ? 0.6 : 1, letterSpacing: '0.3px' }}
                onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="shimmer" />

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: '0 0 10px' }}>
              Already have an account?{' '}
              <Link to={`/login/${role}`} style={{ color: cfg.accent, fontWeight: 600, textDecoration: 'none' }}>
                Sign in here
              </Link>
            </p>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>
              ← Choose a different role
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 18, lineHeight: 1.5 }}>
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}