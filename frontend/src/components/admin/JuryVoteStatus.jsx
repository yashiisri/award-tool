import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Star, UserCheck, Trash2, Plus, Flag } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACTION_ICON = {
  vote: <Star className="w-3.5 h-3.5 text-yellow-500" />,
  validate_nominee: <UserCheck className="w-3.5 h-3.5 text-green-600" />,
  add_nominee: <Plus className="w-3.5 h-3.5 text-blue-600" />,
  delete_nominee: <Trash2 className="w-3.5 h-3.5 text-red-500" />,
  red_flag_nominee: <Flag className="w-3.5 h-3.5 text-orange-500" />,
}

const ACTION_STYLE = {
  vote: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  validate_nominee: 'bg-green-50 text-green-700 border-green-200',
  add_nominee: 'bg-blue-50 text-blue-700 border-blue-200',
  delete_nominee: 'bg-red-50 text-red-700 border-red-200',
  red_flag_nominee: 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function JuryVoteStatus() {
  const [votes, setVotes] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('votes')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [votesRes, auditRes, usersRes] = await Promise.all([
        api.get('/admin/jury-vote-status'),
        api.get('/audit/logs'),
        api.get('/admin/users'),
      ])
      setVotes(votesRes.data)
      setAuditLogs(auditRes.data.filter(l => ['jury', 'head_jury'].includes(l.user_role)))
      setUsers(usersRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Group votes by jury member
  const votesByJury = votes.reduce((acc, v) => {
    if (!acc[v.jury_id]) acc[v.jury_id] = []
    acc[v.jury_id].push(v)
    return acc
  }, {})

  return (
    <div className="p-8">
      <PageHeader icon={BarChart3} title="Jury Vote Status" subtitle="Track jury member activity, votes, and actions" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Votes', value: votes.length, color: '#00338D', bg: '#EEF2FA' },
          { label: 'Jury Members', value: users.filter(u => u.role === 'jury').length, color: '#0091DA', bg: '#EAF5FC' },
          { label: 'Head Jury', value: users.filter(u => u.role === 'head_jury').length, color: '#7F3F98', bg: '#F5EEF8' },
          { label: 'Actions Logged', value: auditLogs.length, color: '#059669', bg: '#ECFDF5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[['votes', 'Vote Scores'], ['activity', 'Activity Log'], ['members', 'Jury Members']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Vote Scores Tab */}
      {activeTab === 'votes' && (
        <div>
          {Object.keys(votesByJury).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
              <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-[#00338D]" />
              </div>
              <p className="text-gray-500 font-semibold">No votes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(votesByJury).map(([juryId, juryVotes]) => (
                <div key={juryId} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="w-9 h-9 bg-[#00338D] rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-black">{juryId?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#1a1a2e] text-sm">{juryId}</span>
                      <span className="ml-2 text-gray-400 text-xs">{juryVotes.length} votes</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {juryVotes.map(v => (
                      <div key={v.id} className="flex items-center justify-between px-6 py-3">
                        <span className="text-gray-600 text-sm">Nominee: {v.nominee_id?.slice(-6)}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < v.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                          <span className="text-gray-400 text-xs ml-1">{v.score}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
            {['Member', 'Role', 'Action', 'Time'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          {auditLogs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No activity logged yet.</div>
          ) : (
            auditLogs.slice(0, 50).map((log, i) => (
              <div key={log.id} className={`grid grid-cols-4 px-6 py-3.5 items-center ${i !== auditLogs.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#EEF2FA] rounded-lg flex items-center justify-center">
                    <span className="text-[#00338D] text-xs font-black">{log.user_id?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-[#1a1a2e] text-sm font-medium">{log.user_id}</span>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${log.user_role === 'head_jury' ? 'bg-[#F5EEF8] text-[#7F3F98] border-[#7F3F98]/20' : 'bg-[#EAF5FC] text-[#0091DA] border-[#0091DA]/20'}`}>
                    {log.user_role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {ACTION_ICON[log.action]}
                  <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${ACTION_STYLE[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-gray-400 text-xs">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">No jury members created yet.</p>
            </div>
          ) : (
            users.map(u => {
              const memberVotes = votes.filter(v => v.jury_id === u.username)
              const memberLogs = auditLogs.filter(l => l.user_id === u.username)
              return (
                <div key={u.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: u.role === 'head_jury' ? '#7F3F98' : '#0091DA' }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#1a1a2e] text-sm">{u.username}</div>
                      <span className={`px-2 py-0.5 text-xs rounded-lg font-medium ${u.role === 'head_jury' ? 'bg-[#F5EEF8] text-[#7F3F98]' : 'bg-[#EAF5FC] text-[#0091DA]'}`}>
                        {u.role === 'head_jury' ? 'Head Jury' : 'Jury'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-[#00338D]">{memberVotes.length}</div>
                      <div className="text-xs text-gray-400">Votes Cast</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-[#00338D]">{memberLogs.length}</div>
                      <div className="text-xs text-gray-400">Actions</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
