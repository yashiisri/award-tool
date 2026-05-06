import { useState, useEffect } from 'react'
import { BarChart3, Trophy, Lock, ChevronDown, Medal } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const MEDAL = ['🥇', '🥈', '🥉']

export default function JuryResults() {
  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchResults() }, [selectedAward])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchResults = async () => {
    setError('')
    try {
      const { data } = await api.get(`/jury/results/${selectedAward}`)
      setResults(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Results not available')
      setResults([])
    }
  }

  const maxScore = results[0]?.total_score || 1

  return (
    <div className="p-8">
      <PageHeader icon={BarChart3} title="Results" subtitle="Final rankings once published by the admin" accent="#0091DA" light="#EAF5FC" />

      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
        <div className="relative w-full max-w-sm">
          <select value={selectedAward} onChange={e => setSelectedAward(e.target.value)}
            className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 text-sm shadow-sm pr-10">
            <option value="">Choose an award</option>
            {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-5 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Results not published yet</p>
            <p className="text-amber-600 text-xs mt-0.5">The admin will publish results after voting closes.</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {/* Top 3 podium */}
          {results.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[results[1], results[0], results[2]].map((nom, i) => {
                const positions = [1, 0, 2]
                const pos = positions[i]
                const heights = ['h-28', 'h-36', 'h-24']
                return nom ? (
                  <div key={nom.id} className={`bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-end ${heights[i]} shadow-sm`}>
                    <div className="text-3xl mb-2">{MEDAL[pos]}</div>
                    <div className="font-black text-[#1a1a2e] text-xs text-center">{nom.name}</div>
                    <div className="text-[#0091DA] font-black text-sm mt-1">{nom.total_score} pts</div>
                  </div>
                ) : <div key={i} />
              })}
            </div>
          )}

          {/* Full leaderboard */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-black text-[#1a1a2e] text-sm uppercase tracking-wider">Final Leaderboard</h3>
            </div>
            {results.map((nom, i) => (
              <div key={nom.id} className={`flex items-center gap-4 px-6 py-4 ${i !== results.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
                <div className="w-8 text-center">
                  {i < 3 ? <span className="text-xl">{MEDAL[i]}</span> : <span className="text-gray-400 font-bold text-sm">#{i + 1}</span>}
                </div>
                <div className="w-10 h-10 bg-[#EAF5FC] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0091DA] font-black text-sm">{nom.name?.[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1a1a2e] text-sm">{nom.name}</div>
                  <div className="text-gray-400 text-xs">{nom.organisation}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#0091DA] text-base">{nom.total_score || 0}</div>
                  <div className="text-gray-400 text-xs">points</div>
                </div>
                <div className="w-24">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#0091DA] to-[#00338D] rounded-full transition-all"
                      style={{ width: `${((nom.total_score || 0) / maxScore) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
