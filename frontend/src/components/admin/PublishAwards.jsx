import { useState, useEffect } from 'react'
import { Trophy, CheckCircle2, Briefcase, Building2, Loader2, Send, Award } from 'lucide-react'
import api from '../../api/axios'
import RankMedal from '../layout/RankMedal'

function StandingsRow({ entry, i }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
        <RankMedal rank={i + 1} size={24} />
      </div>
      <div className="w-9 h-9 rounded-lg bg-[#EEF2FA] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {entry.photo_url && (
          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
        )}
        <span className="text-[#00338D] text-xs font-black" style={{ display: entry.photo_url ? 'none' : 'inline' }}>{entry.name?.[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0A1628] text-sm truncate">{entry.name}</p>
        <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
          <span className="flex items-center gap-1 truncate"><Briefcase className="w-3 h-3 flex-shrink-0" />{entry.designation}</span>
          {entry.organisation && <span className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3 flex-shrink-0" />{entry.organisation}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-black text-[#00338D] text-sm">{entry.total_votes}</div>
        <div className="text-gray-400 text-[10px]">vote{entry.total_votes === 1 ? '' : 's'}</div>
      </div>
    </div>
  )
}

function PublishableAwardCard({ award, onPublished }) {
  const [standings, setStandings] = useState(null)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    api.get(`/admin/rankings/top3/${award.id}`).then(({ data }) => setStandings(data)).catch(() => setStandings([]))
  }, [award.id])

  const handlePublish = async () => {
    if (!confirm(`Publish final results for "${award.name}"? Jury and Head Jury will be able to see the ranking immediately.`)) return
    setPublishing(true)
    try {
      await api.post(`/admin/awards/${award.id}/publish-results`)
      onPublished(award.id)
    } catch (e) { console.error(e) }
    finally { setPublishing(false) }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-[#EEF2FA] to-white border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#00338D] rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-[#0A1628] text-sm truncate">{award.name}</p>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-2 px-4 py-2.5 text-[#0A1628] rounded-lg font-semibold text-sm disabled:opacity-60 transition-colors flex-shrink-0"
          style={{ background: 'var(--gold)' }}
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {publishing ? 'Publishing…' : 'Publish Results'}
        </button>
      </div>

      <div>
        {standings === null && (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {standings && standings.length === 0 && (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">No votes recorded yet for this award.</p>
        )}
        {standings && standings.length > 0 && standings.map((entry, i) => (
          <StandingsRow key={entry.nominee_id} entry={entry} i={i} />
        ))}
      </div>
    </div>
  )
}

export default function PublishAwards() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/awards')
      setAwards(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const pendingPublish = awards.filter(a => !a.results_published)
  const published      = awards.filter(a => a.results_published)

  const handlePublished = (awardId) => {
    setAwards(prev => prev.map(a => a.id === awardId ? { ...a, results_published: true } : a))
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--gold-bright)', fontWeight: 700 }} className="uppercase">
            AIMA · Administration Console
          </span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--kpmg-navy)' }} className="text-[26px] font-semibold tracking-tight">
          Publish Awards
        </h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-[13px] mt-1">
          Publish final rankings based on the current vote calculation
        </p>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)' }} className="mb-6" />

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="space-y-10">

          {/* Ready to publish */}
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <Trophy className="w-3.5 h-3.5 text-[#00338D]" /> Ready to Publish · {pendingPublish.length}
            </h2>
            {pendingPublish.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 text-center">
                <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
                  <Trophy className="w-7 h-7 text-[#00338D]" />
                </div>
                <p className="text-gray-500 font-semibold text-sm mb-1">Nothing left to publish</p>
                <p className="text-gray-400 text-xs max-w-sm">Every award's results have already been published.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {pendingPublish.map(award => (
                  <PublishableAwardCard key={award.id} award={award} onPublished={handlePublished} />
                ))}
              </div>
            )}
          </section>

          {/* Already published */}
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00338D]" /> Published · {published.length}
            </h2>
            {published.length === 0 ? (
              <p className="text-gray-400 text-sm">No results published yet.</p>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 shadow-sm">
                {published.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="w-8 h-8 bg-[#EEF2FA] rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#00338D]" />
                    </div>
                    <span className="text-[#0A1628] text-sm font-medium truncate">{a.name}</span>
                    <span className="ml-auto text-emerald-600 text-xs font-semibold flex-shrink-0">Live in Results</span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  )
}
