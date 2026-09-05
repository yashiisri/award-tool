import { useState, useEffect } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import api from '../../api/axios'

const ROLE_STYLES = {
  admin:     { bg: '#EEF3FF', color: 'var(--kpmg-blue)' },
  jury:      { bg: '#EEF3FF', color: 'var(--kpmg-blue)' },
  head_jury: { bg: '#EEF3FF', color: 'var(--kpmg-blue)' },
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try { const { data } = await api.get('/audit/logs'); setLogs(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.user_role === filter)

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
              AIMA · Administration Console
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
            Audit Trail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Complete timestamped log of all platform activity
          </p>
        </div>
        <button onClick={fetchLogs} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 6, background: '#fff', color: 'var(--text-secondary)',
          border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0,
        }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 1, marginBottom: 24, background: '#fff', border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
        {[
          { label: 'Total Events', value: logs.length },
          { label: 'Admin Actions', value: logs.filter(l => l.user_role === 'admin').length },
          { label: 'Jury Actions', value: logs.filter(l => l.user_role === 'jury').length },
          { label: 'Head Jury Actions', value: logs.filter(l => l.user_role === 'head_jury').length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '16px 24px', borderRight: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-blue)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Role filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {[['all', 'All Roles'], ['admin', 'Admin'], ['jury', 'Jury'], ['head_jury', 'Head Jury']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            background: filter === val ? 'var(--kpmg-blue)' : '#fff',
            color: filter === val ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${filter === val ? 'var(--kpmg-blue)' : 'var(--border)'}`,
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.5fr 3.5fr 1.7fr', padding: '12px 20px', borderBottom: '1px solid var(--border-light)', background: '#FAFBFD', gap: 12 }}>
          {['User', 'Role', 'Action', 'Details', 'Timestamp'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No audit logs yet.</div>
        ) : (
          filtered.map((log, i) => {
            const role = ROLE_STYLES[log.user_role] || { bg: '#F4F5F7', color: 'var(--text-secondary)' }
            return (
              <div key={log.id} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.5fr 3.5fr 1.7fr', padding: '14px 20px', gap: 12, alignItems: 'flex-start',
                borderBottom: i !== filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 24, height: 24, background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'var(--kpmg-blue)', fontSize: 10, fontWeight: 700 }}>{log.user_id?.[0]?.toUpperCase()}</span>
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user_id}</span>
                </div>
                <div>
                  <span style={{ padding: '2px 7px', fontSize: 10, fontWeight: 700, background: role.bg, color: role.color, letterSpacing: '0.02em' }}>
                    {log.user_role}
                  </span>
                </div>
                <div>
                  <span style={{ padding: '2px 7px', fontSize: 10, fontWeight: 600, background: '#F4F5F7', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {JSON.stringify(log.details)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                  <Clock size={11} style={{ flexShrink: 0 }} />
                  {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
