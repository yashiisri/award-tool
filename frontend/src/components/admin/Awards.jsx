import { useState, useEffect } from 'react'
import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const CRITERIA = [
  { id: 'governance',      label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general',         label: 'General Eligibility' },
  { id: 'innovation',      label: 'Innovation & Strategic Partnership' },
  { id: 'leadership',      label: 'Leadership' },
  { id: 'impact',          label: 'Impact on Workforce & Environment' },
]
const DEFAULT_CRITERIA = CRITERIA.map(c => c.id)

function AwardCard({ award, onDelete, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#A8BBDA' : 'var(--border-light)'}`,
        borderTop: `3px solid ${hov ? 'var(--kpmg-blue)' : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: hov ? '0 8px 28px rgba(0,32,91,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ padding: '24px 26px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: hov ? 'var(--kpmg-blue)' : '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
            <Award size={19} color={hov ? '#fff' : 'var(--kpmg-blue)'} strokeWidth={1.6} />
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(award.id, e) }}
            style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border)', transition: 'all 0.15s', display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--border)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: 'var(--kpmg-navy)', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
          {award.name}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {award.description}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#EEF3FF', color: 'var(--kpmg-blue)', fontSize: 12, fontWeight: 500 }}>
            <Users size={12} /> {award.num_nominees} nominees
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#EEF3FF', color: 'var(--kpmg-blue)', fontSize: 12, fontWeight: 500 }}>
            <CheckSquare size={12} /> {award.criteria?.length || 6} criteria
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px', background: hov ? '#F8FAFF' : '#FAFBFD', borderTop: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kpmg-blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>View Nominees</span>
        <ChevronRight size={16} color="var(--kpmg-blue)" />
      </div>
    </div>
  )
}

export default function Awards() {
  const [awards, setAwards]       = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: DEFAULT_CRITERIA })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch {}
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
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>

      <PageHeader
        icon={Award}
        title="Awards"
        subtitle="Configure award categories for the Managing India Awards 2026"
        action={
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: 'var(--kpmg-blue)', color: '#fff',
            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--kpmg-navy)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--kpmg-blue)'}>
            <Plus size={13} /> New Award
          </button>
        }
      />

      {/* Empty state */}
      {awards.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--kpmg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Award size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No awards configured yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Create your first award category to begin the nomination process.</p>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--kpmg-blue)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <Plus size={13} /> Create Award
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {awards.map(award => (
            <AwardCard key={award.id} award={award} onDelete={handleDelete} onClick={() => navigate(`/admin/nominees?award=${award.id}`)} />
          ))}
        </div>
      )}

      {/* Modal */}
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
