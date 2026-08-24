import { useState, useEffect } from 'react'
import { Award, Plus, X, Users, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACCENT = 'var(--kpmg-blue)'
const LIGHT = '#EEF3FF'

const CRITERIA = [
  { id: 'governance',      label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general',         label: 'General Eligibility' },
]

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

function AwardCard({ award, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#A8D4EE' : 'var(--border-light)'}`,
        borderTop: `3px solid ${hov ? ACCENT : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.15s ease',
        boxShadow: hov ? '0 8px 28px rgba(0,51,141,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ padding: '24px 26px 0' }}>
        <div style={{ width: 44, height: 44, background: hov ? ACCENT : LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'background 0.15s' }}>
          <Award size={19} color={hov ? '#fff' : ACCENT} strokeWidth={1.6} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: 'var(--kpmg-navy)', lineHeight: 1.35 }}>{award.name}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{award.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 18 }}>
          <Users size={13} />{award.num_nominees} nominees
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px', background: hov ? '#F5FAFF' : '#FAFBFD', borderTop: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>View Nominees</span>
        <ChevronRight size={16} color={ACCENT} />
      </div>
    </div>
  )
}

export default function HJAwards() {
  const [awards, setAwards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/head-jury/awards'); setAwards(data) } catch (e) {}
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/head-jury/awards', form)
      setShowModal(false)
      setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
      fetchAwards()
    } catch (e) {} finally { setLoading(false) }
  }

  const toggleCriteria = (id) => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader
        icon={Award} title="Awards" subtitle="Create and manage award categories" accent={ACCENT}
        action={
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: ACCENT, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Plus size={13} /> New Award
          </button>
        }
      />

      {awards.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Award size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No awards yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Awards created by admin will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {awards.map(award => (
            <AwardCard key={award.id} award={award} onClick={() => { localStorage.setItem('hj_selected_award', award.id); navigate(`/head_jury/nominees?award=${award.id}`) }} />
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, animation: 'fadeIn 0.15s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,20,60,0.2)', animation: 'modalIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `2px solid ${ACCENT}` }}>
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
              <FormField label="Award Name">
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputSt} placeholder="e.g. Business Leader of the Year"
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  required />
              </FormField>

              <FormField label="Description">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputSt, resize: 'vertical' }} rows={3}
                  placeholder="Describe the purpose and significance of this award…"
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  required />
              </FormField>

              <FormField label="Number of Nominees">
                <input type="number" min="1" max="20" value={form.num_nominees}
                  onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                  style={{ ...inputSt, width: 90 }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </FormField>

              <FormField label="Evaluation Criteria">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CRITERIA.map(({ id, label }) => {
                    const checked = form.criteria.includes(id)
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${checked ? '#A8D4EE' : 'var(--border-light)'}`, background: checked ? '#F5FAFF' : '#FAFBFD', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => toggleCriteria(id)}>
                        <div style={{ width: 15, height: 15, border: `1.5px solid ${checked ? ACCENT : 'var(--border)'}`, background: checked ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {checked && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: 'var(--text-primary)' }}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </FormField>

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '10px', background: loading ? '#9BA8B5' : ACCENT, color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'opacity 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}>
                  {loading && <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                  {loading ? 'Creating…' : 'Create Award'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '10px 18px', background: '#fff', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}>
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
  background: '#fff', border: '1px solid var(--border)', borderLeft: '2px solid var(--border)',
  fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
}
