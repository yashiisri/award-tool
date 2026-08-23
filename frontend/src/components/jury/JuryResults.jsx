import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Lock, Trophy } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const MEDAL = ['🥇', '🥈', '🥉']

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
        accent="#0091DA"
        light="#EAF5FC"
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#0091DA] border-t-transparent rounded-full animate-spin" />
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
              return (
                <div key={award.id}>
                  {/* Award title */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-[#EAF5FC] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-[#0091DA]" />
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
                              <div className="text-3xl mb-1">{MEDAL[pos]}</div>
                              <div className="font-black text-[#1a1a2e] text-xs text-center leading-tight">{nom.name}</div>
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
                          <div className="w-8 text-center flex-shrink-0">
                            {i < 3
                              ? <span className="text-xl">{MEDAL[i]}</span>
                              : <span className="text-gray-400 font-bold text-sm">#{i + 1}</span>}
                          </div>
                          <div className="w-10 h-10 bg-[#EAF5FC] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {nom.photo_url
                              ? <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                              : <span className="text-[#0091DA] font-black text-sm">{nom.name?.[0]}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#1a1a2e] text-sm truncate">{nom.name}</div>
                            <div className="text-gray-400 text-xs truncate">{nom.organisation}</div>
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
