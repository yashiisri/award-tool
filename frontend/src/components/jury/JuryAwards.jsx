import { useState, useEffect } from 'react'
import { Award, Users, ChevronRight, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACCENT = 'var(--kpmg-blue)'
const LIGHT = '#EEF3FF'

const STATUS_META = {
  voting:      { label: 'Voting Open',       dotted: true,  bg: '#F0FDF4', text: '#15803D', dot: '#22c55e' },
  nomination:  { label: 'Nominations Open',  dotted: true,  bg: '#EEF3FF', text: 'var(--kpmg-blue)', dot: 'var(--kpmg-blue)' },
  closed:      { label: 'Closed',            dotted: false, bg: '#F4F5F7', text: 'var(--text-muted)', dot: null },
}

function AwardCard({ award, status, onClick }) {
  const [hov, setHov] = useState(false)
  const meta = STATUS_META[status]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? '#A8D4EE' : 'var(--border-light)'}`,
        borderTop: `3px solid ${hov ? ACCENT : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: hov ? '0 8px 28px rgba(0,51,141,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ padding: '24px 26px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: hov ? ACCENT : LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
            <Award size={19} color={hov ? '#fff' : ACCENT} strokeWidth={1.6} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: meta.bg, color: meta.text }}>
            {meta.dot && <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.dot }} />}
            {meta.label}
          </span>
        </div>

        <h3 style={{ margin: '0 0 8px', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: 'var(--kpmg-navy)', lineHeight: 1.35 }}>
          {award.name}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {award.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12.5, marginBottom: 18 }}>
          <Users size={13} />{award.num_nominees} nominees
          {award.results_published && (
            <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#15803D' }}>
              <CheckCircle size={13} /> Results out
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px', background: hov ? '#F5FAFF' : '#FAFBFD', borderTop: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>View Nominees</span>
        <ChevronRight size={16} color={ACCENT} />
      </div>
    </div>
  )
}

export default function JuryAwards() {
  const [awards, setAwards] = useState([])
  const [controls, setControls] = useState({})
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/jury/awards')
      setAwards(data)
      const ctrlRes = await api.get('/admin/vote-control')
      const map = {}
      ctrlRes.data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch (err) { console.error(err) }
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader icon={Award} title="Award Categories" subtitle="Select an award to view nominees and cast your vote" accent={ACCENT} />

      {awards.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Award size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No awards available yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>The admin will create awards for this cycle.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {awards.map(award => {
            const ctrl = controls[award.id]
            const status = ctrl?.voting_enabled ? 'voting' : ctrl?.nomination_enabled ? 'nomination' : 'closed'
            return (
              <AwardCard
                key={award.id}
                award={award}
                status={status}
                onClick={() => { localStorage.setItem('jury_selected_award', award.id); navigate(`/jury/nominees?award=${award.id}`) }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
