import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Star, Trophy } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function HJVoteStatus() {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchVotes() }, [])

  const fetchVotes = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/vote-status'); setVotes(data) }
    catch (e) {} finally { setLoading(false) }
  }

  const byJury = votes.reduce((acc, v) => { if (!acc[v.jury_id]) acc[v.jury_id] = []; acc[v.jury_id].push(v); return acc }, {})

  return (
    <div className="p-8">
      <PageHeader icon={BarChart3} title="Vote Status" subtitle="Live overview of all jury votes and rankings" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={fetchVotes} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Votes', value: votes.length, color: '#7F3F98' },
          { label: 'Jury Members Voted', value: Object.keys(byJury).length, color: '#0091DA' },
          { label: 'Total Points Awarded', value: votes.reduce((s, v) => s + (v.points || 0), 0), color: '#00338D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {Object.keys(byJury).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No votes recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byJury).map(([juryId, juryVotes]) => (
            <div key={juryId} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="w-9 h-9 bg-[#7F3F98] rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-black">{juryId?.[0]?.toUpperCase()}</span>
                </div>
                <span className="font-bold text-[#1a1a2e] text-sm">{juryId}</span>
                <span className="text-gray-400 text-xs ml-1">· {juryVotes.length} votes · {juryVotes.reduce((s, v) => s + (v.points || 0), 0)} pts total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {juryVotes.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-6 py-3">
                    <span className="text-gray-600 text-sm">Nominee: {v.nominee_id?.slice(-8)}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 px-2 py-1 bg-[#F5EEF8] text-[#7F3F98] text-xs rounded-lg font-bold">
                        <Trophy className="w-3 h-3" /> Rank #{v.rank}
                      </span>
                      <span className="font-black text-[#7F3F98] text-sm">{v.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
