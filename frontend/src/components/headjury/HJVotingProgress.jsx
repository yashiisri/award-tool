import { useState, useEffect } from 'react'
import { RefreshCw, Award, ChevronDown, UserCheck, Clock } from 'lucide-react'
import api from '../../api/axios'
import PageContextBar from '../layout/PageContextBar'

const ACCENT = 'var(--kpmg-blue)'
const COMPLETE = '#1D7A4C'

function AwardCard({ award, expanded, onToggle }) {
  const [hov, setHov] = useState(false)
  const { award_name, voted_count, total_voters, percentage, voters, remaining } = award
  const complete = total_voters > 0 && voted_count === total_voters

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hov ? 'var(--kpmg-mid-blue)' : 'var(--border-light)'}`,
        borderTop: `3px solid ${complete ? COMPLETE : (hov ? 'var(--gold)' : 'var(--border-light)')}`,
        borderRadius: 10,
        transition: 'all 0.18s ease',
        boxShadow: hov ? '0 10px 28px rgba(0,32,91,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <button onClick={onToggle} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={16} color={ACCENT} strokeWidth={1.7} />
              </div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{award_name}</p>
            </div>
            <ChevronDown size={15} color="var(--text-muted)" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: complete ? COMPLETE : 'var(--kpmg-navy)', letterSpacing: '-0.01em' }}>{percentage}%</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 3 }}>{voted_count} of {total_voters} voted</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#EEF1F6', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${percentage}%`, background: complete ? COMPLETE : ACCENT, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: COMPLETE, margin: '0 0 10px' }}>
              <UserCheck size={12} /> Voted ({voters.length})
            </p>
            {voters.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No one yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {voters.map(name => (
                  <span key={name} style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>{name}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
              <Clock size={12} /> Remaining ({remaining.length})
            </p>
            {remaining.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Everyone has voted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {remaining.map(name => (
                  <span key={name} style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HJVotingProgress() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchProgress() }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/head-jury/voting-progress')
      setAwards(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <>
      <PageContextBar
        breadcrumb={['Voting Progress']}
        helpText="Track which jury members have voted for each award. Voting must be complete before results can be published."
      />
      <div style={{ padding: '32px 36px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
                AIMA · Head Jury Portal
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
              Voting Progress
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Tap an award to see who's voted and who's still pending
            </p>
          </div>
          <button onClick={fetchProgress} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 6,
            background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
        <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 0' }}>
            <div style={{ width: 30, height: 30, border: `2px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && awards.length === 0 && (
          <div style={{ padding: '80px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Award size={36} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 18 }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>No award categories yet</p>
          </div>
        )}

        {!loading && awards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {awards.map(a => (
              <AwardCard
                key={a.award_id}
                award={a}
                expanded={expandedId === a.award_id}
                onToggle={() => setExpandedId(prev => prev === a.award_id ? null : a.award_id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
