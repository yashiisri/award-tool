import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function JuryComments() {
  const [comments, setComments] = useState([])
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [commentsRes, awardsRes] = await Promise.all([
        api.get('/admin/jury-comments'),
        api.get('/admin/awards'),
      ])
      setComments(commentsRes.data)
      setAwards(awardsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.jury_id === filter)
  const juryMembers = [...new Set(comments.map(c => c.jury_id))]

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader
        icon={MessageSquare}
        title="Jury Comments"
        subtitle="All feedback and suggestions submitted by jury members"
        action={
          <button onClick={fetchAll} style={refreshBtn}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 24, background: '#fff', border: '1px solid var(--border-light)' }}>
        {[
          { label: 'Total Comments', value: comments.length },
          { label: 'Jury Members', value: juryMembers.length },
          { label: 'Awards Covered', value: [...new Set(comments.map(c => c.award_id))].length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 24px', borderRight: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-blue)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter by jury member */}
      {juryMembers.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All Members</FilterPill>
          {juryMembers.map(j => (
            <FilterPill key={j} active={filter === j} onClick={() => setFilter(j)}>{j}</FilterPill>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--kpmg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No comments yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Jury members haven't submitted any feedback.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-light)', border: '1px solid var(--border-light)' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, background: 'var(--kpmg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{c.jury_id?.[0]?.toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.jury_id}</span>
                    <span style={{ padding: '2px 7px', background: '#EEF3FF', color: 'var(--kpmg-blue)', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Jury</span>
                  </div>
                  {c.nominee_id && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Re: Nominee {c.nominee_id}</p>}
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>{c.comment}</p>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
      background: active ? 'var(--kpmg-blue)' : '#fff',
      color: active ? '#fff' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--kpmg-blue)' : 'var(--border)'}`,
      letterSpacing: '0.02em',
    }}>
      {children}
    </button>
  )
}

const refreshBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', background: '#fff', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  transition: 'all 0.15s',
}
