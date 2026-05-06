import { useState, useEffect } from 'react'
import { UserPlus, Users, Crown, X, Eye, EyeOff, Mail, Lock, User, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

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
    <div className="p-8">
      <PageHeader icon={UserPlus} title="Manage Users" subtitle="Create and manage jury and head jury accounts" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm">
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users', value: users.length, color: '#00338D', bg: '#EEF2FA', icon: Users },
          { label: 'Jury Members', value: juryUsers.length, color: '#0091DA', bg: '#EAF5FC', icon: Users },
          { label: 'Head Jury', value: headJuryUsers.length, color: '#7F3F98', bg: '#F5EEF8', icon: Crown },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Head Jury section */}
      {headJuryUsers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-[#7F3F98]" />
            <h3 className="font-black text-[#1a1a2e] text-sm uppercase tracking-wider">Head Jury</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {headJuryUsers.map(u => (
              <div key={u.id} className="bg-white border border-[#7F3F98]/15 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#7F3F98] rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-base">{u.username?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1a1a2e] text-sm">{u.username}</div>
                    <div className="text-gray-400 text-xs">{u.email}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="px-2 py-1 bg-[#F5EEF8] text-[#7F3F98] text-xs rounded-lg font-semibold">Head Jury</span>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jury section */}
      {juryUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#0091DA]" />
            <h3 className="font-black text-[#1a1a2e] text-sm uppercase tracking-wider">Jury Members</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {juryUsers.map(u => (
              <div key={u.id} className="bg-white border border-[#0091DA]/15 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#0091DA] rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-base">{u.username?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1a1a2e] text-sm">{u.username}</div>
                    <div className="text-gray-400 text-xs">{u.email}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="px-2 py-1 bg-[#EAF5FC] text-[#0091DA] text-xs rounded-lg font-semibold">Jury Member</span>
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold mb-1">No users created yet</p>
          <p className="text-gray-400 text-sm">Create jury and head jury accounts to get started.</p>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-[#1a1a2e]">Create New User</h2>
                <p className="text-gray-400 text-xs mt-0.5">Only jury and head jury roles can be created</p>
              </div>
              <button onClick={() => { setShowModal(false); setError(''); setSuccess('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['jury', 'Jury Member', '#0091DA', '#EAF5FC'], ['head_jury', 'Head Jury', '#7F3F98', '#F5EEF8']].map(([val, label, color, bg]) => (
                    <button key={val} type="button" onClick={() => setForm({ ...form, role: val })}
                      className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-semibold"
                      style={form.role === val ? { borderColor: color, backgroundColor: bg, color } : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                      {val === 'head_jury' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Username', key: 'username', type: 'text', icon: User, placeholder: 'Enter username' },
                { label: 'Email', key: 'email', type: 'email', icon: Mail, placeholder: 'Enter email' },
              ].map(({ label, key, type, icon: Icon, placeholder }) => (
                <div key={key} className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <Icon className="absolute left-4 bottom-3.5 w-4 h-4 text-gray-400" />
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm"
                    placeholder={placeholder} required />
                </div>
              ))}

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <Lock className="absolute left-4 bottom-3.5 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm"
                  placeholder="Set a password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-3.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              {success && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setError(''); setSuccess('') }} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
