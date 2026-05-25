import { useState, useEffect } from 'react'
import { Award, Users, ChevronRight, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function JuryAwards() {
  const [awards, setAwards] = useState([])
  const [controls, setControls] = useState({})
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/jury/awards')
      setAwards(data)
      // fetch vote controls for each
      const ctrlRes = await api.get('/admin/vote-control')
      const map = {}
      ctrlRes.data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch (err) { console.error(err) }
  }

  return (
    <div style={{ padding: '32px 36px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader icon={Award} title="Award Categories" subtitle="Select an award to view nominees and cast your vote" />

      {awards.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: 'white', borderRadius: 14, border: '1px solid #E8ECF0', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#EEF2FF', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Award size={24} color="#00338D" />
          </div>
          <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No awards available yet</p>
          <p style={{ color: '#9BA8B5', fontSize: 13 }}>The admin will create awards for this cycle.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {awards.map(award => {
            const ctrl = controls[award.id] || {}
            const votingOpen = ctrl.voting_enabled
            return (
              <div key={award.id}
                onClick={() => { localStorage.setItem('jury_selected_award', award.id); navigate(`/jury/nominees?award=${award.id}`) }}
                style={{ background: 'white', border: '1px solid #E8ECF0', borderRadius: 14, padding: '24px', cursor: 'pointer', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00338D40'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,51,141,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} color="#00338D" />
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: votingOpen ? '#ECFDF5' : '#F7F9FC', color: votingOpen ? '#059669' : '#9BA8B5', border: `1px solid ${votingOpen ? '#A7F3D0' : '#E8ECF0'}` }}>
                    {votingOpen ? <><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />Voting Open</> : <>Closed</>}
                  </span>
                </div>
                <h3 style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: '-0.01em' }}>{award.name}</h3>
                <p style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{award.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9BA8B5', fontSize: 12, marginBottom: 16 }}>
                  <Users size={12} />{award.num_nominees} nominees
                  {award.results_published && <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}><CheckCircle size={12} />Results out</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #F0F4F8' }}>
                  <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600 }}>View Nominees</span>
                  <ChevronRight size={15} color="#00338D" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
