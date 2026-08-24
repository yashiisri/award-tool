import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Lock, Trophy } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import RankMedal from '../layout/RankMedal'

export default function JuryResults() {
  const [searchParams] = useSearchParams()
  const awardFromUrl = searchParams.get('award')

  const [awardResults, setAwardResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: awards } = await api.get('/jury/awards')
      const targets = awardFromUrl
        ? awards.filter(a => a.id === awardFromUrl)
        : awards

      const settled = await Promise.all(
        targets.map(async award => {
          try {
            const { data } = await api.get(`/jury/results/${award.id}`)
            return { award, results: data, published: true }
          } catch {
            return { award, results: [], published: false }
          }
        })
      )
      setAwardResults(settled)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const anyPublished = awardResults.some(r => r.published)

  return (
    <div className="p-8">
      <PageHeader
        icon={BarChart3}
        title="Results"
        subtitle="Final rankings published by the admin"
        accent="#00338D"
        light="#EEF3FF"
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Nothing published */}
      {!loading && !anyPublished && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-amber-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <p className="font-black text-[#1a1a2e] text-lg mb-2">Results Not Published Yet</p>
          <p className="text-gray-400 text-sm text-center max-w-xs">
            The admin will publish the final results after voting closes. Check back soon.
          </p>
        </div>
      )}

      {/* Published results only */}
      {!loading && anyPublished && (
        <div className="space-y-10">
          {awardResults
            .filter(r => r.published)
            .map(({ award, results }) => {
              const maxScore = results[0]?.total_score || 1
              return (
                <div key={award.id}>
                  {/* Award title */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-[#EEF3FF] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-[#00338D]" />
                    </div>
                    <h2 className="font-black text-[#1a1a2e] text-base">{award.name}</h2>
                  </div>

                  <div className="space-y-5">
                    {/* Podium — top 3 */}
                    {results.length >= 3 && (
                      <div className="grid grid-cols-3 gap-3">
                        {[results[1], results[0], results[2]].map((nom, i) => {
                          const pos = [1, 0, 2][i]
                          const heights = ['h-28', 'h-36', 'h-24']
                          const glow = i === 1 ? 'ring-2 ring-amber-300 shadow-amber-100 shadow-lg' : ''
                          return nom ? (
                            <div key={nom.id}
                              className={`bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-end ${heights[i]} ${glow}`}>
                              {pos === 0 && (
                                <span className="mb-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white" style={{ background: 'linear-gradient(90deg,#D4A017,#C9A84C)' }}>
                                  Winner
                                </span>
                              )}
                              <div className="mb-1 flex justify-center"><RankMedal rank={pos + 1} size={36} /></div>
                              <div className="font-black text-[#1a1a2e] text-xs text-center leading-tight">{nom.name}</div>
                              <div className="text-[#00338D] font-black text-sm mt-1">{nom.total_score} vote{nom.total_score === 1 ? '' : 's'}</div>
                            </div>
                          ) : <div key={i} />
                        })}
                      </div>
                    )}

                    {/* Full leaderboard */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-black text-[#1a1a2e] text-xs uppercase tracking-wider">Final Leaderboard</h3>
                      </div>
                      {results.map((nom, i) => (
                        <div key={nom.id}
                          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors ${i !== results.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <div className="w-8 flex items-center justify-center flex-shrink-0">
                            <RankMedal rank={i + 1} size={24} />
                          </div>
                          <div className="w-10 h-10 bg-[#EEF3FF] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {nom.photo_url && (
                              <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                            )}
                            <span className="text-[#00338D] font-black text-sm" style={{ display: nom.photo_url ? 'none' : 'flex' }}>{nom.name?.[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#1a1a2e] text-sm truncate">{nom.name}</div>
                            <div className="text-gray-400 text-xs truncate">{nom.organisation}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-[#00338D] text-base">{nom.total_score || 0}</div>
                            <div className="text-gray-400 text-xs">votes</div>
                          </div>
                          <div className="w-20 flex-shrink-0">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#00338D] to-[#00338D] rounded-full"
                                style={{ width: `${((nom.total_score || 0) / maxScore) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
