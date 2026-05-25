import { useState, useEffect } from 'react'
import { Award, Plus, X, Users, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const CRITERIA = [
  { id: 'governance',      label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general',         label: 'General Eligibility' },
]

export default function HJAwards() {
  const [awards, setAwards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
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
    <div style={{ padding: '32px 36px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        icon={Award} title="Awards" subtitle="Create and manage award categories"
        action={
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#00338D', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
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
          <p style={{ color: '#9BA8B5', fontSize: 13 }}>Awards created by admin will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {awards.map(award => (
            <div key={award.id}
              onClick={() => { localStorage.setItem('hj_selected_award', award.id); navigate(`/head_jury/nominees?award=${award.id}`) }}
              style={{ background: 'white', border: '1px solid #E8ECF0', borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00338D40'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,51,141,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 42, height: 42, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Award size={18} color="#00338D" />
              </div>
              <h3 style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: '-0.01em' }}>{award.name}</h3>
              <p style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{award.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12, marginBottom: 16 }}>
                <Users size={12} />{award.num_nominees} nominees
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
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div>
                <h2 style={{ color: '#0A1628', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Create New Award</h2>
                <p style={{ color: '#9BA8B5', fontSize: 13, marginTop: 2 }}>Configure award details and criteria</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA8B5', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#0A1628'}
                onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[['Award Name *', 'name', 'text', 'e.g. Business Leader of the Year'], ['Description *', 'description', 'textarea', 'Describe the purpose of this award...']].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
                  {type === 'textarea'
                    ? <textarea value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        rows={3} placeholder={ph} required
                        onFocus={e => e.target.style.borderColor = '#00338D'}
                        onBlur={e => e.target.style.borderColor = '#E8ECF0'} />
                    : <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', boxSizing: 'border-box' }}
                        placeholder={ph} required
                        onFocus={e => e.target.style.borderColor = '#00338D'}
                        onBlur={e => e.target.style.borderColor = '#E8ECF0'} />
                  }
                </div>
              ))}
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
                    <div key={id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${form.criteria.includes(id) ? '#00338D40' : '#E8ECF0'}`, borderRadius: 9, background: form.criteria.includes(id) ? '#F5F7FF' : '#F7F9FC', cursor: 'pointer' }}
                      onClick={() => toggleCriteria(id)}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${form.criteria.includes(id) ? '#00338D' : '#D0D8E4'}`, background: form.criteria.includes(id) ? '#00338D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {form.criteria.includes(id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{label}</span>
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
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '12px 18px', background: '#F7F9FC', color: '#6B7A8D', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
