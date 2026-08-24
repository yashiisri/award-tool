import { useState, useEffect } from 'react'
import { Settings, Clock, Calendar, Vote, FileEdit } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

function Toggle({ active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      position: 'relative', width: 40, height: 20, flexShrink: 0,
      background: active ? 'var(--kpmg-blue)' : 'var(--border)',
      border: 'none', cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: active ? 22 : 2,
        width: 16, height: 16, background: '#fff',
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

export default function VoteControl() {
  const [awards, setAwards] = useState([])
  const [controls, setControls] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [awardsRes, controlsRes] = await Promise.all([
        api.get('/admin/awards'),
        api.get('/admin/vote-control'),
      ])
      setAwards(awardsRes.data)
      const map = {}
      controlsRes.data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch (err) { console.error(err) }
  }

  const save = async (awardId) => {
    setSaving({ ...saving, [awardId]: true })
    const ctrl = controls[awardId] || {}
    try {
      await api.post('/admin/vote-control', {
        award_id: awardId,
        voting_enabled: ctrl.voting_enabled || false,
        nomination_enabled: ctrl.nomination_enabled || false,
        voting_start: ctrl.voting_start || null,
        voting_end: ctrl.voting_end || null,
      })
    } catch (err) { console.error(err) }
    finally { setSaving({ ...saving, [awardId]: false }) }
  }

  const update = (awardId, field, value) => {
    setControls({ ...controls, [awardId]: { ...(controls[awardId] || {}), [field]: value } })
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageHeader icon={Settings} title="Vote Control" subtitle="Control when jury and head jury can nominate and vote" />

      {awards.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--kpmg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Settings size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No awards to configure</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create awards first to set up vote controls.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {awards.map(award => {
            const ctrl = controls[award.id] || {}
            return (
              <div key={award.id} style={{ background: '#fff', border: '1px solid var(--border-light)', borderTop: '3px solid var(--kpmg-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }}>{award.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{award.description}</p>
                  </div>
                  <button onClick={() => save(award.id)} disabled={saving[award.id]} style={{
                    padding: '8px 18px', background: saving[award.id] ? '#9BA8B5' : 'var(--kpmg-blue)', color: '#fff',
                    border: 'none', fontSize: 11, fontWeight: 700, cursor: saving[award.id] ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'background 0.15s', flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!saving[award.id]) e.currentTarget.style.background = 'var(--kpmg-navy)' }}
                  onMouseLeave={e => { if (!saving[award.id]) e.currentTarget.style.background = 'var(--kpmg-blue)' }}>
                    {saving[award.id] ? 'Saving…' : 'Save'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--border-light)' }}>
                  {/* Voting toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Vote size={15} color="var(--kpmg-blue)" strokeWidth={1.6} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>Voting Enabled</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>Allow jury to cast votes</div>
                      </div>
                    </div>
                    <Toggle active={ctrl.voting_enabled || false} onClick={() => update(award.id, 'voting_enabled', !ctrl.voting_enabled)} />
                  </div>

                  {/* Nomination toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileEdit size={15} color="var(--kpmg-blue)" strokeWidth={1.6} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>Nominations Open</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>Allow adding/editing nominees</div>
                      </div>
                    </div>
                    <Toggle active={ctrl.nomination_enabled || false} onClick={() => update(award.id, 'nomination_enabled', !ctrl.nomination_enabled)} />
                  </div>

                  {/* Voting window */}
                  <div style={{ padding: '16px 22px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Calendar size={13} color="var(--kpmg-blue)" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Voting Start</span>
                    </div>
                    <input type="datetime-local" value={ctrl.voting_start || ''}
                      onChange={e => update(award.id, 'voting_start', e.target.value)}
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>

                  <div style={{ padding: '16px 22px', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Clock size={13} color="var(--kpmg-blue)" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Voting End</span>
                    </div>
                    <input type="datetime-local" value={ctrl.voting_end || ''}
                      onChange={e => update(award.id, 'voting_end', e.target.value)}
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                </div>

                {/* Status indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderTop: '1px solid var(--border-light)', background: '#FAFBFD' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: ctrl.voting_enabled ? '#F0FDF4' : '#F4F5F7', color: ctrl.voting_enabled ? '#15803D' : 'var(--text-muted)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ctrl.voting_enabled ? '#22c55e' : '#9BA8B5' }} />
                    Voting {ctrl.voting_enabled ? 'Open' : 'Closed'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: ctrl.nomination_enabled ? '#EEF3FF' : '#F4F5F7', color: ctrl.nomination_enabled ? 'var(--kpmg-blue)' : 'var(--text-muted)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: ctrl.nomination_enabled ? 'var(--kpmg-blue)' : '#9BA8B5' }} />
                    Nominations {ctrl.nomination_enabled ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputSt = {
  width: '100%', padding: '8px 10px',
  background: '#fff',
  border: '1px solid var(--border)',
  borderLeft: '2px solid var(--border)',
  fontSize: 12, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}
