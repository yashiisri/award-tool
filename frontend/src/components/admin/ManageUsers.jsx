import { useState, useEffect } from 'react'
import { UserPlus, Users, Crown, X, Eye, EyeOff, Mail, Lock, User, Trash2 } from 'lucide-react'
import api from '../../api/axios'

const ROLE_META = {
  jury:      { label: 'Jury Member', color: 'var(--kpmg-blue)', bg: '#EEF3FF' },
  head_jury: { label: 'Head Jury',   color: 'var(--kpmg-blue)',     bg: '#EEF3FF' },
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'jury' })

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try { await api.delete(`/admin/users/${userId}`); fetchUsers() }
    catch (err) { console.error(err) }
  }

  const fetchUsers = async () => {
    try { const { data } = await api.get('/admin/users'); setUsers(data) }
    catch (err) { console.error(err) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    try {
      await api.post('/admin/create-user', form)
      setSuccess(`${form.role === 'jury' ? 'Jury' : 'Head Jury'} account created for ${form.username}`)
      setForm({ username: '', email: '', password: '', role: 'jury' })
      fetchUsers()
      setTimeout(() => setShowModal(false), 1500)
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create user') }
    finally { setLoading(false) }
  }

  const juryUsers = users.filter(u => u.role === 'jury')
  const headJuryUsers = users.filter(u => u.role === 'head_jury')

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
            Manage Users
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Create and manage jury and head jury accounts
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, borderRadius: 6,
          padding: '9px 18px', background: 'var(--kpmg-blue)', color: '#fff',
          border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--kpmg-navy)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--kpmg-blue)'}>
          <UserPlus size={13} /> Create User
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

      {/* Stats */}
      {users.length > 0 && (
        <div style={{ display: 'flex', gap: 1, marginBottom: 28, background: '#fff', border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Jury Members', value: juryUsers.length },
            { label: 'Head Jury', value: headJuryUsers.length },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '16px 24px', borderRight: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-blue)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--kpmg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <UserPlus size={20} color="#fff" />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--kpmg-navy)', marginBottom: 6 }}>No users created yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create jury and head jury accounts to get started.</p>
        </div>
      ) : (
        <>
          {[['Head Jury', headJuryUsers, Crown], ['Jury Members', juryUsers, Users]].map(([label, list, Icon]) => list.length > 0 && (
            <div key={label} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={14} color="var(--kpmg-blue)" strokeWidth={1.6} />
                <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{label}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {list.map(u => {
                  const meta = ROLE_META[u.role]
                  return (
                    <div key={u.id} style={{ background: '#fff', border: '1px solid var(--border-light)', borderTop: `3px solid ${meta.color}`, borderRadius: 8, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{u.username?.[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ padding: '3px 8px', background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{meta.label}</span>
                        <button onClick={() => handleDelete(u.id)} style={{ padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border)', transition: 'color 0.15s', display: 'flex' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--border)'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, animation: 'fadeIn 0.15s ease' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setError(''); setSuccess('') } }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,20,60,0.2)', animation: 'modalIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '2px solid var(--kpmg-blue)' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }}>Create New User</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>Only jury and head jury roles can be created</p>
              </div>
              <button onClick={() => { setShowModal(false); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--kpmg-navy)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Role">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['jury', 'Jury Member', Users], ['head_jury', 'Head Jury', Crown]].map(([val, label, Icon]) => {
                    const meta = ROLE_META[val]
                    const active = form.role === val
                    return (
                      <button key={val} type="button" onClick={() => setForm({ ...form, role: val })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                          border: `1px solid ${active ? meta.color : 'var(--border)'}`,
                          background: active ? meta.bg : '#fff', color: active ? meta.color : 'var(--text-secondary)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        <Icon size={14} /> {label}
                      </button>
                    )
                  })}
                </div>
              </FormField>

              <FormField label="Username">
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    style={inputSt} placeholder="Enter username" required
                    onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </FormField>

              <FormField label="Email">
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputSt} placeholder="Enter email" required
                    onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </FormField>

              <FormField label="Password">
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ ...inputSt, paddingRight: 38 }} placeholder="Set a password" required
                    onFocus={e => e.target.style.borderColor = 'var(--kpmg-blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormField>

              {error && <div style={{ padding: '10px 12px', background: '#FEF2F2', borderLeft: '3px solid #DC2626', fontSize: 12, color: '#DC2626' }}>{error}</div>}
              {success && <div style={{ padding: '10px 12px', background: '#F0FDF4', borderLeft: '3px solid #16A34A', fontSize: 12, color: '#16A34A' }}>{success}</div>}

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '10px',
                  background: loading ? '#9BA8B5' : 'var(--kpmg-blue)', color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-navy)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--kpmg-blue)' }}>
                  {loading && <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                  {loading ? 'Creating…' : 'Create Account'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setError(''); setSuccess('') }} style={{
                  padding: '10px 18px', background: '#fff', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
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

const inputSt = {
  width: '100%', padding: '9px 11px 9px 34px',
  background: '#fff',
  border: '1px solid var(--border)',
  borderLeft: '2px solid var(--border)',
  fontSize: 13, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}
