import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACCENT = 'var(--kpmg-blue)'

export default function HJJuryComments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchComments() }, [])

  const fetchComments = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/jury-comments'); setComments(data) }
    catch (e) {} finally { setLoading(false) }
  }

  const members = [...new Set(comments.map(c => c.jury_id))]
  const filtered = filter === 'all' ? comments : comments.filter(c => c.jury_id === filter)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader
        icon={MessageSquare} title="Jury Comments" subtitle="All feedback submitted by jury members" accent={ACCENT}
        action={
          <button onClick={fetchComments} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 1, marginBottom: 24, background: '#fff', border: '1px solid var(--border-light)' }}>
        {[
          { label: 'Total Comments', value: comments.length },
          { label: 'Jury Members', value: members.length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 24px', borderRight: i < 1 ? '1px solid var(--border-light)' : 'none' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: ACCENT, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['all', 'All'], ...members.map(m => [m, m])].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filter === val ? ACCENT : '#fff', color: filter === val ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filter === val ? ACCENT : 'var(--border)'}`,
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MessageSquare size={36} color="var(--border)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No comments yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-light)', border: '1px solid var(--border-light)' }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{c.jury_id?.[0]?.toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.jury_id}</span>
                    <span style={{
                      padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                      background: c.jury_role === 'head_jury' ? '#EEF3FF' : '#EEF3FF',
                      color: c.jury_role === 'head_jury' ? 'var(--kpmg-blue)' : 'var(--kpmg-blue)',
                    }}>{c.jury_role || 'jury'}</span>
                  </div>
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
