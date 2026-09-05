import { useState, useEffect } from 'react'
import { RefreshCw, Star, UserCheck, Trash2, Plus, Flag, Trophy, Medal, ChevronDown, GripVertical, Building2, Briefcase, Clock } from 'lucide-react'
import api from '../../api/axios'
import RankMedal from '../layout/RankMedal'

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

// ── Vote Scores Tab ───────────────────────────────────────────────────────────
function VoteScoresTab({ awards }) {
  const [selectedAward, setSelectedAward] = useState(awards[0]?.id || '')
  const [choicesByJury, setChoicesByJury] = useState([])
  const [loading, setLoading] = useState(false)

  // keep award in sync if awards list arrives after first render
  useEffect(() => {
    if (!selectedAward && awards.length > 0) setSelectedAward(awards[0].id)
  }, [awards])

  useEffect(() => {
    if (selectedAward) fetchChoices(selectedAward)
  }, [selectedAward])

  const fetchChoices = async (awardId) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/rankings/by-jury/${awardId}`)
      setChoicesByJury(data)
    } catch (e) {
      setChoicesByJury([])
    } finally {
      setLoading(false)
    }
  }

  const CHOICE_STYLES = {
    first:  { row: 'bg-amber-50/60',  badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  label: '1st Choice', rank: 1 },
    second: { row: 'bg-gray-50/60',   badge: 'bg-gray-100 text-gray-500 border-gray-200',       dot: 'bg-gray-400',   label: '2nd Choice', rank: 2 },
    third:  { row: 'bg-orange-50/60', badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: '3rd Choice', rank: 3 },
    fourth: { row: 'bg-blue-50/60',   badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   label: '4th Choice', rank: 4 },
    fifth:  { row: 'bg-purple-50/60', badge: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400', label: '5th Choice', rank: 5 },
  }
  const choiceStyle = (choice) => CHOICE_STYLES[choice] || CHOICE_STYLES.second

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
      {!loading && choicesByJury.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold text-sm mb-1">No votes submitted yet</p>
          <p className="text-gray-400 text-xs">Votes will appear here once jury members submit their picks.</p>
        </div>
      )}

      {/* One card per jury member */}
      {!loading && choicesByJury.length > 0 && (
        <div className="space-y-5">
          {choicesByJury.map(member => (
            <div key={member.jury_id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

              {/* Member header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: member.jury_role === 'head_jury' ? '#00338D' : '#00338D' }}
                  >
                    {member.jury_id?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#0A1628] text-sm">{member.jury_id}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded font-semibold mt-0.5 ${
                      member.jury_role === 'head_jury'
                        ? 'bg-[#EEF3FF] text-[#00338D]'
                        : 'bg-[#EEF3FF] text-[#00338D]'
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

              {/* Choices */}
              <div className="divide-y divide-gray-50">
                {member.choices.map((entry) => {
                  const s = choiceStyle(entry.choice)
                  return (
                    <div
                      key={entry.nominee_id}
                      className={`flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-gray-50/50 ${s.row}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <RankMedal rank={s.rank} size={26} />
                      </div>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #00338D, #00338D)' }}>
                        {entry.photo_url && (
                          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
                        )}
                        <span className="text-white text-xs font-black" style={{ display: entry.photo_url ? 'none' : 'inline' }}>{entry.name?.[0]}</span>
                      </div>

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

                      <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black ${s.badge}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer summary */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{member.choices.length} choice{member.choices.length !== 1 ? 's' : ''} submitted</span>
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
  const [maxVotes, setMaxVotes] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data: res } = await api.get(`/admin/rankings/top3/${award.id}`)
        setData(res)
        setMaxVotes(res[0]?.total_votes || 1)
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
        No votes submitted yet for this award.
      </div>
    )
  }

  return (
    <div className="space-y-3 py-2">
      {data.map((entry, i) => {
        const m = MEDAL_COLORS[i]
        const barPct = Math.round((entry.total_votes / maxVotes) * 100)

        return (
          <div key={entry.nominee_id} className={`flex items-center gap-4 p-4 rounded-xl border ${m.bg} ${m.border}`}>
            {/* Rank */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <RankMedal rank={i + 1} size={32} />
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-[#00338D] flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
              {entry.photo_url && (
                <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
              )}
              <span className="text-white text-sm font-black" style={{ display: entry.photo_url ? 'none' : 'inline' }}>{entry.name?.[0]}</span>
            </div>

            {/* Info + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-sm truncate ${m.text}`}>{entry.name}</span>
                <span className={`text-xs font-black flex-shrink-0 ml-2 ${m.text}`}>{entry.total_votes} vote{entry.total_votes === 1 ? '' : 's'}</span>
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

            {/* 1st-choice count */}
            <div className="flex-shrink-0 text-center">
              <div className={`text-lg font-black ${m.text}`}>{entry.first_choice_votes}</div>
              <div className="text-xs text-gray-400">as 1st choice</div>
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
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--gold-bright)', fontWeight: 700 }} className="uppercase">
              AIMA · Administration Console
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--kpmg-navy)' }} className="text-[26px] font-semibold tracking-tight">
            Jury Vote Status
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-[13px] mt-1">
            Track rankings, jury activity, and member participation
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-semibold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)' }} className="mb-6" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
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
                  <p className="text-gray-400 text-xs">Aggregate votes from all jury members</p>
                </div>
              </div>

              <div className="p-6">
                <Top3Podium key={selectedAward} award={{ id: selectedAward }} />
              </div>

              {/* Legend */}
              <div className="px-6 pb-5 pt-0">
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  Each jury member picks a 1st and 2nd choice nominee — both count as one vote. The nominee with the most total votes ranks highest.
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
                  <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${log.user_role === 'head_jury' ? 'bg-[#EEF3FF] text-[#00338D] border-[#00338D]/20' : 'bg-[#EEF3FF] text-[#00338D] border-[#00338D]/20'}`}>
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
                      style={{ backgroundColor: u.role === 'head_jury' ? '#00338D' : '#00338D' }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#0A1628] text-sm">{u.username}</div>
                      <span className={`px-2 py-0.5 text-xs rounded-lg font-medium ${u.role === 'head_jury' ? 'bg-[#EEF3FF] text-[#00338D]' : 'bg-[#EEF3FF] text-[#00338D]'}`}>
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
