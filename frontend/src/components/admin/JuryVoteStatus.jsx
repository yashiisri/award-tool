import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Star, UserCheck, Trash2, Plus, Flag, Trophy, Medal, ChevronDown, GripVertical, Building2, Briefcase, Clock } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACTION_ICON = {
  vote: <Star className="w-3.5 h-3.5 text-yellow-500" />,
  validate_nominee: <UserCheck className="w-3.5 h-3.5 text-green-600" />,
  add_nominee: <Plus className="w-3.5 h-3.5 text-blue-600" />,
  delete_nominee: <Trash2 className="w-3.5 h-3.5 text-red-500" />,
  red_flag_nominee: <Flag className="w-3.5 h-3.5 text-orange-500" />,
  submit_ranking: <Trophy className="w-3.5 h-3.5 text-[#00338D]" />,
}
const ACTION_STYLE = {
  vote: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  validate_nominee: 'bg-green-50 text-green-700 border-green-200',
  add_nominee: 'bg-blue-50 text-blue-700 border-blue-200',
  delete_nominee: 'bg-red-50 text-red-700 border-red-200',
  red_flag_nominee: 'bg-orange-50 text-orange-700 border-orange-200',
  submit_ranking: 'bg-[#EEF2FA] text-[#00338D] border-[#00338D]/20',
}

const POSITION_POINTS = [10, 8, 6, 5, 4, 3, 2, 1]

// ── Vote Scores Tab ───────────────────────────────────────────────────────────
function VoteScoresTab({ awards }) {
  const [selectedAward, setSelectedAward] = useState(awards[0]?.id || '')
  const [rankingsByJury, setRankingsByJury] = useState([])
  const [loading, setLoading] = useState(false)

  // keep award in sync if awards list arrives after first render
  useEffect(() => {
    if (!selectedAward && awards.length > 0) setSelectedAward(awards[0].id)
  }, [awards])

  useEffect(() => {
    if (selectedAward) fetchRankings(selectedAward)
  }, [selectedAward])

  const fetchRankings = async (awardId) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/rankings/by-jury/${awardId}`)
      setRankingsByJury(data)
    } catch (e) {
      setRankingsByJury([])
    } finally {
      setLoading(false)
    }
  }

  const rankBg = (rank) => {
    if (rank === 1) return { row: 'bg-amber-50/60', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' }
    if (rank === 2) return { row: 'bg-gray-50/60',  badge: 'bg-gray-100 text-gray-500 border-gray-200',   dot: 'bg-gray-400'  }
    if (rank === 3) return { row: 'bg-orange-50/40', badge: 'bg-orange-50 text-orange-500 border-orange-200', dot: 'bg-orange-400' }
    return { row: '', badge: 'bg-[#EEF2FA] text-[#00338D] border-[#00338D]/20', dot: 'bg-[#0091DA]' }
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      {/* Award selector */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
        <div className="relative w-full max-w-xs">
          <select
            value={selectedAward}
            onChange={e => setSelectedAward(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm pr-10"
          >
            {awards.length === 0 && <option value="">No awards found</option>}
            {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && rankingsByJury.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold text-sm mb-1">No rankings submitted yet</p>
          <p className="text-gray-400 text-xs">Rankings will appear here once jury members submit their votes.</p>
        </div>
      )}

      {/* One card per jury member */}
      {!loading && rankingsByJury.length > 0 && (
        <div className="space-y-5">
          {rankingsByJury.map(member => (
            <div key={member.jury_id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

              {/* Member header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: member.jury_role === 'head_jury' ? '#7F3F98' : '#00338D' }}
                  >
                    {member.jury_id?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#0A1628] text-sm">{member.jury_id}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded font-semibold mt-0.5 ${
                      member.jury_role === 'head_jury'
                        ? 'bg-[#F5EEF8] text-[#7F3F98]'
                        : 'bg-[#EAF5FC] text-[#0091DA]'
                    }`}>
                      {member.jury_role === 'head_jury' ? 'Head Jury' : 'Jury Member'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {member.submitted_at
                    ? new Date(member.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>
              </div>

              {/* Ranked list */}
              <div className="divide-y divide-gray-50">
                {member.rankings.map((entry) => {
                  const s = rankBg(entry.rank)
                  return (
                    <div
                      key={entry.nominee_id}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50/50 ${s.row}`}
                    >
                      {/* Rank badge */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm
                        ${entry.rank <= 3 ? 'text-lg' : 'font-black text-xs text-gray-400 bg-gray-50 border-gray-200'}
                      `}>
                        {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #00338D, #0091DA)' }}>
                        {entry.photo_url ? (
                          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover"
                            onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <span className="text-white text-xs font-black">{entry.name?.[0]}</span>
                        )}
                      </div>

                      {/* Name + role */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0A1628] text-sm truncate">{entry.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-gray-400 text-xs truncate">
                            <Briefcase className="w-3 h-3 flex-shrink-0" />{entry.designation}
                          </span>
                          {entry.organisation && (
                            <>
                              <span className="text-gray-300 text-xs">·</span>
                              <span className="flex items-center gap-1 text-gray-400 text-xs truncate">
                                <Building2 className="w-3 h-3 flex-shrink-0" />{entry.organisation}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black ${s.badge}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {entry.points} pts
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer summary */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{member.rankings.length} nominees ranked</span>
                <span className="text-xs text-gray-400 font-medium">
                  Total points awarded: <span className="text-[#00338D] font-bold">{member.rankings.reduce((s, r) => s + r.points, 0)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Top-3 Podium ──────────────────────────────────────────────────────────────
const MEDAL_COLORS = [
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', bar: '#F59E0B', label: '1st Place' },
  { bg: 'bg-gray-50',  border: 'border-gray-200',  text: 'text-gray-500',  bar: '#9BA8B5', label: '2nd Place' },
  { bg: 'bg-orange-50',border: 'border-orange-200',text: 'text-orange-500',bar: '#F97316', label: '3rd Place' },
]

// ── Top-3 Podium ──────────────────────────────────────────────────────────────
function Top3Podium({ award, onLoad }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maxPts, setMaxPts] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data: res } = await api.get(`/admin/rankings/top3/${award.id}`)
        setData(res)
        setMaxPts(res[0]?.total_points || 1)
        if (onLoad) onLoad(res.length)
      } catch (e) { setData([]) }
      finally { setLoading(false) }
    }
    fetch()
  }, [award.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-xs">
        No rankings submitted yet for this award.
      </div>
    )
  }

  return (
    <div className="space-y-3 py-2">
      {data.map((entry, i) => {
        const m = MEDAL_COLORS[i]
        const barPct = Math.round((entry.total_points / maxPts) * 100)
        const medals = ['🥇', '🥈', '🥉']

        return (
          <div key={entry.nominee_id} className={`flex items-center gap-4 p-4 rounded-xl border ${m.bg} ${m.border}`}>
            {/* Medal */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl">
              {medals[i]}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-[#00338D] flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {entry.photo_url ? (
                <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
              ) : (
                <span className="text-white text-sm font-black">{entry.name?.[0]}</span>
              )}
            </div>

            {/* Info + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-sm truncate ${m.text}`}>{entry.name}</span>
                <span className={`text-xs font-black flex-shrink-0 ml-2 ${m.text}`}>{entry.total_points} pts</span>
              </div>
              <p className="text-gray-400 text-xs truncate mb-1.5">{entry.designation} · {entry.organisation}</p>
              {/* Score bar */}
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, backgroundColor: m.bar }}
                />
              </div>
            </div>

            {/* Jury count */}
            <div className="flex-shrink-0 text-center">
              <div className={`text-lg font-black ${m.text}`}>{entry.jury_count}</div>
              <div className="text-xs text-gray-400">voters</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JuryVoteStatus() {
  const [votes, setVotes] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [users, setUsers] = useState([])
  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('top3')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [auditRes, usersRes, awardsRes] = await Promise.all([
        api.get('/audit/logs'),
        api.get('/admin/users'),
        api.get('/admin/awards'),
      ])
      setAuditLogs(auditRes.data.filter(l => ['jury', 'head_jury'].includes(l.user_role)))
      setUsers(usersRes.data)
      setAwards(awardsRes.data)
      if (!selectedAward && awardsRes.data.length > 0) setSelectedAward(awardsRes.data[0].id)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const votesByJury = votes.reduce((acc, v) => {
    if (!acc[v.jury_id]) acc[v.jury_id] = []
    acc[v.jury_id].push(v)
    return acc
  }, {})

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader
        icon={BarChart3}
        title="Jury Vote Status"
        subtitle="Track rankings, jury activity, and member participation"
        accent="#00338D"
        light="#EEF2FA"
        action={
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Jury Members', value: users.filter(u => u.role === 'jury').length,      color: '#0091DA', bg: '#EAF5FC' },
          { label: 'Head Jury',    value: users.filter(u => u.role === 'head_jury').length,  color: '#7F3F98', bg: '#F5EEF8' },
          { label: 'Actions Logged', value: auditLogs.length,                                color: '#059669', bg: '#ECFDF5' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          ['top3', 'Top 3 Rankings'],
          ['votes', 'Vote Scores'],
          ['activity', 'Activity Log'],
          ['members', 'Jury Members'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Top 3 Rankings Tab ── */}
      {activeTab === 'top3' && (
        <div>
          {/* Award selector */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
            <div className="relative w-full max-w-xs">
              <select
                value={selectedAward}
                onChange={e => setSelectedAward(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm pr-10"
              >
                {awards.length === 0 && <option value="">No awards found</option>}
                {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {selectedAward && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-[#EEF2FA] to-white border-b border-gray-100">
                <div className="w-10 h-10 bg-[#00338D] rounded-xl flex items-center justify-center">
                  <Medal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#0A1628] text-sm">{currentAward?.name}</p>
                  <p className="text-gray-400 text-xs">Aggregate rankings from all jury members</p>
                </div>
              </div>

              <div className="p-6">
                <Top3Podium key={selectedAward} award={{ id: selectedAward }} />
              </div>

              {/* Legend */}
              <div className="px-6 pb-5 pt-0">
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  Points are aggregated from all jury members' submitted rankings. Position 1 = 10 pts, Position 2 = 8 pts, Position 3 = 6 pts, and so on.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Vote Scores Tab ── */}
      {activeTab === 'votes' && (
        <VoteScoresTab awards={awards} />
      )}

      {/* ── Activity Log Tab ── */}
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
                  <span className="text-[#0A1628] text-sm font-medium">{log.user_id}</span>
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

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">No jury members created yet.</p>
            </div>
          ) : (
            users.map(u => {
              const memberLogs = auditLogs.filter(l => l.user_id === u.username)
              return (
                <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: u.role === 'head_jury' ? '#7F3F98' : '#0091DA' }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#0A1628] text-sm">{u.username}</div>
                      <span className={`px-2 py-0.5 text-xs rounded-lg font-medium ${u.role === 'head_jury' ? 'bg-[#F5EEF8] text-[#7F3F98]' : 'bg-[#EAF5FC] text-[#0091DA]'}`}>
                        {u.role === 'head_jury' ? 'Head Jury' : 'Jury Member'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-[#00338D]">{memberLogs.length}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Actions Logged</div>
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
