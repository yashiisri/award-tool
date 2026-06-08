// import { useState, useEffect } from 'react'
// import { Plus, Flag, User, X, AlertTriangle } from 'lucide-react'
// import api from '../../api/axios'
// import PageHeader from '../layout/PageHeader'

// export default function Nominees() {
//   const [nominees, setNominees] = useState([])
//   const [categories, setCategories] = useState([])
//   const [showModal, setShowModal] = useState(false)
//   const [showFlagModal, setShowFlagModal] = useState(null)
//   const [flagReason, setFlagReason] = useState('')
//   const [form, setForm] = useState({ name: '', category_id: '', rationale: '' })
//   const [loading, setLoading] = useState(false)

//   useEffect(() => { fetchCategories() }, [])

//   const fetchCategories = async () => {
//     try { const { data } = await api.get('/admin/categories'); setCategories(data) }
//     catch (err) { console.error(err) }
//   }

//   const handleCreate = async (e) => {
//     e.preventDefault(); setLoading(true)
//     try {
//       await api.post('/admin/nominees', { name: form.name, category_id: form.category_id, rationale_data: { rationale: form.rationale } })
//       setShowModal(false); setForm({ name: '', category_id: '', rationale: '' })
//     } catch (err) { console.error(err) }
//     finally { setLoading(false) }
//   }

//   const handleRedFlag = async () => {
//     if (!flagReason.trim()) return
//     try {
//       await api.post('/admin/red-flag', { nominee_id: showFlagModal, reason: flagReason })
//       setShowFlagModal(null); setFlagReason('')
//     } catch (err) { console.error(err) }
//   }

//   return (
//     <div className="p-8">
//       <PageHeader icon={User} title="Nominees" subtitle="Add and manage nominees from available rationale data" accent="#00338D" light="#EEF2FA"
//         action={
//           <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm">
//             <Plus className="w-4 h-4" /> Add Nominee
//           </button>
//         }
//       />

//       {nominees.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
//           <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
//             <User className="w-7 h-7 text-[#00338D]" />
//           </div>
//           <p className="text-gray-400 text-sm font-medium">No nominees added yet.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {nominees.map((nom) => (
//             <div key={nom.id} className={`p-6 bg-white border rounded-2xl transition-all ${nom.red_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'}`}>
//               <div className="flex items-start justify-between mb-4">
//                 <div className="w-10 h-10 bg-[#EEF2FA] rounded-xl flex items-center justify-center">
//                   <User className="w-5 h-5 text-[#00338D]" />
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {nom.red_flagged && <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-lg font-medium"><AlertTriangle className="w-3 h-3" /> Flagged</span>}
//                   <button onClick={() => setShowFlagModal(nom.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
//                     <Flag className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//               <h3 className="font-bold text-[#1a1a2e] mb-1">{nom.name}</h3>
//               <p className="text-gray-400 text-xs">{nom.category_id}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {showModal && (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-black text-[#1a1a2e]">Add Nominee</h2>
//               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
//             </div>
//             <form onSubmit={handleCreate} className="space-y-4">
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
//                 <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" placeholder="Nominee name" required />
//               </div>
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
//                 <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" required>
//                   <option value="">Select category</option>
//                   {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rationale</label>
//                 <textarea value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
//                   className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 resize-none text-sm" rows="3" placeholder="Why is this person nominated?" required />
//               </div>
//               <div className="flex gap-3 pt-2">
//                 <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
//                   {loading ? 'Adding...' : 'Add Nominee'}
//                 </button>
//                 <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {showFlagModal && (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
//             <div className="flex items-center gap-3 mb-6">
//               <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
//                 <Flag className="w-5 h-5 text-red-500" />
//               </div>
//               <h2 className="text-xl font-black text-[#1a1a2e]">Red Flag Nominee</h2>
//             </div>
//             <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4" rows="3" placeholder="Reason for red flagging..." />
//             <div className="flex gap-3">
//               <button onClick={handleRedFlag} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">Confirm Flag</button>
//               <button onClick={() => { setShowFlagModal(null); setFlagReason('') }} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


import { useState, useEffect } from 'react'
import { Plus, Flag, User, X, AlertTriangle, Building2, Briefcase, Search, CheckCircle, Trash2, MoreVertical, Users, ShieldAlert, Clock } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

// ── Mock categories (replace with API) ────────────────────────────────────────
const MOCK_CATEGORIES = [
  { id: 'cat1', name: 'CEO of the Year' },
  { id: 'cat2', name: 'Rising Star Award' },
  { id: 'cat3', name: 'Innovation Excellence' },
  { id: 'cat4', name: 'Sustainability Leader' },
]

// ── Utilities ─────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'
}

const AVATAR_COLORS = ['#1e3a5f', '#2d6a4f', '#5c2d91', '#7d1a1a', '#1a4a6b', '#4a1942']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 800, color: '#fff',
      fontFamily: "'DM Sans', sans-serif", flexShrink: 0, letterSpacing: -0.5,
    }}>
      {getInitials(name)}
    </div>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────
function Pill({ flagged }) {
  if (flagged) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
      <AlertTriangle size={10} /> Flagged
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
      <Clock size={10} /> Pending
    </span>
  )
}

// ── Nominee Card ──────────────────────────────────────────────────────────────
function NomineeCard({ nom, onFlag, onDelete, index }) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      style={{
        background: nom.red_flagged ? '#fffafa' : '#fff',
        border: nom.red_flagged ? '1px solid #fecaca' : hovered ? '1px solid #93c5fd' : '1px solid #e5e9f0',
        borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,51,141,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        animation: `fadeSlideIn 0.4s ease both`,
        animationDelay: `${index * 70}ms`,
        position: 'relative',
      }}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: nom.red_flagged ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />

      <div style={{ padding: '18px 20px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <Avatar name={nom.name} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>{nom.name}</span>
            </div>
            {nom.designation && (
              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <Briefcase size={11} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.designation}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={11} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom.category_name || nom.category_id}</span>
            </div>
          </div>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e5e9f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
            >
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', border: '1px solid #e5e9f0', borderRadius: 12, padding: 6, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 150 }}>
                {!nom.red_flagged && (
                  <button onClick={() => { onFlag(nom.id); setMenuOpen(false) }} style={menuItem('#b45309')}>
                    <Flag size={12} /> Flag nominee
                  </button>
                )}
                <button onClick={() => { onDelete(nom.id); setMenuOpen(false) }} style={menuItem('#dc2626')}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <Pill flagged={nom.red_flagged} />

        {nom.red_flagged && nom.flag_reason && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 11, color: '#b91c1c', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{nom.flag_reason}</span>
          </div>
        )}

        {nom.rationale && (
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65, marginTop: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {nom.rationale}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 18px 14px', borderTop: '1px solid #f1f5f9' }}>
        {!nom.red_flagged ? (
          <button
            onClick={() => onFlag(nom.id)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = '#c2410c' }}
          >
            <Flag size={12} /> Flag
          </button>
        ) : (
          <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ShieldAlert size={12} /> Flagged
          </div>
        )}
        <button
          onClick={() => onDelete(nom.id)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

const menuItem = (color = '#374151') => ({
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
  fontSize: 13, color, cursor: 'pointer', textAlign: 'left',
  fontFamily: "'DM Sans', sans-serif", transition: 'background 0.1s',
})

// ── Add Nominee Modal ─────────────────────────────────────────────────────────
function AddModal({ categories, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', designation: '', category_id: '', rationale: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.category_id || !form.rationale) return
    setLoading(true)
    try {
      await api.post('/admin/nominees', {
        name: form.name,
        designation: form.designation,
        category_id: form.category_id,
        rationale_data: { rationale: form.rationale },
      })
      const cat = categories.find(c => c.id === form.category_id)
      onAdd({ ...form, id: `n${Date.now()}`, red_flagged: false, category_name: cat?.name })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fields = [
    { label: 'Full Name', key: 'name', placeholder: 'e.g. Roshni Nadar Malhotra', required: true },
    { label: 'Designation (optional)', key: 'designation', placeholder: 'e.g. Chairperson' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Add Nominee</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Add a candidate to an award category</p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e9f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.map(({ label, key, placeholder, required }) => (
              <div key={key}>
                <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
                <input
                  type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            <div>
              <label style={labelStyle}>Category<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', paddingRight: 36, color: form.category_id ? '#0f172a' : '#94a3b8' }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select a category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Rationale<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
              <textarea
                value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })}
                placeholder="Why is this person nominated?" rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.category_id || !form.rationale}
              style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: loading ? '#93c5fd' : '#1d4ed8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
            >
              {loading
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Adding…</>
                : <><Plus size={14} /> Add Nominee</>}
            </button>
            <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Flag Modal ────────────────────────────────────────────────────────────────
function FlagModal({ nomineeId, nomineeName, onClose, onFlag }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) return
    setLoading(true)
    try {
      await api.post('/admin/red-flag', { nominee_id: nomineeId, reason })
      onFlag(nomineeId, reason)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#ef4444,#f97316)', borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flag size={18} color="#dc2626" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Flag Nominee</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>{nomineeName}</p>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e9f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={13} /></button>
          </div>

          <label style={labelStyle}>Reason for flagging<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} autoFocus
            placeholder="Describe the concern with this nominee…" rows={4}
            style={{ ...inputStyle, borderColor: '#fecaca', marginBottom: 16, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#f87171'}
            onBlur={e => e.target.style.borderColor = '#fecaca'}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleConfirm}
              disabled={!reason.trim() || loading}
              style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: loading ? '#fca5a5' : '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
            >
              {loading
                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Flagging…</>
                : <><AlertTriangle size={13} /> Confirm Flag</>}
            </button>
            <button onClick={onClose} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared input/label styles ─────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box', background: '#fafbfc',
  transition: 'border 0.15s',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ nominees }) {
  const total = nominees.length
  const flagged = nominees.filter(n => n.red_flagged).length
  const pending = total - flagged
  const cats = new Set(nominees.map(n => n.category_id)).size

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
      {[
        { label: 'Total nominees', value: total, color: '#3b82f6', bg: '#eff6ff', icon: <Users size={16} /> },
        { label: 'Pending review', value: pending, color: '#7c3aed', bg: '#faf5ff', icon: <Clock size={16} /> },
        { label: 'Flagged', value: flagged, color: '#dc2626', bg: '#fef2f2', icon: <Flag size={16} /> },
        { label: 'Categories', value: cats, color: '#059669', bg: '#f0fdf4', icon: <CheckCircle size={16} /> },
      ].map(({ label, value, color, bg, icon }) => (
        <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${color}20`, animation: 'fadeSlideIn 0.4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color }}>
            {icon}
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Nominees() {
  const [nominees, setNominees] = useState([])
  const [categories, setCategories] = useState(MOCK_CATEGORIES)
  const [showAddModal, setShowAddModal] = useState(false)
  const [flagTarget, setFlagTarget] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try { const { data } = await api.get('/admin/categories'); setCategories(data) }
    catch { /* fallback to mock */ }
  }

  const handleAdd = nom => {
    setNominees(prev => [...prev, nom])
    setShowAddModal(false)
  }

  const handleFlag = (id, reason) => {
    setNominees(prev => prev.map(n => n.id === id ? { ...n, red_flagged: true, flag_reason: reason } : n))
    setFlagTarget(null)
  }

  const handleDelete = id => {
    setNominees(prev => prev.filter(n => n.id !== id))
  }

  const flagTarget_nom = nominees.find(n => n.id === flagTarget)

  const filtered = nominees.filter(n => {
    const matchSearch = !searchTerm || n.name.toLowerCase().includes(searchTerm.toLowerCase()) || (n.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = filterCat === 'all' || n.category_id === filterCat || (filterCat === 'flagged' && n.red_flagged)
    return matchSearch && matchCat
  })

  const usedCats = [...new Set(nominees.map(n => n.category_id))]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: '36px 40px', maxWidth: 1100, margin: '0 auto', minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing:border-box; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(29,78,216,0.3)' }}>
            <User size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: -0.5 }}>Nominees</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '3px 0 0' }}>Add and manage nominees from available rationale data</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e40af'}
          onMouseLeave={e => e.currentTarget.style.background = '#1d4ed8'}
        >
          <Plus size={14} /> Add Nominee
        </button>
      </div>

      {/* Stats (only when nominees exist) */}
      {nominees.length > 0 && <StatsBar nominees={nominees} />}

      {/* Search + category filter */}
      {nominees.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or category…"
              style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#0f172a', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'flagged', ...usedCats].filter((v, i, a) => a.indexOf(v) === i).map(f => {
              const label = f === 'all' ? 'All' : f === 'flagged' ? '🚩 Flagged' : categories.find(c => c.id === f)?.name || f
              return (
                <button key={f} onClick={() => setFilterCat(f)} style={{ padding: '8px 14px', borderRadius: 8, border: filterCat === f ? 'none' : '1.5px solid #e2e8f0', background: filterCat === f ? '#1d4ed8' : '#fff', color: filterCat === f ? '#fff' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {nominees.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={32} color="#3b82f6" />
          </div>
          <p style={{ fontWeight: 800, color: '#374151', fontSize: 16, margin: '0 0 8px' }}>No nominees yet</p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>Add your first nominee to get started.</p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> Add First Nominee
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', textAlign: 'center' }}>
          <Search size={28} color="#94a3b8" style={{ marginBottom: 12 }} />
          <p style={{ fontWeight: 700, color: '#374151', fontSize: 15, margin: '0 0 6px' }}>No matches found</p>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {filtered.map((nom, i) => (
            <NomineeCard
              key={nom.id}
              nom={nom}
              index={i}
              onFlag={id => setFlagTarget(id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddModal categories={categories} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
      {flagTarget && flagTarget_nom && (
        <FlagModal
          nomineeId={flagTarget}
          nomineeName={flagTarget_nom.name}
          onClose={() => setFlagTarget(null)}
          onFlag={handleFlag}
        />
      )}
    </div>
  )
}