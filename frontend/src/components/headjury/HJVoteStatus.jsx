import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, RefreshCw, Trophy, Building2, ChevronDown, Users } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const MEDALS = ['🥇', '🥈', '🥉']

function RankBadge({ rank }) {
  if (rank <= 3) return <span className="text-lg">{MEDALS[rank - 1]}</span>
  return (
    <span className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-500 text-xs font-black rounded-lg">
      #{rank}
    </span>
  )
}

export default function HJVoteStatus() {
  const [searchParams] = useSearchParams()
  const awardFromUrl = searchParams.get('award')

  const [rankings, setRankings] = useState([])
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [rankRes, awardRes] = await Promise.all([
        api.get('/head-jury/ranking-status'),
        api.get('/jury/awards'),
      ])
      setRankings(rankRes.data)
      setAwards(awardRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Filter by award from URL (or show all)
  const filtered = awardFromUrl
    ? rankings.filter(r => r.award_id === awardFromUrl)
    : rankings

  // Group by jury_id
  const byJury = filtered.reduce((acc, r) => {
    if (!acc[r.jury_id]) acc[r.jury_id] = { jury_id: r.jury_id, awards: {} }
    if (!acc[r.jury_id].awards[r.award_id]) {
      acc[r.jury_id].awards[r.award_id] = { award_name: r.award_name, entries: [] }
    }
    acc[r.jury_id].awards[r.award_id].entries.push(r)
    return acc
  }, {})

  // Sort each jury's entries by rank
  Object.values(byJury).forEach(jury => {
    Object.values(jury.awards).forEach(aw => {
      aw.entries.sort((a, b) => a.rank - b.rank)
    })
  })

  // Aggregate: raw vote tally per nominee (1st-choice / 2nd-choice counts) —
  // no point weighting is computed or shown here, only how many jurors picked
  // each nominee for each slot.
  const nomineeTally = filtered.reduce((acc, r) => {
    const key = r.nominee_id
    if (!acc[key]) acc[key] = { name: r.nominee_name, org: r.nominee_org, first: 0, second: 0 }
    if (r.rank === 1) acc[key].first += 1
    else if (r.rank === 2) acc[key].second += 1
    return acc
  }, {})
  const leaderboard = Object.values(nomineeTally).sort((a, b) => (b.first - a.first) || (b.second - a.second))

  const totalJurors = Object.keys(byJury).length
  const nomineesInContention = Object.keys(nomineeTally).length

  return (
    <div className="p-8">
      <PageHeader
        icon={BarChart3}
        title="Jury Ranking Status"
        subtitle="Live overview of all jury rankings and nominee standings"
        accent="#7F3F98"
        light="#F5EEF8"
        action={
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] text-sm font-medium transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Award pill — shows selected award or "All Awards" */}
      {awardFromUrl && awards.find(a => a.id === awardFromUrl) && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-[#F5EEF8] border border-[#7F3F98]/15 rounded-xl">
          <Trophy className="w-5 h-5 text-[#7F3F98] flex-shrink-0" />
          <div>
            <p className="font-bold text-[#7F3F98] text-sm">{awards.find(a => a.id === awardFromUrl)?.name}</p>
            <p className="text-gray-400 text-xs">Select from Awards to change</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Rankings',       value: filtered.length,        color: '#7F3F98' },
          { label: 'Jury Members Ranked',  value: totalJurors,             color: '#0091DA' },
          { label: 'Nominees in Contention', value: nomineesInContention, color: '#00338D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {rankings.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No jury rankings submitted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Aggregate Leaderboard ── */}
          {leaderboard.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#7F3F98]/5 to-[#0091DA]/5 border-b border-gray-100">
                <Trophy className="w-5 h-5 text-[#7F3F98]" />
                <span className="font-black text-[#1a1a2e] text-sm">Aggregate Leaderboard</span>
                <span className="text-gray-400 text-xs ml-1">· raw vote tally, not weighted scoring</span>
              </div>
              <div className="divide-y divide-gray-50">
                {leaderboard.map((nom, i) => (
                  <div key={nom.name + i} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      <RankBadge rank={i + 1} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1a1a2e] text-sm truncate">{nom.name}</div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Building2 className="w-3 h-3" />{nom.org}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {nom.first > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
                          🥇 ×{nom.first}
                        </span>
                      )}
                      {nom.second > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600">
                          🥈 ×{nom.second}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Per-Jury Breakdown ── */}
          <div className="space-y-4">
            {Object.values(byJury).map(jury => (
              <div key={jury.jury_id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="w-9 h-9 bg-[#7F3F98] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-[#1a1a2e] text-sm">{jury.jury_id}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      · {filtered.filter(r => r.jury_id === jury.jury_id).length} nominees ranked
                    </span>
                  </div>
                </div>

                {Object.values(jury.awards).map(aw => (
                  <div key={aw.award_name}>
                    {Object.keys(jury.awards).length > 1 && (
                      <div className="px-6 py-2 bg-[#F5EEF8]/50 border-b border-gray-50">
                        <span className="text-xs font-bold text-[#7F3F98]">{aw.award_name}</span>
                      </div>
                    )}
                    <div className="divide-y divide-gray-50">
                      {aw.entries.map(entry => (
                        <div key={entry.nominee_id} className="flex items-center gap-3 px-6 py-3">
                          <RankBadge rank={entry.rank} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-700 truncate">{entry.nominee_name}</div>
                            <div className="text-xs text-gray-400 truncate">{entry.nominee_org}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
