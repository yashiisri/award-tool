// // import { useState } from 'react'
// // import { useNavigate, useParams, Link } from 'react-router-dom'
// // import { Award, Shield, Crown, Users, ArrowLeft } from 'lucide-react'
// // import api from '../api/axios'

// // export default function RoleLogin({ onLogin }) {
// //   const { role } = useParams()
// //   const navigate = useNavigate()
// //   const [username, setUsername] = useState('')
// //   const [password, setPassword] = useState('')
// //   const [error, setError] = useState('')
// //   const [loading, setLoading] = useState(false)

// //   const roleConfig = {
// //     admin: {
// //       icon: Shield,
// //       title: 'Admin Portal',
// //       color: 'from-blue-600 to-blue-800',
// //       bgColor: 'bg-blue-600',
// //       description: 'Manage awards, nominees, and system controls'
// //     },
// //     head_jury: {
// //       icon: Crown,
// //       title: 'Head Jury Portal',
// //       color: 'from-purple-600 to-purple-800',
// //       bgColor: 'bg-purple-600',
// //       description: 'Oversee jury activities and final decisions'
// //     },
// //     jury: {
// //       icon: Users,
// //       title: 'Jury Portal',
// //       color: 'from-indigo-600 to-indigo-800',
// //       bgColor: 'bg-indigo-600',
// //       description: 'Evaluate and vote on nominees'
// //     }
// //   }

// //   const config = roleConfig[role] || roleConfig.admin
// //   const Icon = config.icon

// //   const handleSubmit = async (e) => {
// //     e.preventDefault()
// //     setError('')
// //     setLoading(true)

// //     try {
// //       const { data } = await api.post('/auth/login', { username, password })
      
// //       if (data.role !== role) {
// //         setError(`Invalid credentials for ${config.title}`)
// //         setLoading(false)
// //         return
// //       }

// //       onLogin(data.access_token, data.role)
// //     } catch (err) {
// //       setError('Invalid username or password')
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
// //       <button
// //         onClick={() => navigate('/')}
// //         className="absolute top-6 left-6 flex items-center text-white hover:text-gray-300 transition-colors"
// //       >
// //         <ArrowLeft className="w-5 h-5 mr-2" />
// //         Back to Home
// //       </button>

// //       <div className="w-full max-w-md">
// //         {/* Role Badge */}
// //         <div className="text-center mb-8">
// //           <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl mb-4 shadow-2xl`}>
// //             <Icon className="w-10 h-10 text-white" />
// //           </div>
// //           <h1 className="text-3xl font-bold text-white mb-2">{config.title}</h1>
// //           <p className="text-gray-400">{config.description}</p>
// //         </div>

// //         {/* Login Card */}
// //         <div className="bg-white rounded-2xl shadow-2xl p-8">
// //           <div className="flex items-center justify-center mb-6">
// //             <Award className="w-8 h-8 text-kpmg-blue mr-2" />
// //             <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
// //           </div>

// //           <form onSubmit={handleSubmit} className="space-y-6">
// //             <div>
// //               <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Username
// //               </label>
// //               <input
// //                 type="text"
// //                 value={username}
// //                 onChange={(e) => setUsername(e.target.value)}
// //                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
// //                 placeholder="Enter your username"
// //                 required
// //               />
// //             </div>

// //             <div>
// //               <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Password
// //               </label>
// //               <input
// //                 type="password"
// //                 value={password}
// //                 onChange={(e) => setPassword(e.target.value)}
// //                 className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-kpmg-blue focus:border-transparent transition-all"
// //                 placeholder="Enter your password"
// //                 required
// //               />
// //             </div>

// //             {error && (
// //               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
// //                 <p className="text-red-700 text-sm font-medium">{error}</p>
// //               </div>
// //             )}

// //             <button
// //               type="submit"
// //               disabled={loading}
// //               className={`w-full py-3 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
// //             >
// //               {loading ? 'Signing in...' : 'Sign In'}
// //             </button>
// //           </form>

// //           <div className="mt-6 text-center">
// //             <p className="text-gray-600">
// //               Don't have an account?{' '}
// //               <Link
// //                 to={`/register/${role}`}
// //                 className={`font-semibold bg-gradient-to-r ${config.color} bg-clip-text text-transparent hover:underline`}
// //               >
// //                 Register here
// //               </Link>
// //             </p>
// //           </div>

// //           <div className="mt-6 pt-6 border-t border-gray-200">
// //             <p className="text-center text-sm text-gray-500">
// //               Need a different role?{' '}
// //               <button
// //                 onClick={() => navigate('/')}
// //                 className="text-kpmg-blue font-semibold hover:underline"
// //               >
// //                 Choose role
// //               </button>
// //             </p>
// //           </div>
// //         </div>

// //         {/* Security Badge */}
// //         <div className="mt-6 text-center">
// //           <p className="text-gray-400 text-sm flex items-center justify-center">
// //             <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
// //             Secured with 256-bit encryption
// //           </p>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
// import { useState, useEffect, useRef } from 'react'
// import { useNavigate, useParams, Link } from 'react-router-dom'
// import { Shield, Crown, Users, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react'
// import api from '../api/axios'

// // Floating orb component
// function FloatingOrb({ style }) {
//   return <div className="absolute rounded-full blur-3xl opacity-20 animate-pulse" style={style} />
// }

// // Animated grid lines
// function GridLines() {
//   return (
//     <div className="absolute inset-0 overflow-hidden pointer-events-none">
//       <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
//         <defs>
//           <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
//             <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
//           </pattern>
//         </defs>
//         <rect width="100%" height="100%" fill="url(#grid)" />
//       </svg>
//     </div>
//   )
// }

// const ROLE_CONFIG = {
//   admin: {
//     Icon: Shield,
//     label: 'Admin',
//     title: 'Administrator Portal',
//     subtitle: 'Manage awards, nominees & system controls',
//     accent: '#f59e0b',
//     accentDim: 'rgba(245,158,11,0.15)',
//     gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
//     orbs: [
//       { width: 400, height: 400, background: '#f59e0b', top: '-10%', left: '-10%' },
//       { width: 300, height: 300, background: '#d97706', bottom: '-5%', right: '-5%' },
//     ],
//   },
//   head_jury: {
//     Icon: Crown,
//     label: 'Head Jury',
//     title: 'Head Jury Portal',
//     subtitle: 'Oversee jury activities and final decisions',
//     accent: '#a78bfa',
//     accentDim: 'rgba(167,139,250,0.15)',
//     gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
//     orbs: [
//       { width: 400, height: 400, background: '#7c3aed', top: '-10%', right: '-10%' },
//       { width: 250, height: 250, background: '#a78bfa', bottom: '-5%', left: '-5%' },
//     ],
//   },
//   jury: {
//     Icon: Users,
//     label: 'Jury',
//     title: 'Jury Member Portal',
//     subtitle: 'Evaluate nominees and cast your vote',
//     accent: '#34d399',
//     accentDim: 'rgba(52,211,153,0.15)',
//     gradient: 'linear-gradient(135deg, #34d399, #059669)',
//     orbs: [
//       { width: 350, height: 350, background: '#059669', top: '-5%', left: '-5%' },
//       { width: 280, height: 280, background: '#34d399', bottom: '-10%', right: '-10%' },
//     ],
//   },
// }

// export default function RoleLogin({ onLogin }) {
//   const { role } = useParams()
//   const navigate = useNavigate()
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [showPass, setShowPass] = useState(false)
//   const [error, setError] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [mounted, setMounted] = useState(false)

//   const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin
//   const { Icon } = cfg

//   useEffect(() => {
//     const t = setTimeout(() => setMounted(true), 50)
//     return () => clearTimeout(t)
//   }, [])

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)
//     try {
//       const { data } = await api.post('/auth/login', { username, password })
//       if (data.role !== role) {
//         setError(`These credentials don't belong to the ${cfg.label} portal`)
//         setLoading(false)
//         return
//       }
//       onLogin(data.access_token, data.role)
//     } catch {
//       setError('Invalid username or password. Please try again.')
//       setLoading(false)
//     }
//   }

//   return (
//     <div style={{ fontFamily: "'Sora', sans-serif", background: '#0a0a0f', minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        
//         .fade-up { opacity: 0; transform: translateY(30px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
//         .fade-up.in { opacity: 1; transform: translateY(0); }
//         .delay-1 { transition-delay: 0.1s; }
//         .delay-2 { transition-delay: 0.2s; }
//         .delay-3 { transition-delay: 0.3s; }
//         .delay-4 { transition-delay: 0.4s; }
//         .delay-5 { transition-delay: 0.5s; }

//         .glass-card {
//           background: rgba(255,255,255,0.03);
//           border: 1px solid rgba(255,255,255,0.08);
//           backdrop-filter: blur(24px);
//           -webkit-backdrop-filter: blur(24px);
//         }
        
//         .input-field {
//           background: rgba(255,255,255,0.05);
//           border: 1px solid rgba(255,255,255,0.1);
//           color: white;
//           width: 100%;
//           padding: 14px 18px;
//           border-radius: 12px;
//           font-family: 'Sora', sans-serif;
//           font-size: 14px;
//           transition: all 0.3s ease;
//           outline: none;
//           box-sizing: border-box;
//         }
//         .input-field::placeholder { color: rgba(255,255,255,0.25); }
//         .input-field:focus { background: rgba(255,255,255,0.08); }

//         .btn-primary {
//           width: 100%;
//           padding: 15px;
//           border: none;
//           border-radius: 12px;
//           font-family: 'Sora', sans-serif;
//           font-weight: 600;
//           font-size: 15px;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
//           position: relative;
//           overflow: hidden;
//           letter-spacing: 0.3px;
//         }
//         .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
//         .btn-primary:active:not(:disabled) { transform: translateY(0); }
//         .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

//         .btn-primary::after {
//           content: '';
//           position: absolute;
//           inset: 0;
//           background: linear-gradient(rgba(255,255,255,0.15), transparent);
//           pointer-events: none;
//         }

//         .back-btn {
//           position: absolute;
//           top: 28px;
//           left: 28px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           color: rgba(255,255,255,0.5);
//           background: none;
//           border: none;
//           cursor: pointer;
//           font-family: 'Sora', sans-serif;
//           font-size: 13px;
//           transition: color 0.2s;
//           padding: 0;
//         }
//         .back-btn:hover { color: white; }

//         .role-badge {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           padding: 6px 14px;
//           border-radius: 999px;
//           font-size: 12px;
//           font-weight: 600;
//           letter-spacing: 1px;
//           text-transform: uppercase;
//           margin-bottom: 20px;
//         }

//         .orb {
//           position: absolute;
//           border-radius: 50%;
//           filter: blur(80px);
//           animation: pulse-orb 6s ease-in-out infinite alternate;
//         }
//         @keyframes pulse-orb {
//           0% { opacity: 0.12; transform: scale(1); }
//           100% { opacity: 0.22; transform: scale(1.1); }
//         }

//         .shimmer-line {
//           height: 1px;
//           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
//           margin: 24px 0;
//         }

//         .status-dot {
//           width: 6px;
//           height: 6px;
//           border-radius: 50%;
//           background: #22c55e;
//           animation: blink 2s ease-in-out infinite;
//         }
//         @keyframes blink {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.3; }
//         }

//         @keyframes spin-slow {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }

//         .loading-ring {
//           width: 18px;
//           height: 18px;
//           border: 2px solid rgba(255,255,255,0.3);
//           border-top-color: white;
//           border-radius: 50%;
//           animation: spin-slow 0.8s linear infinite;
//           display: inline-block;
//           margin-right: 10px;
//           vertical-align: middle;
//         }
//       `}</style>

//       {/* Background orbs */}
//       {cfg.orbs.map((o, i) => (
//         <div key={i} className="orb" style={{ width: o.width, height: o.height, background: o.background, top: o.top, left: o.left, bottom: o.bottom, right: o.right, opacity: 0.15 }} />
//       ))}
//       <GridLines />

//       {/* Back button */}
//       <button className="back-btn" onClick={() => navigate('/')}>
//         <ArrowLeft size={15} />
//         Back to Home
//       </button>

//       <div style={{ width: '100%', maxWidth: 440, padding: '20px', zIndex: 10 }}>
//         {/* Header */}
//         <div className={`fade-up ${mounted ? 'in' : ''} delay-1`} style={{ textAlign: 'center', marginBottom: 32 }}>
//           <div className="role-badge" style={{ background: cfg.accentDim, color: cfg.accent, border: `1px solid ${cfg.accent}30` }}>
//             <Icon size={13} />
//             {cfg.label} Access
//           </div>
//           <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 800, color: 'white', margin: '0 0 10px', lineHeight: 1.2 }}>
//             {cfg.title}
//           </h1>
//           <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>{cfg.subtitle}</p>
//         </div>

//         {/* Card */}
//         <div className={`glass-card fade-up ${mounted ? 'in' : ''} delay-2`} style={{ borderRadius: 24, padding: '36px 32px' }}>
//           {/* Icon accent */}
//           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
//             <div style={{ width: 56, height: 56, borderRadius: 16, background: cfg.accentDim, border: `1px solid ${cfg.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <Icon size={24} color={cfg.accent} />
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
//             {/* Username */}
//             <div className={`fade-up ${mounted ? 'in' : ''} delay-3`}>
//               <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Username</label>
//               <input
//                 className="input-field"
//                 style={{ '--focus-color': cfg.accent }}
//                 type="text"
//                 value={username}
//                 onChange={e => setUsername(e.target.value)}
//                 placeholder="Enter your username"
//                 required
//                 onFocus={e => { e.target.style.borderColor = cfg.accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${cfg.accent}15`; }}
//                 onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
//               />
//             </div>

//             {/* Password */}
//             <div className={`fade-up ${mounted ? 'in' : ''} delay-4`} style={{ position: 'relative' }}>
//               <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Password</label>
//               <input
//                 className="input-field"
//                 type={showPass ? 'text' : 'password'}
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 placeholder="Enter your password"
//                 required
//                 style={{ paddingRight: 48 }}
//                 onFocus={e => { e.target.style.borderColor = cfg.accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${cfg.accent}15`; }}
//                 onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
//               />
//               <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, top: 42, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
//                 {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
//               </button>
//             </div>

//             {/* Error */}
//             {error && (
//               <div className={`fade-up in`} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px' }}>
//                 <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>⚠ {error}</p>
//               </div>
//             )}

//             {/* Submit */}
//             <div className={`fade-up ${mounted ? 'in' : ''} delay-5`} style={{ marginTop: 4 }}>
//               <button className="btn-primary" type="submit" disabled={loading} style={{ background: cfg.gradient, color: 'white' }}>
//                 {loading ? <><span className="loading-ring" />Signing in…</> : 'Sign In'}
//               </button>
//             </div>
//           </form>

//           <div className="shimmer-line" />

//           <div style={{ textAlign: 'center' }}>
//             <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 12px' }}>
//               Don't have an account?{' '}
//               <Link to={`/register/${role}`} style={{ color: cfg.accent, fontWeight: 600, textDecoration: 'none' }}>
//                 Register here
//               </Link>
//             </p>
//             <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
//               ← Choose a different role
//             </button>
//           </div>
//         </div>

//         {/* Security indicator */}
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
//           <div className="status-dot" />
//           <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: '0.5px' }}>256-bit encrypted · Secure session</span>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Shield, Crown, Users, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#080810}

  .scene{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 20px;background:#080810;overflow:hidden}

  .orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0}
  .orb-a{width:600px;height:600px;top:-200px;left:-200px;animation:drift1 12s ease-in-out infinite alternate}
  .orb-b{width:500px;height:500px;bottom:-150px;right:-150px;animation:drift2 15s ease-in-out infinite alternate}
  @keyframes drift1{from{transform:translate(0,0) scale(1)}to{transform:translate(60px,40px) scale(1.1)}}
  @keyframes drift2{from{transform:translate(0,0) scale(1)}to{transform:translate(-50px,-30px) scale(1.08)}}

  .grid-bg{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:64px 64px;z-index:0}

  .particles{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden}
  .particle{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(255,255,255,0.35);animation:float-up linear infinite}
  @keyframes float-up{0%{transform:translateY(100vh) translateX(0);opacity:0}10%{opacity:1}90%{opacity:0.4}100%{transform:translateY(-20px) translateX(30px);opacity:0}}

  .back-btn{position:fixed;top:32px;left:32px;display:flex;align-items:center;gap:6px;background:none;border:none;color:rgba(255,255,255,0.3);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;transition:color 0.2s;z-index:100;padding:0}
  .back-btn:hover{color:rgba(255,255,255,0.7)}

  .card-wrap{position:relative;z-index:10;width:100%;max-width:440px;animation:card-in 0.8s cubic-bezier(0.16,1,0.3,1) both}
  @keyframes card-in{from{opacity:0;transform:translateY(40px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}

  .card-glow{position:absolute;inset:-40px;border-radius:40px;opacity:0;pointer-events:none;z-index:-1;transition:opacity 0.5s ease}
  .card-wrap:hover .card-glow{opacity:1}

  .card{background:rgba(14,14,22,0.9);border:0.5px solid rgba(255,255,255,0.1);border-radius:28px;padding:40px 36px;backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;border-radius:100px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)}

  .eyebrow{font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;display:inline-block;padding:4px 14px;border-radius:100px;margin-bottom:14px}
  .card-title{font-family:'DM Serif Display',serif;font-size:30px;font-weight:400;color:white;line-height:1.15;margin-bottom:8px;letter-spacing:-0.3px}
  .card-title em{font-style:italic;opacity:0.5}
  .card-sub{font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6}

  .divider{display:flex;align-items:center;gap:12px;margin:28px 0}
  .divider-line{flex:1;height:0.5px;background:rgba(255,255,255,0.08)}
  .divider-label{font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase}

  .field{margin-bottom:18px}
  .field-label{display:block;font-size:11px;font-weight:500;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:8px}
  .field-wrap{position:relative}
  .field-input{width:100%;padding:14px 18px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.1);border-radius:14px;color:white;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.25s ease;box-sizing:border-box}
  .field-input::placeholder{color:rgba(255,255,255,0.18)}
  .field-input:focus{background:rgba(255,255,255,0.07);transform:translateY(-1px)}

  .eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.25);padding:4px;display:flex;transition:color 0.2s}
  .eye-btn:hover{color:rgba(255,255,255,0.5)}

  .submit-btn{width:100%;padding:15px;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px;color:white;cursor:pointer;position:relative;overflow:hidden;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);margin-top:6px}
  .submit-btn:hover:not(:disabled){transform:translateY(-2px)}
  .submit-btn:active:not(:disabled){transform:translateY(0) scale(0.99)}
  .submit-btn:disabled{opacity:0.5;cursor:not-allowed}
  .submit-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(rgba(255,255,255,0.12) 0%,transparent 60%);pointer-events:none;border-radius:14px}
  .submit-btn::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent);transform:skewX(-20deg);transition:left 0.6s ease}
  .submit-btn:hover::after{left:140%}

  .card-footer{text-align:center;margin-top:24px}
  .footer-text{font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:10px}
  .footer-link{font-weight:500;text-decoration:none;transition:opacity 0.2s}
  .footer-link:hover{opacity:0.7}
  .role-switch{background:none;border:none;font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,0.18);cursor:pointer;transition:color 0.2s;display:block;width:100%;margin-top:8px}
  .role-switch:hover{color:rgba(255,255,255,0.4)}

  .security{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:20px}
  .security-dot{width:5px;height:5px;border-radius:50%;background:#4ADE80;animation:pulse-dot 2.5s ease-in-out infinite}
  @keyframes pulse-dot{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(74,222,128,0.4)}50%{opacity:0.6;box-shadow:0 0 0 4px rgba(74,222,128,0)}}
  .security-text{font-size:11px;color:rgba(255,255,255,0.18);letter-spacing:0.5px}

  .error-box{background:rgba(239,68,68,0.08);border:0.5px solid rgba(239,68,68,0.3);border-radius:12px;padding:11px 14px;margin-bottom:16px}
  .error-text{font-size:13px;color:rgba(239,68,68,0.9)}

  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;margin-right:8px;vertical-align:middle}

  .reveal{opacity:0;transform:translateY(16px);animation:reveal-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards}
  @keyframes reveal-in{to{opacity:1;transform:translateY(0)}}
`

const ROLE_CFG = {
  admin: {
    Icon: Shield, emoji: '🛡️', label: 'Administrator',
    sub: 'Sign in to manage your award system',
    accent: '#F2A93B',
    accentDim: 'rgba(242,169,59,0.08)',
    accentGlow: 'rgba(242,169,59,0.22)',
    btnGrad: 'linear-gradient(135deg,#F2A93B,#D97706)',
    orbA: 'radial-gradient(circle,rgba(242,169,59,0.2) 0%,transparent 70%)',
    orbB: 'radial-gradient(circle,rgba(180,83,9,0.12) 0%,transparent 70%)',
  },
  head_jury: {
    Icon: Crown, emoji: '👑', label: 'Head Jury',
    sub: 'Oversee jury activities and final decisions',
    accent: '#9B87F5',
    accentDim: 'rgba(155,135,245,0.08)',
    accentGlow: 'rgba(155,135,245,0.22)',
    btnGrad: 'linear-gradient(135deg,#9B87F5,#6D28D9)',
    orbA: 'radial-gradient(circle,rgba(155,135,245,0.18) 0%,transparent 70%)',
    orbB: 'radial-gradient(circle,rgba(109,40,217,0.12) 0%,transparent 70%)',
  },
  jury: {
    Icon: Users, emoji: '⚖️', label: 'Jury Member',
    sub: 'Evaluate nominees and cast your vote',
    accent: '#4ADE80',
    accentDim: 'rgba(74,222,128,0.08)',
    accentGlow: 'rgba(74,222,128,0.18)',
    btnGrad: 'linear-gradient(135deg,#4ADE80,#059669)',
    orbA: 'radial-gradient(circle,rgba(74,222,128,0.16) 0%,transparent 70%)',
    orbB: 'radial-gradient(circle,rgba(5,150,105,0.12) 0%,transparent 70%)',
  },
}

function Particles() {
  return (
    <div className="particles">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="particle" style={{
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          opacity: Math.random() * 0.3 + 0.1,
          animationDuration: `${Math.random() * 20 + 15}s`,
          animationDelay: `${Math.random() * 20}s`,
        }} />
      ))}
    </div>
  )
}

export default function RoleLogin({ onLogin }) {
  const { role } = useParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cfg = ROLE_CFG[role] || ROLE_CFG.admin
  const { Icon } = cfg

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      if (data.role !== role) {
        setError(`These credentials don't belong to the ${cfg.label} portal`)
        setLoading(false)
        return
      }
      onLogin(data.access_token, data.role)
    } catch {
      setError('Invalid username or password. Please try again.')
      setLoading(false)
    }
  }

  const focusStyle = { borderColor: cfg.accent + '55', boxShadow: `0 0 0 3px ${cfg.accentDim}, inset 0 0 0 0.5px ${cfg.accent}25` }

  return (
    <div className="scene">
      <style>{STYLES}</style>

      <div className="orb orb-a" style={{ background: cfg.orbA }} />
      <div className="orb orb-b" style={{ background: cfg.orbB }} />
      <div className="grid-bg" />
      <Particles />

      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={14} /> Home
      </button>

      <div className="card-wrap">
        <div className="card-glow" style={{ background: `radial-gradient(ellipse at 50% 50%, ${cfg.accentGlow} 0%, transparent 70%)` }} />

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{cfg.emoji}</div>
            <div className="eyebrow" style={{ background: cfg.accentDim, color: cfg.accent, border: `0.5px solid ${cfg.accent}30` }}>
              {cfg.label}
            </div>
            <h1 className="card-title">Welcome <em>back</em></h1>
            <p className="card-sub">{cfg.sub}</p>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-label">credentials</span>
            <div className="divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field reveal" style={{ animationDelay: '0.05s' }}>
              <label className="field-label">Username</label>
              <div className="field-wrap">
                <input className="field-input" type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username" required
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }} />
              </div>
            </div>

            <div className="field reveal" style={{ animationDelay: '0.12s' }}>
              <label className="field-label">Password</label>
              <div className="field-wrap">
                <input className="field-input" type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  style={{ paddingRight: 46 }} required
                  onFocus={e => Object.assign(e.target.style, focusStyle)}
                  onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }} />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-box">
                <span className="error-text">⚠ {error}</span>
              </div>
            )}

            <button type="submit" className="submit-btn reveal" disabled={loading}
              style={{ background: cfg.btnGrad, boxShadow: `0 8px 32px ${cfg.accentGlow}`, animationDelay: '0.2s' }}>
              {loading ? <><span className="spinner" />Processing…</> : <>Sign In →</>}
            </button>
          </form>

          <div className="card-footer">
            <p className="footer-text">
              No account yet?{' '}
              <Link to={`/register/${role}`} className="footer-link" style={{ color: cfg.accent }}>
                Create one
              </Link>
            </p>
            <button className="role-switch" onClick={() => navigate('/')}>← Choose a different role</button>
          </div>
        </div>

        <div className="security">
          <div className="security-dot" />
          <span className="security-text">256-bit encrypted · Secure session</span>
        </div>
      </div>
    </div>
  )
}