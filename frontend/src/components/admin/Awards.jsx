import { useState, useEffect } from 'react'
import { Plus, Trophy, X, Trash2, Users, CheckSquare, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const CRITERIA = [
  { id: 'governance',      label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general',         label: 'General Eligibility' },
  { id: 'innovation',      label: 'Innovation & Strategic Partnership' },
  { id: 'leadership',      label: 'Leadership' },
  { id: 'impact',          label: 'Impact on Workforce & Environment' },
]
const DEFAULT_CRITERIA = CRITERIA.map(c => c.id)

// Same two-state phase badge used on the Jury/Head Jury award lists — no
// badge at all unless Admin has actually opened that phase in Vote Control.
function statusFor(control) {
  if (control?.voting_enabled) return { label: 'Voting Open', bg: '#F0FDF4', text: '#15803D' }
  if (control?.nomination_enabled) return { label: 'Nominations Open', bg: '#EEF3FF', text: 'var(--kpmg-blue)' }
  return null
}

function AwardCard({ award, control, onDelete, onClick }) {
  const [hov, setHov] = useState(false)
  const status = statusFor(control)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        borderRadius: 10,
        border: `1px solid ${hov ? 'var(--kpmg-mid-blue)' : 'var(--border-light)'}`,
        borderTop: `3px solid ${hov ? 'var(--gold)' : 'var(--border-light)'}`,
        cursor: 'pointer',
        boxShadow: hov ? '0 10px 28px rgba(0,32,91,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, minHeight: 21 }}>
          {status ? (
            <span style={{
              padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', background: status.bg, color: status.text,
            }}>
              {status.label}
            </span>
          ) : <span />}
          <button
            onClick={e => { e.stopPropagation(); onDelete(award.id, e) }}
            style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <h3 style={{ margin: '0 0 7px', fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: 'var(--kpmg-navy)', lineHeight: 1.32, letterSpacing: '-0.005em' }}>
          {award.name}
        </h3>
        <p style={{
          margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {award.description}
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Users size={12} strokeWidth={1.8} /> {award.num_nominees} nominees
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <CheckSquare size={12} strokeWidth={1.8} /> {award.criteria?.length || 6} criteria
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kpmg-blue)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>View Nominees</span>
        <ChevronRight size={15} color="var(--kpmg-blue)" />
      </div>
    </div>
  )
}

export default function Awards() {
  const [awards, setAwards]       = useState([])
  const [controls, setControls]   = useState({})
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: DEFAULT_CRITERIA })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards(); fetchControls() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch {}
  }
  const fetchControls = async () => {
    try {
      const { data } = await api.get('/admin/vote-control')
      const map = {}
      data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch {}
  }
  const handleCreate = async e => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/awards', form)
      setShowModal(false)
      setForm({ name: '', description: '', num_nominees: 5, criteria: DEFAULT_CRITERIA })
      fetchAwards()
    } catch {} finally { setLoading(false) }
  }
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this award and all its nominees?')) return
    try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch {}
  }
  const toggleCriteria = id => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: '32px 36px 0' }}>

        {/* Header — same gold-accent / Playfair language as the sign-in screens */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
                AIMA · Administration Console
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
              Award Categories
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Configure categories for the 2026 Managing India Awards
            </p>
          </div>

          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 6,
            background: '#fff', color: 'var(--kpmg-blue)', border: '1px solid var(--kpmg-blue)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#EEF3FF'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <Plus size={13} /> New Award
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

        {/* Empty state */}
        {awards.length === 0 ? (
          <div style={{
            padding: '80px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <Trophy size={36} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 18 }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: 'var(--kpmg-navy)', marginBottom: 8 }}>
              No award categories configured
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 22, maxWidth: 360 }}>
              Add the AIMA Managing India Awards categories to begin the evaluation process.
            </p>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 6,
              background: 'var(--kpmg-blue)', color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={13} /> Add First Award
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, paddingBottom: 36 }}>
            {awards.map(award => (
              <AwardCard
                key={award.id}
                award={award}
                control={controls[award.id]}
                onDelete={handleDelete}
                onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — unchanged */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, animation: 'fadeIn 0.15s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,20,60,0.2)', animation: 'modalIn 0.2s ease' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '2px solid var(--kpmg-blue)' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }}>Create New Award</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>Configure category details and evaluation criteria</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--kpmg-navy)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Name */}
              <FormField label="Award Name">
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputSt} placeholder="e.g. Business Leader of the Year"
                  onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  required />
              </FormField>

              {/* Description */}
              <FormField label="Description">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputSt, resize: 'vertical' }} rows={3}
                  placeholder="Describe the purpose and significance of this award…"
                  onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  required />
              </FormField>

              {/* Nominees */}
              <FormField label="Number of Nominees">
                <input type="number" min="1" max="20" value={form.num_nominees}
                  onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                  style={{ ...inputSt, width: 90 }}
                  onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </FormField>

              {/* Criteria */}
              <FormField label="Evaluation Criteria">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CRITERIA.map(({ id, label }) => {
                    const checked = form.criteria.includes(id)
                    return (
                      <div key={id} style={{ border: `1px solid ${checked ? '#A8BBDA' : 'var(--border-light)'}`, background: checked ? '#F0F4FF' : '#FAFBFD', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }} onClick={() => toggleCriteria(id)}>
                          <div style={{ width: 15, height: 15, border: `1.5px solid ${checked ? 'var(--kpmg-blue)' : 'var(--border)'}`, background: checked ? 'var(--kpmg-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {checked && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: 'var(--text-primary)' }}>{label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </FormField>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '10px',
                  background: loading ? '#9BA8B5' : 'var(--kpmg-blue)', color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-navy)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-blue)' }}>
                  {loading && <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                  {loading ? 'Creating…' : 'Create Award'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 18px', background: '#fff', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inputSt = {
  width: '100%', padding: '9px 11px',
  background: '#fff',
  border: '1px solid var(--border)',
  borderLeft: '2px solid var(--border)',
  fontSize: 13, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
