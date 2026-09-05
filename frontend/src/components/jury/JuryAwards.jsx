import { useState, useEffect } from 'react'
import { Award, Users, ChevronRight, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageContextBar from '../layout/PageContextBar'

const ACCENT = 'var(--kpmg-blue)'
const LIGHT = '#EEF3FF'

const STATUS_META = {
  voting:      { label: 'Voting Open',       bg: '#F0FDF4', text: '#15803D', dot: '#22c55e' },
  nomination:  { label: 'Nominations Open',  bg: '#EEF3FF', text: 'var(--kpmg-blue)', dot: 'var(--kpmg-blue)' },
}

function AwardCard({ award, status, onClick }) {
  const [hov, setHov] = useState(false)
  const meta = status ? STATUS_META[status] : null

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
        transition: 'all 0.2s ease',
        boxShadow: hov ? '0 10px 28px rgba(0,32,91,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, minHeight: 21 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={17} color={ACCENT} strokeWidth={1.7} />
          </div>
          {meta && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: meta.bg, color: meta.text }}>
              {meta.label}
            </span>
          )}
        </div>

        <h3 style={{ margin: '0 0 7px', fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: 'var(--kpmg-navy)', lineHeight: 1.32, letterSpacing: '-0.005em' }}>
          {award.name}
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {award.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 4, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
          <Users size={12} strokeWidth={1.8} />{award.num_nominees} nominees
          {award.results_published && (
            <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: '#15803D' }}>
              <CheckCircle size={12} /> Results out
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT, letterSpacing: '0.02em', textTransform: 'uppercase' }}>View Nominees</span>
        <ChevronRight size={15} color={ACCENT} />
      </div>
    </div>
  )
}

export default function JuryAwards() {
  const [awards, setAwards] = useState([])
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/jury/awards')
      setAwards(data)
    } catch (err) { console.error(err) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageContextBar
        breadcrumb={['Award Categories']}
        helpText="Select an award category to review its nominees. Awards marked &quot;Voting Open&quot; are ready for your ranking. Awards marked &quot;Nominations Open&quot; are still accepting suggestions."
      />
      <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
          <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
            AIMA · Jury Portal
          </span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
          Award Categories
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Select an award to view nominees and cast your vote
        </p>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

      {awards.length === 0 ? (
        <div style={{ padding: '80px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Award size={36} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 18 }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: 'var(--kpmg-navy)', marginBottom: 8 }}>No awards available yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>The admin will create awards for this cycle.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {awards.map(award => {
            // Only badge an award admin has actually opened a phase for via
            // Vote Control — no badge (not a default "Nominations Open") for
            // an award nobody has touched yet.
            const status = award.voting_open ? 'voting' : award.nomination_enabled ? 'nomination' : null
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
    </div>
  )
}
