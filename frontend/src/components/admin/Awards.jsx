// // import { useState, useEffect } from 'react'
// // import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare } from 'lucide-react'
// // import { useNavigate } from 'react-router-dom'
// // import api from '../../api/axios'
// // import PageHeader from '../layout/PageHeader'

// // const CRITERIA = [
// //   { id: 'governance',       label: 'Governance & Societal Responsibilities' },
// //   { id: 'org_performance',  label: 'Organisational Performance' },
// //   { id: 'general',          label: 'General Eligibility' },
// // ]

// // const CRITERIA_DETAILS = {
// //   governance:      ['Contribution to society and nation at large', 'Personal values, ethics and corporate integrity', 'Contribution to positive evolution of government policy', 'Contribution towards globalisation of Indian economy'],
// //   org_performance: ['Display of corporate courage and leadership', 'Contribution towards evolving appropriate management culture', 'Contribution towards development of management profession', 'Vision and support for innovation and new ideas'],
// //   general:         ['Organisation must be operating in India', 'Business must have contributed substantially to Indian economy', 'Nominations of individuals from their own organisations will be considered'],
// // }

// // const btn = {
// //   primary: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#00338D', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' },
// //   ghost:   { padding: '9px 16px', background: '#F7F9FC', color: '#6B7A8D', border: '1px solid #E8ECF0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
// // }

// // export default function Awards() {
// //   const [awards, setAwards] = useState([])
// //   const [showModal, setShowModal] = useState(false)
// //   const [loading, setLoading] = useState(false)
// //   const [expandedCriteria, setExpandedCriteria] = useState(null)
// //   const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
// //   const navigate = useNavigate()

// //   useEffect(() => { fetchAwards() }, [])

// //   const fetchAwards = async () => {
// //     try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch (e) {}
// //   }

// //   const handleCreate = async (e) => {
// //     e.preventDefault(); setLoading(true)
// //     try {
// //       await api.post('/admin/awards', form)
// //       setShowModal(false)
// //       setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
// //       fetchAwards()
// //     } catch (e) {} finally { setLoading(false) }
// //   }

// //   const handleDelete = async (id, e) => {
// //     e.stopPropagation()
// //     if (!confirm('Delete this award and all its nominees?')) return
// //     try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch (e) {}
// //   }

// //   const toggleCriteria = (id) => {
// //     const c = form.criteria
// //     setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
// //   }

// //   return (
// //     <div style={{ padding: '32px 36px', fontFamily: "'Inter', system-ui, sans-serif" }}>
// //       <PageHeader
// //         icon={Award} title="Awards" subtitle="Create and manage award categories"
// //         action={
// //           <button style={btn.primary} onClick={() => setShowModal(true)}
// //             onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
// //             onMouseLeave={e => e.currentTarget.style.background = '#00338D'}>
// //             <Plus size={14} /> New Award
// //           </button>
// //         }
// //       />

// //       {awards.length === 0 ? (
// //         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: 'white', borderRadius: 14, border: '1px solid #E8ECF0', textAlign: 'center' }}>
// //           <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
// //             <Award size={24} color="#00338D" />
// //           </div>
// //           <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No awards yet</p>
// //           <p style={{ color: '#9BA8B5', fontSize: 13, marginBottom: 20 }}>Create your first award to get started.</p>
// //           <button style={btn.primary} onClick={() => setShowModal(true)}
// //             onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
// //             onMouseLeave={e => e.currentTarget.style.background = '#00338D'}>
// //             <Plus size={14} /> Create Award
// //           </button>
// //         </div>
// //       ) : (
// //         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
// //           {awards.map(award => (
// //             <div key={award.id}
// //               onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
// //               style={{ background: 'white', border: '1px solid #E8ECF0', borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'all 0.18s ease', position: 'relative' }}
// //               onMouseEnter={e => { e.currentTarget.style.borderColor = '#00338D40'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,51,141,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
// //               onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
// //             >
// //               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
// //                 <div style={{ width: 42, height: 42, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //                   <Award size={18} color="#00338D" />
// //                 </div>
// //                 <button onClick={e => handleDelete(award.id, e)}
// //                   style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#D0D8E4', borderRadius: 6, transition: 'all 0.15s' }}
// //                   onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#FEF2F2' }}
// //                   onMouseLeave={e => { e.currentTarget.style.color = '#D0D8E4'; e.currentTarget.style.background = 'none' }}>
// //                   <Trash2 size={14} />
// //                 </button>
// //               </div>
// //               <h3 style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: '-0.01em' }}>{award.name}</h3>
// //               <p style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{award.description}</p>
// //               <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
// //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12 }}><Users size={12} />{award.num_nominees} nominees</span>
// //                 <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12 }}><CheckSquare size={12} />{award.criteria?.length || 3} criteria</span>
// //               </div>
// //               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #F0F4F8' }}>
// //                 <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600 }}>View Nominees</span>
// //                 <ChevronRight size={15} color="#00338D" />
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}

// //       {showModal && (
// //         <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
// //           <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
// //             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #F0F4F8' }}>
// //               <div>
// //                 <h2 style={{ color: '#0A1628', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Create New Award</h2>
// //                 <p style={{ color: '#9BA8B5', fontSize: 13, marginTop: 2 }}>Configure award details and evaluation criteria</p>
// //               </div>
// //               <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA8B5', padding: 4 }}
// //                 onMouseEnter={e => e.currentTarget.style.color = '#0A1628'}
// //                 onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}>
// //                 <X size={18} />
// //               </button>
// //             </div>

// //             <form onSubmit={handleCreate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
// //               <div>
// //                 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Award Name *</label>
// //                 <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
// //                   style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', boxSizing: 'border-box' }}
// //                   placeholder="e.g. Business Leader of the Year"
// //                   onFocus={e => e.target.style.borderColor = '#00338D'}
// //                   onBlur={e => e.target.style.borderColor = '#E8ECF0'}
// //                   required />
// //               </div>
// //               <div>
// //                 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Description *</label>
// //                 <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
// //                   style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
// //                   rows={3} placeholder="Describe the purpose and significance of this award..."
// //                   onFocus={e => e.target.style.borderColor = '#00338D'}
// //                   onBlur={e => e.target.style.borderColor = '#E8ECF0'}
// //                   required />
// //               </div>
// //               <div>
// //                 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Number of Nominees</label>
// //                 <input type="number" min="1" max="20" value={form.num_nominees} onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
// //                   style={{ width: 100, padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none' }}
// //                   onFocus={e => e.target.style.borderColor = '#00338D'}
// //                   onBlur={e => e.target.style.borderColor = '#E8ECF0'} />
// //               </div>
// //               <div>
// //                 <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Evaluation Criteria</label>
// //                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
// //                   {CRITERIA.map(({ id, label }) => (
// //                     <div key={id} style={{ border: `1px solid ${form.criteria.includes(id) ? '#00338D40' : '#E8ECF0'}`, borderRadius: 10, overflow: 'hidden', background: form.criteria.includes(id) ? '#F5F7FF' : '#F7F9FC' }}>
// //                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }} onClick={() => toggleCriteria(id)}>
// //                         <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.criteria.includes(id) ? '#00338D' : '#D0D8E4'}`, background: form.criteria.includes(id) ? '#00338D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
// //                           {form.criteria.includes(id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
// //                         </div>
// //                         <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{label}</span>
// //                         <button type="button" onClick={e => { e.stopPropagation(); setExpandedCriteria(expandedCriteria === id ? null : id) }}
// //                           style={{ fontSize: 11, color: '#0091DA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
// //                           {expandedCriteria === id ? 'Hide' : 'Details'}
// //                         </button>
// //                       </div>
// //                       {expandedCriteria === id && (
// //                         <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F0F4F8' }}>
// //                           <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
// //                             {CRITERIA_DETAILS[id].map((point, i) => (
// //                               <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#6B7A8D' }}>
// //                                 <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0091DA', marginTop: 5, flexShrink: 0 }} />
// //                                 {point}
// //                               </li>
// //                             ))}
// //                           </ul>
// //                         </div>
// //                       )}
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>

// //               <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
// //                 <button type="submit" disabled={loading}
// //                   style={{ flex: 1, padding: '12px', background: loading ? '#9BA8B5' : '#00338D', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
// //                   onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#002a73' }}
// //                   onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#00338D' }}>
// //                   {loading ? 'Creating...' : 'Create Award'}
// //                 </button>
// //                 <button type="button" onClick={() => setShowModal(false)} style={btn.ghost}>Cancel</button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }
// import { useState, useEffect } from 'react'
// import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare, Sparkles } from 'lucide-react'
// import { useNavigate } from 'react-router-dom'
// import api from '../../api/axios'
// import PageHeader from '../layout/PageHeader'

// const CRITERIA = [
//   { id: 'governance',      label: 'Governance & Societal Responsibilities' },
//   { id: 'org_performance', label: 'Organisational Performance' },
//   { id: 'general',         label: 'General Eligibility' },
// ]

// const CRITERIA_DETAILS = {
//   governance:      ['Contribution to society and nation at large', 'Personal values, ethics and corporate integrity', 'Contribution to positive evolution of government policy', 'Contribution towards globalisation of Indian economy'],
//   org_performance: ['Display of corporate courage and leadership', 'Contribution towards evolving appropriate management culture', 'Contribution towards development of management profession', 'Vision and support for innovation and new ideas'],
//   general:         ['Organisation must be operating in India', 'Business must have contributed substantially to Indian economy', 'Nominations of individuals from their own organisations will be considered'],
// }

// const ACCENT = '#1B3A6B'
// const ACCENT_GRAD = 'linear-gradient(135deg, #1B3A6B 0%, #2d5bb9 60%, #5b83d7 100%)'
// const ACCENT_GLOW = '#2d5bb9'
// const SOFT_BG = 'linear-gradient(135deg, #eef3ff 0%, #dde8ff 50%, #c8d9ff 100%)'

// export default function Awards() {
//   const [awards, setAwards] = useState([])
//   const [showModal, setShowModal] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [expandedCriteria, setExpandedCriteria] = useState(null)
//   const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
//   const navigate = useNavigate()

//   useEffect(() => { fetchAwards() }, [])

//   const fetchAwards = async () => {
//     try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch (e) {}
//   }

//   const handleCreate = async (e) => {
//     e.preventDefault(); setLoading(true)
//     try {
//       await api.post('/admin/awards', form)
//       setShowModal(false)
//       setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
//       fetchAwards()
//     } catch (e) {} finally { setLoading(false) }
//   }

//   const handleDelete = async (id, e) => {
//     e.stopPropagation()
//     if (!confirm('Delete this award and all its nominees?')) return
//     try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch (e) {}
//   }

//   const toggleCriteria = (id) => {
//     const c = form.criteria
//     setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
//   }

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

//         @keyframes riseIn {
//           from { opacity:0; transform:translateY(14px); }
//           to   { opacity:1; transform:translateY(0); }
//         }
//         @keyframes cardIn {
//           from { opacity:0; transform:scale(.97) translateY(10px); }
//           to   { opacity:1; transform:scale(1) translateY(0); }
//         }
//         @keyframes modalIn {
//           from { opacity:0; transform:scale(.96) translateY(16px); }
//           to   { opacity:1; transform:scale(1) translateY(0); }
//         }
//         @keyframes fadeIn {
//           from { opacity:0; }
//           to   { opacity:1; }
//         }
//         @keyframes shimmer {
//           0%   { background-position:-200% center; }
//           100% { background-position:200% center; }
//         }
//         @keyframes spin {
//           to { transform:rotate(360deg); }
//         }
//         @keyframes orbDrift {
//           0%,100% { transform:translate(0,0) scale(1); }
//           33%      { transform:translate(20px,-25px) scale(1.04); }
//           66%      { transform:translate(-14px,18px) scale(0.97); }
//         }

//         .award-card {
//           background: rgba(255,255,255,0.85);
//           backdrop-filter: blur(20px);
//           border: 1px solid rgba(255,255,255,0.9);
//           border-radius: 20px;
//           padding: 24px;
//           cursor: pointer;
//           transition: all 0.22s cubic-bezier(.16,1,.3,1);
//           box-shadow: 0 4px 20px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.8) inset;
//           position: relative;
//           overflow: hidden;
//         }
//         .award-card::before {
//           content:'';
//           position:absolute;
//           inset:0;
//           background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%);
//           pointer-events:none;
//         }
//         .award-card:hover {
//           transform: translateY(-4px);
//           border-color: #2d5bb940;
//           box-shadow: 0 16px 48px rgba(29,90,219,0.14), 0 1px 0 rgba(255,255,255,0.8) inset;
//         }
//         .shimmer-btn {
//           background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
//           background-size: 200% auto;
//           animation: shimmer 2.2s linear infinite;
//         }
//         input, textarea {
//           font-family: 'Plus Jakarta Sans', sans-serif;
//         }
//         input:focus, textarea:focus {
//           outline: none;
//           border-color: #2d5bb9 !important;
//           box-shadow: 0 0 0 3px #2d5bb918;
//         }
//         ::-webkit-scrollbar { width: 4px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: #d0d9f0; border-radius: 4px; }
//       `}</style>

//       <div
//         style={{
//           minHeight: '100vh',
//           padding: '36px 40px',
//           fontFamily: "'Plus Jakarta Sans', sans-serif",
//           position: 'relative',
//           background: SOFT_BG,
//         }}
//       >
//         {/* Background orbs */}
//         <div style={{ position:'fixed', top:'-180px', right:'-140px', width:'520px', height:'520px', borderRadius:'50%', background:`${ACCENT_GLOW}22`, filter:'blur(80px)', animation:'orbDrift 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
//         <div style={{ position:'fixed', bottom:'-120px', left:'-100px', width:'380px', height:'380px', borderRadius:'50%', background:`${ACCENT_GLOW}18`, filter:'blur(80px)', animation:'orbDrift 14s ease-in-out -5s infinite', pointerEvents:'none', zIndex:0 }} />
//         {/* Dot mesh */}
//         <div style={{ position:'fixed', inset:0, backgroundImage:`radial-gradient(circle, ${ACCENT_GLOW}12 1px, transparent 1px)`, backgroundSize:'36px 36px', pointerEvents:'none', zIndex:0 }} />

//         <div style={{ position:'relative', zIndex:1 }}>
//           {/* Header */}
//           <div
//             style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, animation:'riseIn .45s ease both' }}
//           >
//             <div style={{ display:'flex', alignItems:'center', gap:14 }}>
//               <div
//                 style={{
//                   width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
//                   background: ACCENT_GRAD,
//                   boxShadow: `0 8px 24px ${ACCENT_GLOW}35`,
//                 }}
//               >
//                 <Award size={22} color="white" />
//               </div>
//               <div>
//                 <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display', sans-serif", letterSpacing:'-0.04em' }}>
//                   Awards
//                 </h1>
//                 <p style={{ margin:0, fontSize:13, color:'#94a3b8', marginTop:2 }}>Create and manage award categories</p>
//               </div>
//             </div>
//             <button
//               onClick={() => setShowModal(true)}
//               style={{
//                 display:'flex', alignItems:'center', gap:7,
//                 padding:'10px 20px',
//                 background: ACCENT_GRAD,
//                 color:'white', border:'none', borderRadius:12,
//                 fontSize:13, fontWeight:600, cursor:'pointer',
//                 boxShadow:`0 6px 24px ${ACCENT_GLOW}35`,
//                 fontFamily:"'Plus Jakarta Sans', sans-serif",
//                 letterSpacing:'-0.01em',
//                 position:'relative', overflow:'hidden',
//                 transition:'box-shadow .2s ease',
//               }}
//               onMouseEnter={e => e.currentTarget.style.boxShadow = `0 10px 32px ${ACCENT_GLOW}55`}
//               onMouseLeave={e => e.currentTarget.style.boxShadow = `0 6px 24px ${ACCENT_GLOW}35`}
//             >
//               <span className="shimmer-btn" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.6 }} />
//               <Plus size={14} /> New Award
//             </button>
//           </div>

//           {/* Empty state */}
//           {awards.length === 0 ? (
//             <div
//               style={{
//                 display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
//                 padding:'100px 24px',
//                 background:'rgba(255,255,255,0.75)', backdropFilter:'blur(20px)',
//                 borderRadius:24, border:'1px solid rgba(255,255,255,0.9)',
//                 boxShadow:'0 8px 40px rgba(0,0,0,0.06)',
//                 textAlign:'center',
//                 animation:'riseIn .5s ease .1s both',
//               }}
//             >
//               <div
//                 style={{
//                   width:64, height:64, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center',
//                   background: ACCENT_GRAD,
//                   boxShadow:`0 10px 30px ${ACCENT_GLOW}35`,
//                   marginBottom:18,
//                 }}
//               >
//                 <Award size={26} color="white" />
//               </div>
//               <p style={{ color:'#0f172a', fontWeight:700, fontSize:16, marginBottom:6, fontFamily:"'Clash Display', sans-serif", letterSpacing:'-0.03em' }}>No awards yet</p>
//               <p style={{ color:'#94a3b8', fontSize:13, marginBottom:24 }}>Create your first award to get started.</p>
//               <button
//                 onClick={() => setShowModal(true)}
//                 style={{
//                   display:'flex', alignItems:'center', gap:7, padding:'11px 22px',
//                   background: ACCENT_GRAD, color:'white', border:'none', borderRadius:12,
//                   fontSize:13, fontWeight:600, cursor:'pointer',
//                   boxShadow:`0 6px 24px ${ACCENT_GLOW}35`,
//                   fontFamily:"'Plus Jakarta Sans', sans-serif",
//                   position:'relative', overflow:'hidden',
//                 }}
//               >
//                 <span className="shimmer-btn" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.6 }} />
//                 <Plus size={14} /> Create Award
//               </button>
//             </div>
//           ) : (
//             <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:18 }}>
//               {awards.map((award, i) => (
//                 <div
//                   key={award.id}
//                   className="award-card"
//                   onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
//                   style={{ animation:`cardIn .45s ease ${i * 0.06}s both` }}
//                 >
//                   {/* Top row */}
//                   <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, position:'relative', zIndex:1 }}>
//                     <div
//                       style={{
//                         width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
//                         background: ACCENT_GRAD,
//                         boxShadow:`0 6px 18px ${ACCENT_GLOW}30`,
//                       }}
//                     >
//                       <Award size={18} color="white" />
//                     </div>
//                     <button
//                       onClick={e => handleDelete(award.id, e)}
//                       style={{ padding:6, background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', borderRadius:8, transition:'all .15s' }}
//                       onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='#fef2f2' }}
//                       onMouseLeave={e => { e.currentTarget.style.color='#cbd5e1'; e.currentTarget.style.background='none' }}
//                     >
//                       <Trash2 size={14} />
//                     </button>
//                   </div>

//                   <h3 style={{ color:'#0f172a', fontWeight:700, fontSize:15, marginBottom:6, letterSpacing:'-0.02em', fontFamily:"'Clash Display', sans-serif", position:'relative', zIndex:1 }}>
//                     {award.name}
//                   </h3>
//                   <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.6, marginBottom:16, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', position:'relative', zIndex:1 }}>
//                     {award.description}
//                   </p>

//                   {/* Meta chips */}
//                   <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, position:'relative', zIndex:1 }}>
//                     <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'#eef3ff', borderRadius:20, color:'#1B3A6B', fontSize:11, fontWeight:600 }}>
//                       <Users size={10} /> {award.num_nominees} nominees
//                     </span>
//                     <span style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'#eef3ff', borderRadius:20, color:'#1B3A6B', fontSize:11, fontWeight:600 }}>
//                       <CheckSquare size={10} /> {award.criteria?.length || 3} criteria
//                     </span>
//                   </div>

//                   {/* Footer */}
//                   <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid #e8f0fe', position:'relative', zIndex:1 }}>
//                     <span style={{ color: ACCENT, fontSize:12, fontWeight:700, letterSpacing:'-0.01em' }}>View Nominees</span>
//                     <div
//                       style={{
//                         width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
//                         background: ACCENT_GRAD,
//                         boxShadow:`0 3px 10px ${ACCENT_GLOW}30`,
//                       }}
//                     >
//                       <ChevronRight size={13} color="white" />
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Modal ── */}
//       {showModal && (
//         <div
//           style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:50, animation:'fadeIn .2s ease both' }}
//           onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
//         >
//           <div
//             style={{
//               background:'rgba(255,255,255,0.95)', backdropFilter:'blur(30px)',
//               borderRadius:24, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto',
//               boxShadow:`0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.8), 0 0 40px ${ACCENT_GLOW}12`,
//               animation:'modalIn .35s cubic-bezier(.16,1,.3,1) both',
//             }}
//           >
//             {/* Modal header */}
//             <div
//               style={{
//                 display:'flex', alignItems:'center', justifyContent:'space-between',
//                 padding:'22px 28px', borderBottom:'1px solid #e8f0fe',
//               }}
//             >
//               <div style={{ display:'flex', alignItems:'center', gap:12 }}>
//                 <div style={{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: ACCENT_GRAD, boxShadow:`0 4px 14px ${ACCENT_GLOW}35` }}>
//                   <Sparkles size={16} color="white" />
//                 </div>
//                 <div>
//                   <h2 style={{ margin:0, color:'#0f172a', fontWeight:700, fontSize:17, letterSpacing:'-0.03em', fontFamily:"'Clash Display', sans-serif" }}>
//                     Create New Award
//                   </h2>
//                   <p style={{ margin:0, color:'#94a3b8', fontSize:12, marginTop:2 }}>Configure award details and evaluation criteria</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowModal(false)}
//                 style={{ background:'#f1f5f9', border:'none', cursor:'pointer', color:'#94a3b8', padding:8, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
//                 onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color='#ef4444' }}
//                 onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#94a3b8' }}
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             <form onSubmit={handleCreate} style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>

//               {/* Name */}
//               <div>
//                 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>Award Name *</label>
//                 <input
//                   type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
//                   style={{ width:'100%', padding:'12px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, color:'#0f172a', boxSizing:'border-box', transition:'all .2s' }}
//                   placeholder="e.g. Business Leader of the Year"
//                   required
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>Description *</label>
//                 <textarea
//                   value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
//                   style={{ width:'100%', padding:'12px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, color:'#0f172a', outline:'none', resize:'none', boxSizing:'border-box', transition:'all .2s' }}
//                   rows={3} placeholder="Describe the purpose and significance of this award..."
//                   required
//                 />
//               </div>

//               {/* Number */}
//               <div>
//                 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>Number of Nominees</label>
//                 <input
//                   type="number" min="1" max="20" value={form.num_nominees}
//                   onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
//                   style={{ width:110, padding:'12px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, color:'#0f172a', transition:'all .2s' }}
//                 />
//               </div>

//               {/* Criteria */}
//               <div>
//                 <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Evaluation Criteria</label>
//                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
//                   {CRITERIA.map(({ id, label }) => {
//                     const checked = form.criteria.includes(id)
//                     return (
//                       <div
//                         key={id}
//                         style={{
//                           border:`1.5px solid ${checked ? `${ACCENT_GLOW}50` : '#e2e8f0'}`,
//                           borderRadius:14, overflow:'hidden',
//                           background: checked ? '#eef3ff' : '#f8fafc',
//                           transition:'all .2s',
//                           boxShadow: checked ? `0 2px 12px ${ACCENT_GLOW}12` : 'none',
//                         }}
//                       >
//                         <div
//                           style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer' }}
//                           onClick={() => toggleCriteria(id)}
//                         >
//                           {/* Custom checkbox */}
//                           <div
//                             style={{
//                               width:20, height:20, borderRadius:6,
//                               border:`2px solid ${checked ? ACCENT_GLOW : '#cbd5e1'}`,
//                               background: checked ? ACCENT_GRAD : 'transparent',
//                               display:'flex', alignItems:'center', justifyContent:'center',
//                               flexShrink:0, transition:'all .2s',
//                               boxShadow: checked ? `0 2px 8px ${ACCENT_GLOW}40` : 'none',
//                             }}
//                           >
//                             {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
//                           </div>
//                           <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f172a', letterSpacing:'-0.01em' }}>{label}</span>
//                           <button
//                             type="button"
//                             onClick={e => { e.stopPropagation(); setExpandedCriteria(expandedCriteria === id ? null : id) }}
//                             style={{ fontSize:11, color: ACCENT, background:'rgba(29,90,219,0.08)', border:'none', cursor:'pointer', fontWeight:700, padding:'3px 10px', borderRadius:20, transition:'all .15s' }}
//                             onMouseEnter={e => e.currentTarget.style.background = `${ACCENT_GLOW}20`}
//                             onMouseLeave={e => e.currentTarget.style.background = 'rgba(29,90,219,0.08)'}
//                           >
//                             {expandedCriteria === id ? 'Hide' : 'Details'}
//                           </button>
//                         </div>
//                         {expandedCriteria === id && (
//                           <div style={{ padding:'0 14px 14px', borderTop:'1px solid #e8f0fe' }}>
//                             <ul style={{ margin:'10px 0 0', padding:0, display:'flex', flexDirection:'column', gap:7, listStyle:'none' }}>
//                               {CRITERIA_DETAILS[id].map((point, i) => (
//                                 <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:12, color:'#64748b' }}>
//                                   <div style={{ width:5, height:5, borderRadius:'50%', background: ACCENT_GRAD, marginTop:5, flexShrink:0 }} />
//                                   {point}
//                                 </li>
//                               ))}
//                             </ul>
//                           </div>
//                         )}
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>

//               {/* Actions */}
//               <div style={{ display:'flex', gap:10, paddingTop:4 }}>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   style={{
//                     flex:1, padding:'13px',
//                     background: loading ? '#94a3b8' : ACCENT_GRAD,
//                     color:'white', border:'none', borderRadius:12,
//                     fontSize:14, fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer',
//                     fontFamily:"'Plus Jakarta Sans', sans-serif",
//                     boxShadow: loading ? 'none' : `0 6px 24px ${ACCENT_GLOW}35`,
//                     position:'relative', overflow:'hidden',
//                     transition:'box-shadow .2s',
//                   }}
//                   onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = `0 10px 32px ${ACCENT_GLOW}55` }}
//                   onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = `0 6px 24px ${ACCENT_GLOW}35` }}
//                 >
//                   {!loading && <span className="shimmer-btn" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.5 }} />}
//                   {loading ? (
//                     <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
//                       <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
//                       Creating…
//                     </span>
//                   ) : 'Create Award'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   style={{ padding:'13px 22px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif", transition:'all .15s' }}
//                   onMouseEnter={e => { e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#334155' }}
//                   onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b' }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   )
// }

import { useState, useEffect } from 'react'
import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare, Trophy, Sparkles, Star, TrendingUp, Grid3X3, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

/* ─── constants ─────────────────────────────────────────────────── */
const G  = 'linear-gradient(135deg,#1B3A6B 0%,#2d5bb9 55%,#5b83d7 100%)'
const G2 = 'linear-gradient(135deg,#dde8ff 0%,#eef3ff 100%)'
const C  = '#1B3A6B'
const CG = '#2d5bb9'

const CRITERIA = [
  { id:'governance',      label:'Governance & Societal Responsibilities',  icon:'⚖️' },
  { id:'org_performance', label:'Organisational Performance',              icon:'📈' },
  { id:'general',         label:'General Eligibility',                     icon:'✅' },
]
const CRITERIA_DETAILS = {
  governance:      ['Contribution to society and nation at large','Personal values, ethics and corporate integrity','Contribution to positive evolution of government policy','Contribution towards globalisation of Indian economy'],
  org_performance: ['Display of corporate courage and leadership','Contribution towards evolving appropriate management culture','Contribution towards development of management profession','Vision and support for innovation and new ideas'],
  general:         ['Organisation must be operating in India','Business must have contributed substantially to Indian economy','Nominations of individuals from their own organisations will be considered'],
}

/* ─── helpers ───────────────────────────────────────────────────── */
const pill = (children, extraStyle={}) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:99, fontSize:11, fontWeight:700, background:'#eef3ff', color:C, ...extraStyle }}>
    {children}
  </span>
)

/* ─── AwardCard ─────────────────────────────────────────────────── */
function AwardCard({ award, index, onDelete, onClick }) {
  const [hov, setHov] = useState(false)
  const colors = [
    { from:'#1B3A6B', to:'#2d5bb9', light:'#eef3ff' },
    { from:'#0369a1', to:'#0ea5e9', light:'#f0f9ff' },
    { from:'#6b21a8', to:'#9333ea', light:'#f5f0ff' },
    { from:'#065f46', to:'#059669', light:'#ecfdf5' },
  ]
  const col = colors[index % colors.length]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:'#fff',
        borderRadius:22,
        overflow:'hidden',
        cursor:'pointer',
        transition:'all .28s cubic-bezier(.16,1,.3,1)',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hov
          ? `0 20px 60px rgba(29,90,219,0.16), 0 4px 12px rgba(0,0,0,0.06)`
          : '0 2px 16px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8)',
        animation: `cardIn .5s cubic-bezier(.16,1,.3,1) ${index*0.07}s both`,
        position:'relative',
      }}
    >
      {/* Coloured top band */}
      <div style={{
        height:7,
        background:`linear-gradient(90deg,${col.from},${col.to})`,
      }} />

      {/* Card body */}
      <div style={{ padding:'22px 24px 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          {/* Icon */}
          <div style={{
            width:50, height:50, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
            background:`linear-gradient(135deg,${col.from},${col.to})`,
            boxShadow:`0 8px 22px ${col.to}40`,
          }}>
            <Trophy size={22} color="#fff" />
          </div>
          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); onDelete(award.id, e) }}
            style={{ padding:7, background:'#f8fafc', border:'none', borderRadius:10, cursor:'pointer', color:'#cbd5e1', transition:'all .15s', display:'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.color='#cbd5e1' }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        <h3 style={{ margin:'0 0 6px', fontSize:16, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.03em', lineHeight:1.3 }}>
          {award.name}
        </h3>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#94a3b8', lineHeight:1.65, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {award.description}
        </p>

        {/* Chips row */}
        <div style={{ display:'flex', gap:7, marginBottom:20, flexWrap:'wrap' }}>
          {pill(<><Users size={9}/> {award.num_nominees} nominees</>, { background:col.light, color:col.from })}
          {pill(<><CheckSquare size={9}/> {award.criteria?.length||3} criteria</>, { background:col.light, color:col.from })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 24px',
        background: hov ? `linear-gradient(90deg,${col.light},#fff)` : '#fafbff',
        borderTop:'1px solid #f0f4ff',
        transition:'background .25s',
      }}>
        <span style={{ fontSize:12, fontWeight:700, color:col.from, letterSpacing:'-0.01em' }}>View Nominees</span>
        <div style={{
          width:28, height:28, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
          background:`linear-gradient(135deg,${col.from},${col.to})`,
          boxShadow:`0 3px 10px ${col.to}35`,
          transition:'transform .2s',
          transform: hov ? 'translateX(2px)' : 'translateX(0)',
        }}>
          <ChevronRight size={13} color="#fff" />
        </div>
      </div>
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function Awards() {
  const [awards, setAwards]         = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [expanded, setExpanded]     = useState(null)
  const [viewMode, setViewMode]     = useState('grid') // grid | list
  const [form, setForm] = useState({
    name:'', description:'', num_nominees:5,
    criteria:['governance','org_performance','general'],
  })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch {}
  }
  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/awards', form)
      setDrawerOpen(false)
      setForm({ name:'', description:'', num_nominees:5, criteria:['governance','org_performance','general'] })
      fetchAwards()
    } catch {} finally { setLoading(false) }
  }
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this award?')) return
    try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch {}
  }
  const toggleCriteria = (id) => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x=>x!==id) : [...c,id] })
  }

  const totalNominees = awards.reduce((s,a) => s+(a.num_nominees||0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

        @keyframes cardIn {
          from { opacity:0; transform:translateY(16px) scale(.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes pageIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes drawerIn {
          from { transform:translateX(100%); }
          to   { transform:translateX(0); }
        }
        @keyframes overlayIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        @keyframes statIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes orbDrift {
          0%,100% { transform:translate(0,0); }
          50%     { transform:translate(14px,-18px); }
        }
        @keyframes listIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .shimmer-btn {
          background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.32) 50%,transparent 100%);
          background-size:200% auto;
          animation:shimmer 2.2s linear infinite;
        }
        input:focus, textarea:focus { outline:none; }
        input,textarea { font-family:'Plus Jakarta Sans',sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#dde8ff; border-radius:4px; }

        .stat-card {
          background:rgba(255,255,255,.82);
          backdrop-filter:blur(18px);
          border-radius:18px;
          border:1px solid rgba(255,255,255,.9);
          padding:20px 24px;
          box-shadow:0 4px 20px rgba(0,0,0,0.05);
          animation:statIn .5s ease both;
        }
        .list-row {
          background:#fff;
          border-radius:16px;
          border:1px solid #f0f4ff;
          padding:18px 22px;
          display:flex;
          align-items:center;
          gap:16px;
          cursor:pointer;
          transition:all .2s ease;
          box-shadow:0 2px 10px rgba(0,0,0,0.04);
          animation:listIn .4s ease both;
        }
        .list-row:hover {
          border-color:#2d5bb940;
          box-shadow:0 6px 24px rgba(29,90,219,0.1);
          transform:translateX(3px);
        }
      `}</style>

      {/* ── Page wrapper ── */}
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(160deg,#eef3ff 0%,#f0f7ff 40%,#e8f4ff 100%)',
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        position:'relative',
        overflow:'hidden',
      }}>
        {/* Ambient orbs */}
        <div style={{ position:'fixed', top:-200, right:-150, width:600, height:600, borderRadius:'50%', background:`${CG}1a`, filter:'blur(90px)', animation:'orbDrift 16s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'fixed', bottom:-150, left:-80,  width:440, height:440, borderRadius:'50%', background:`${CG}14`, filter:'blur(80px)', animation:'orbDrift 18s ease-in-out -6s infinite', pointerEvents:'none' }} />
        <div style={{ position:'fixed', inset:0, backgroundImage:`radial-gradient(circle,${CG}0f 1px,transparent 1px)`, backgroundSize:'34px 34px', pointerEvents:'none' }} />

        {/* ── Hero header bar ── */}
        <div style={{
          position:'relative', zIndex:1,
          borderBottom:'1px solid rgba(255,255,255,.7)',
          background:'rgba(255,255,255,.55)',
          backdropFilter:'blur(28px)',
          padding:'28px 40px 24px',
          animation:'pageIn .5s ease both',
        }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:52, height:52, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
                  background:G,
                  boxShadow:`0 10px 28px ${CG}40`,
                  position:'relative',
                }}>
                  <Award size={24} color="#fff" />
                  <div style={{ position:'absolute', top:-3, right:-3, width:16, height:16, borderRadius:'50%', background:'#f59e0b', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Star size={8} color="#fff" fill="#fff" />
                  </div>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.04em' }}>
                      Awards
                    </h1>
                    <span style={{ padding:'3px 10px', background:G, color:'#fff', borderRadius:99, fontSize:11, fontWeight:700, boxShadow:`0 3px 10px ${CG}35` }}>
                      {awards.length} total
                    </span>
                  </div>
                  <p style={{ margin:'3px 0 0', fontSize:13, color:'#94a3b8' }}>
                    Manage award categories for the NobleCrest platform
                  </p>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {/* View toggle */}
                <div style={{ display:'flex', background:'#f1f5f9', borderRadius:12, padding:4, gap:2 }}>
                  {[['grid', <Grid3X3 size={14}/>], ['list', <List size={14}/>]].map(([mode, icon]) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      style={{
                        width:34, height:34, border:'none', borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        background: viewMode===mode ? '#fff' : 'transparent',
                        color: viewMode===mode ? C : '#94a3b8',
                        boxShadow: viewMode===mode ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                        transition:'all .18s',
                      }}
                    >{icon}</button>
                  ))}
                </div>

                <button
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'11px 22px',
                    background:G, color:'#fff', border:'none', borderRadius:13,
                    fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'-0.01em',
                    boxShadow:`0 6px 22px ${CG}40`,
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                    position:'relative', overflow:'hidden',
                    transition:'box-shadow .2s,transform .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 10px 32px ${CG}55`; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow=`0 6px 22px ${CG}40`; e.currentTarget.style.transform='translateY(0)' }}
                >
                  <span className="shimmer-btn" style={{ position:'absolute',inset:0,pointerEvents:'none',opacity:.7 }} />
                  <Plus size={15}/> New Award
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display:'flex', gap:12 }}>
              {[
                { label:'Total Awards', value:awards.length, icon:<Trophy size={14}/>, delay:'.08s' },
                { label:'Total Nominees', value:totalNominees, icon:<Users size={14}/>, delay:'.14s' },
                { label:'Criteria Sets', value:awards.length * 3, icon:<CheckSquare size={14}/>, delay:'.2s' },
                { label:'Avg Nominees', value:awards.length ? Math.round(totalNominees/awards.length) : 0, icon:<TrendingUp size={14}/>, delay:'.26s' },
              ].map(({ label, value, icon, delay }) => (
                <div key={label} className="stat-card" style={{ flex:1, animationDelay:delay }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</span>
                    <span style={{ color:CG, display:'flex' }}>{icon}</span>
                  </div>
                  <span style={{ fontSize:28, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.04em' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'32px 40px 60px' }}>

          {awards.length === 0 ? (
            /* Empty state */
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'100px 24px',
              background:'rgba(255,255,255,.75)', backdropFilter:'blur(20px)',
              borderRadius:28, border:'1px solid rgba(255,255,255,.9)',
              boxShadow:'0 8px 40px rgba(0,0,0,0.06)',
              textAlign:'center',
              animation:'pageIn .5s ease .15s both',
            }}>
              <div style={{ width:72, height:72, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', background:G, boxShadow:`0 12px 36px ${CG}40`, marginBottom:20 }}>
                <Award size={30} color="#fff" />
              </div>
              <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.04em' }}>
                No awards yet
              </h2>
              <p style={{ margin:'0 0 28px', fontSize:13, color:'#94a3b8', maxWidth:280, lineHeight:1.7 }}>
                Create your first award category to start collecting nominations.
              </p>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'13px 26px',
                  background:G, color:'#fff', border:'none', borderRadius:13,
                  fontSize:14, fontWeight:700, cursor:'pointer',
                  boxShadow:`0 8px 28px ${CG}40`,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  position:'relative', overflow:'hidden',
                }}
              >
                <span className="shimmer-btn" style={{ position:'absolute',inset:0,pointerEvents:'none',opacity:.7 }} />
                <Plus size={15}/> Create First Award
              </button>
            </div>

          ) : viewMode === 'grid' ? (
            /* Grid view */
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
              {awards.map((award, i) => (
                <AwardCard
                  key={award.id}
                  award={award}
                  index={i}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
                />
              ))}
            </div>

          ) : (
            /* List view */
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {awards.map((award, i) => {
                const cols = [
                  ['#1B3A6B','#2d5bb9'],['#0369a1','#0ea5e9'],['#6b21a8','#9333ea'],['#065f46','#059669'],
                ]
                const [from,to] = cols[i%cols.length]
                return (
                  <div key={award.id} className="list-row" style={{ animationDelay:`${i*.05}s` }}
                    onClick={() => navigate(`/admin/nominees?award=${award.id}`)}>
                    <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${from},${to})`, boxShadow:`0 6px 18px ${to}35` }}>
                      <Trophy size={19} color="#fff" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.02em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {award.name}
                        </h3>
                        {pill(<><Users size={9}/> {award.num_nominees}</>, { background:`${from}14`, color:from })}
                      </div>
                      <p style={{ margin:0, fontSize:12, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{award.description}</p>
                    </div>
                    <button onClick={e => handleDelete(award.id, e)}
                      style={{ padding:7, background:'transparent', border:'none', cursor:'pointer', color:'#cbd5e1', borderRadius:9, flexShrink:0, transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444' }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#cbd5e1' }}>
                      <Trash2 size={13}/>
                    </button>
                    <div style={{ width:30, height:30, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${from},${to})`, flexShrink:0 }}>
                      <ChevronRight size={14} color="#fff"/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          style={{ position:'fixed', inset:0, zIndex:100, display:'flex' }}
          onClick={e => { if(e.target===e.currentTarget) setDrawerOpen(false) }}
        >
          {/* Scrim */}
          <div style={{ flex:1, background:'rgba(15,23,42,.35)', backdropFilter:'blur(6px)', animation:'overlayIn .25s ease both' }} />

          {/* Drawer panel */}
          <div style={{
            width:'100%', maxWidth:520,
            height:'100%', overflowY:'auto',
            background:'rgba(255,255,255,.97)', backdropFilter:'blur(40px)',
            boxShadow:'-24px 0 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,.8)',
            animation:'drawerIn .38s cubic-bezier(.16,1,.3,1) both',
            display:'flex', flexDirection:'column',
          }}>

            {/* Drawer header */}
            <div style={{
              padding:'28px 32px 24px',
              background:'linear-gradient(180deg,rgba(238,243,255,.9) 0%,rgba(255,255,255,0) 100%)',
              borderBottom:'1px solid #e8f0fe',
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:46, height:46, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:G, boxShadow:`0 8px 24px ${CG}35` }}>
                    <Sparkles size={20} color="#fff"/>
                  </div>
                  <div>
                    <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#0f172a', fontFamily:"'Clash Display',sans-serif", letterSpacing:'-0.04em' }}>
                      New Award
                    </h2>
                    <p style={{ margin:'3px 0 0', fontSize:12, color:'#94a3b8' }}>Configure details & criteria</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ width:36, height:36, border:'none', borderRadius:11, background:'#f1f5f9', cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color='#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#94a3b8' }}
                >
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:22, flex:1 }}>

              {/* Award name */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Award Name *
                </label>
                <input
                  type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required
                  placeholder="e.g. Business Leader of the Year"
                  style={{ width:'100%', padding:'13px 16px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:13, fontSize:14, color:'#0f172a', boxSizing:'border-box', transition:'all .2s' }}
                  onFocus={e => { e.target.style.borderColor=CG; e.target.style.boxShadow=`0 0 0 3px ${CG}18`; e.target.style.background='#fff' }}
                  onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Description *
                </label>
                <textarea
                  value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required
                  rows={4} placeholder="Describe the purpose and significance of this award…"
                  style={{ width:'100%', padding:'13px 16px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:13, fontSize:14, color:'#0f172a', resize:'none', boxSizing:'border-box', transition:'all .2s' }}
                  onFocus={e => { e.target.style.borderColor=CG; e.target.style.boxShadow=`0 0 0 3px ${CG}18`; e.target.style.background='#fff' }}
                  onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc' }}
                />
              </div>

              {/* Nominees count */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
                  Number of Nominees
                </label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <input
                    type="number" min="1" max="20" value={form.num_nominees}
                    onChange={e=>setForm({...form,num_nominees:parseInt(e.target.value)})}
                    style={{ width:110, padding:'13px 16px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:13, fontSize:14, color:'#0f172a', transition:'all .2s' }}
                    onFocus={e => { e.target.style.borderColor=CG; e.target.style.boxShadow=`0 0 0 3px ${CG}18`; e.target.style.background='#fff' }}
                    onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc' }}
                  />
                  <span style={{ fontSize:12, color:'#94a3b8' }}>nominees per award (1–20)</span>
                </div>
              </div>

              {/* Criteria */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10 }}>
                  Evaluation Criteria
                </label>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {CRITERIA.map(({ id, label, icon }) => {
                    const on = form.criteria.includes(id)
                    const isExp = expanded===id
                    return (
                      <div key={id} style={{
                        borderRadius:15, overflow:'hidden',
                        border:`1.5px solid ${on ? `${CG}45` : '#e2e8f0'}`,
                        background: on ? 'linear-gradient(135deg,#eef3ff,#f5f8ff)' : '#f8fafc',
                        transition:'all .2s',
                        boxShadow: on ? `0 3px 14px ${CG}12` : 'none',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer' }}
                          onClick={() => toggleCriteria(id)}>
                          {/* Checkbox */}
                          <div style={{
                            width:22, height:22, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                            background: on ? G : '#fff',
                            border:`2px solid ${on ? CG : '#d1d5db'}`,
                            boxShadow: on ? `0 3px 10px ${CG}40` : 'none',
                            transition:'all .22s',
                          }}>
                            {on && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize:12, marginRight:'auto' }}>{icon}</span>
                          <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#0f172a', letterSpacing:'-0.01em' }}>{label}</span>
                          <button type="button"
                            onClick={e => { e.stopPropagation(); setExpanded(isExp?null:id) }}
                            style={{ fontSize:11, fontWeight:700, color:C, background:on?`${CG}18`:'#f1f5f9', border:'none', cursor:'pointer', padding:'4px 11px', borderRadius:99, transition:'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background=`${CG}28`}
                            onMouseLeave={e => e.currentTarget.style.background=on?`${CG}18`:'#f1f5f9'}
                          >
                            {isExp ? 'Hide' : 'Details'}
                          </button>
                        </div>
                        {isExp && (
                          <div style={{ padding:'0 16px 14px', borderTop:'1px solid #e8f0fe' }}>
                            <ul style={{ margin:'10px 0 0', padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                              {CRITERIA_DETAILS[id].map((pt,i) => (
                                <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:12, color:'#64748b', lineHeight:1.55 }}>
                                  <div style={{ width:6, height:6, borderRadius:'50%', background:G, marginTop:4, flexShrink:0 }}/>
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions pinned at bottom */}
              <div style={{ marginTop:'auto', paddingTop:8, display:'flex', gap:10 }}>
                <button type="submit" disabled={loading}
                  style={{
                    flex:1, padding:'14px',
                    background: loading ? '#94a3b8' : G,
                    color:'#fff', border:'none', borderRadius:13,
                    fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer',
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                    boxShadow: loading?'none':`0 7px 26px ${CG}40`,
                    position:'relative', overflow:'hidden',
                    transition:'box-shadow .2s,transform .15s',
                  }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.boxShadow=`0 12px 34px ${CG}55`; e.currentTarget.style.transform='translateY(-1px)' }}}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow=loading?'none':`0 7px 26px ${CG}40`; e.currentTarget.style.transform='translateY(0)' }}
                >
                  {!loading && <span className="shimmer-btn" style={{ position:'absolute',inset:0,pointerEvents:'none',opacity:.6 }} />}
                  {loading
                    ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                        <div style={{ width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite' }} />
                        Creating…
                      </span>
                    : '✦ Create Award'
                  }
                </button>
                <button type="button" onClick={() => setDrawerOpen(false)}
                  style={{ padding:'14px 22px', background:'#f1f5f9', color:'#64748b', border:'none', borderRadius:13, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#334155' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}