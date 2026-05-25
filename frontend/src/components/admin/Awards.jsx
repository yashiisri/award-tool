import { useState, useEffect } from 'react'
import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const CRITERIA = [
  { id: 'governance',       label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance',  label: 'Organisational Performance' },
  { id: 'general',          label: 'General Eligibility' },
]

const CRITERIA_DETAILS = {
  governance:      ['Contribution to society and nation at large', 'Personal values, ethics and corporate integrity', 'Contribution to positive evolution of government policy', 'Contribution towards globalisation of Indian economy'],
  org_performance: ['Display of corporate courage and leadership', 'Contribution towards evolving appropriate management culture', 'Contribution towards development of management profession', 'Vision and support for innovation and new ideas'],
  general:         ['Organisation must be operating in India', 'Business must have contributed substantially to Indian economy', 'Nominations of individuals from their own organisations will be considered'],
}

const btn = {
  primary: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#00338D', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' },
  ghost:   { padding: '9px 16px', background: '#F7F9FC', color: '#6B7A8D', border: '1px solid #E8ECF0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}

export default function Awards() {
  const [awards, setAwards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedCriteria, setExpandedCriteria] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch (e) {}
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/awards', form)
      setShowModal(false)
      setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
      fetchAwards()
    } catch (e) {} finally { setLoading(false) }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this award and all its nominees?')) return
    try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch (e) {}
  }

  const toggleCriteria = (id) => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }

  return (
    <div style={{ padding: '32px 36px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        icon={Award} title="Awards" subtitle="Create and manage award categories"
        action={
          <button style={btn.primary} onClick={() => setShowModal(true)}
            onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
            onMouseLeave={e => e.currentTarget.style.background = '#00338D'}>
            <Plus size={14} /> New Award
          </button>
        }
      />

      {awards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: 'white', borderRadius: 14, border: '1px solid #E8ECF0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Award size={24} color="#00338D" />
          </div>
          <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No awards yet</p>
          <p style={{ color: '#9BA8B5', fontSize: 13, marginBottom: 20 }}>Create your first award to get started.</p>
          <button style={btn.primary} onClick={() => setShowModal(true)}
            onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
            onMouseLeave={e => e.currentTarget.style.background = '#00338D'}>
            <Plus size={14} /> Create Award
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {awards.map(award => (
            <div key={award.id}
              onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
              style={{ background: 'white', border: '1px solid #E8ECF0', borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'all 0.18s ease', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00338D40'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,51,141,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} color="#00338D" />
                </div>
                <button onClick={e => handleDelete(award.id, e)}
                  style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#D0D8E4', borderRadius: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#FEF2F2' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#D0D8E4'; e.currentTarget.style.background = 'none' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: '-0.01em' }}>{award.name}</h3>
              <p style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{award.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12 }}><Users size={12} />{award.num_nominees} nominees</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12 }}><CheckSquare size={12} />{award.criteria?.length || 3} criteria</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #F0F4F8' }}>
                <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600 }}>View Nominees</span>
                <ChevronRight size={15} color="#00338D" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div>
                <h2 style={{ color: '#0A1628', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Create New Award</h2>
                <p style={{ color: '#9BA8B5', fontSize: 13, marginTop: 2 }}>Configure award details and evaluation criteria</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA8B5', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#0A1628'}
                onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Award Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. Business Leader of the Year"
                  onFocus={e => e.target.style.borderColor = '#00338D'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF0'}
                  required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  rows={3} placeholder="Describe the purpose and significance of this award..."
                  onFocus={e => e.target.style.borderColor = '#00338D'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF0'}
                  required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Number of Nominees</label>
                <input type="number" min="1" max="20" value={form.num_nominees} onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                  style={{ width: 100, padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#00338D'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF0'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Evaluation Criteria</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CRITERIA.map(({ id, label }) => (
                    <div key={id} style={{ border: `1px solid ${form.criteria.includes(id) ? '#00338D40' : '#E8ECF0'}`, borderRadius: 10, overflow: 'hidden', background: form.criteria.includes(id) ? '#F5F7FF' : '#F7F9FC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }} onClick={() => toggleCriteria(id)}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.criteria.includes(id) ? '#00338D' : '#D0D8E4'}`, background: form.criteria.includes(id) ? '#00338D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {form.criteria.includes(id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{label}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setExpandedCriteria(expandedCriteria === id ? null : id) }}
                          style={{ fontSize: 11, color: '#0091DA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          {expandedCriteria === id ? 'Hide' : 'Details'}
                        </button>
                      </div>
                      {expandedCriteria === id && (
                        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #F0F4F8' }}>
                          <ul style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {CRITERIA_DETAILS[id].map((point, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#6B7A8D' }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#0091DA', marginTop: 5, flexShrink: 0 }} />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '12px', background: loading ? '#9BA8B5' : '#00338D', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#002a73' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#00338D' }}>
                  {loading ? 'Creating...' : 'Create Award'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={btn.ghost}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
