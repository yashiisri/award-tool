import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trophy, Building2, Briefcase, Lock, Award } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function HJResults() {
  const [searchParams] = useSearchParams()
  const awardFromUrl = searchParams.get('award')

  const [awardResults, setAwardResults] = useState([])   // [{award_id, award_name, nominees}]
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchResults() }, [awardFromUrl])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/head-jury/my-results')
      // If a specific award is selected, filter to just that one
      const filtered = awardFromUrl
        ? data.filter(r => r.award_id === awardFromUrl)
        : data
      setAwardResults(filtered)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        icon={Trophy}
        title="Results"
        subtitle="Your official rankings — the head jury's decision is final"
        accent="#7F3F98"
        light="#F5EEF8"
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#7F3F98] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No rankings submitted yet */}
      {!loading && awardResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#F5EEF8] rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-8 h-8 text-[#7F3F98]" />
          </div>
          <p className="font-black text-[#1a1a2e] text-lg mb-2">No Rankings Submitted Yet</p>
          <p className="text-gray-400 text-sm text-center max-w-xs">
            Submit your ranking from the "Your Vote" page to see the official results here.
          </p>
        </div>
      )}

      {/* Per-award results */}
      {!loading && awardResults.length > 0 && (
        <div className="space-y-12">
          {awardResults.map(({ award_id, award_name, nominees }) => (
            <div key={award_id}>

              {/* Award title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-[#F5EEF8] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-[#7F3F98]" />
                </div>
                <h2 className="font-black text-[#1a1a2e] text-lg">{award_name}</h2>
              </div>

              {/* ── Podium — top 3 ── */}
              {nominees.length >= 2 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Silver — 2nd */}
                  <div className="flex flex-col items-center justify-end">
                    <PodiumCard nominee={nominees[1]} position={2} height="h-44" />
                  </div>
                  {/* Gold — 1st (tallest, centre) */}
                  <div className="flex flex-col items-center justify-end">
                    <PodiumCard nominee={nominees[0]} position={1} height="h-56" />
                  </div>
                  {/* Bronze — 3rd */}
                  <div className="flex flex-col items-center justify-end">
                    {nominees[2]
                      ? <PodiumCard nominee={nominees[2]} position={3} height="h-36" />
                      : <div />}
                  </div>
                </div>
              )}

              {/* ── Full ranked list ── */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#7F3F98]" />
                  <h3 className="font-black text-[#1a1a2e] text-xs uppercase tracking-wider">Official Rankings</h3>
                </div>

                {nominees.map((nom, i) => (
                  <div
                    key={nom.nominee_id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors
                      ${i !== nominees.length - 1 ? 'border-b border-gray-50' : ''}
                      ${i === 0 ? 'bg-gradient-to-r from-amber-50/60 to-transparent' : ''}
                      ${i === 1 ? 'bg-gradient-to-r from-gray-50/80 to-transparent' : ''}
                    `}
                  >
                    {/* Rank badge */}
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      <RankBadge position={i + 1} />
                    </div>

                    {/* Avatar */}
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden
                      ${i === 0 ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                      ${i === 1 ? 'ring-2 ring-gray-300 ring-offset-1' : ''}
                      ${i === 2 ? 'ring-2 ring-orange-300 ring-offset-1' : ''}
                    `}
                      style={{ background: i === 0 ? 'linear-gradient(135deg,#FFD700,#FFA500)' : i === 1 ? 'linear-gradient(135deg,#C0C0C0,#A8A8A8)' : i === 2 ? 'linear-gradient(135deg,#CD7F32,#A0522D)' : '#F5EEF8' }}
                    >
                      {nom.photo_url ? (
                        <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <span className={`font-black text-sm ${i < 3 ? 'text-white' : 'text-[#7F3F98]'}`}>
                          {nom.name?.[0]}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${i === 0 ? 'text-amber-700' : i === 1 ? 'text-gray-600' : 'text-[#1a1a2e]'}`}>
                        {nom.name}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-gray-400 text-xs truncate">
                          <Briefcase className="w-3 h-3 flex-shrink-0" />{nom.designation}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400 text-xs truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />{nom.organisation}
                        </span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className={`font-black text-base ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-[#7F3F98]'}`}>
                        {nom.points}
                      </div>
                      <div className="text-gray-400 text-xs">pts</div>
                    </div>

                    {/* Bar */}
                    <div className="w-20 flex-shrink-0">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            i === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' :
                            i === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                            i === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-300' :
                            'bg-gradient-to-r from-[#7F3F98] to-[#5B2D6E]'
                          }`}
                          style={{ width: `${(nom.points / (nominees[0]?.points || 1)) * 100}%` }}
                        />
                      </div>
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

// ── Podium card ───────────────────────────────────────────────────────────────

function PodiumCard({ nominee, position, height }) {
  const configs = {
    1: {
      label: '🥇 1st Place',
      bg: 'bg-gradient-to-b from-amber-50 to-amber-100',
      border: 'border-amber-300',
      ring: 'ring-4 ring-amber-400 ring-offset-2',
      nameColor: 'text-amber-800',
      badge: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white',
      avatarBg: 'from-amber-400 to-yellow-500',
      shadow: 'shadow-xl shadow-amber-200/60',
    },
    2: {
      label: '🥈 2nd Place',
      bg: 'bg-gradient-to-b from-gray-50 to-gray-100',
      border: 'border-gray-300',
      ring: 'ring-2 ring-gray-300 ring-offset-1',
      nameColor: 'text-gray-700',
      badge: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      avatarBg: 'from-gray-400 to-gray-500',
      shadow: 'shadow-lg shadow-gray-200/60',
    },
    3: {
      label: '🥉 3rd Place',
      bg: 'bg-gradient-to-b from-orange-50 to-orange-100',
      border: 'border-orange-300',
      ring: 'ring-2 ring-orange-300 ring-offset-1',
      nameColor: 'text-orange-800',
      badge: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
      avatarBg: 'from-orange-400 to-orange-500',
      shadow: 'shadow-lg shadow-orange-200/40',
    },
  }

  const c = configs[position]

  return (
    <div className={`w-full ${height} ${c.bg} border-2 ${c.border} rounded-2xl ${c.shadow} flex flex-col items-center justify-end p-4 relative overflow-hidden`}>
      {/* Subtle shimmer for 1st */}
      {position === 1 && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.avatarBg} ${c.ring} flex items-center justify-center mb-3 overflow-hidden flex-shrink-0`}>
        {nominee.photo_url ? (
          <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <span className="text-white text-xl font-black">{nominee.name?.[0]}</span>
        )}
      </div>

      {/* Name */}
      <p className={`font-black text-xs text-center leading-tight mb-1 ${c.nameColor} line-clamp-2`}>
        {nominee.name}
      </p>
      <p className="text-gray-400 text-xs text-center truncate w-full mb-2">{nominee.organisation}</p>

      {/* Badge */}
      <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${c.badge}`}>
        {c.label}
      </span>
    </div>
  )
}

// ── Rank badge ────────────────────────────────────────────────────────────────

function RankBadge({ position }) {
  if (position === 1) return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-200">
      <span className="text-white font-black text-xs">1st</span>
    </div>
  )
  if (position === 2) return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm">
      <span className="text-white font-black text-xs">2nd</span>
    </div>
  )
  if (position === 3) return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
      <span className="text-white font-black text-xs">3rd</span>
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400 font-black text-xs">#{position}</span>
    </div>
  )
}
