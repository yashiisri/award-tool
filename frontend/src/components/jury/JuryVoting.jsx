import { useState, useEffect } from 'react'
import { Vote, Lock, X, Building2, Briefcase, CheckCircle, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

// Only 2 ranks — points hidden from jury
const RANKS = [
  { rank: 1, label: 'Rank 1', color: '#F59E0B', bg: '#FFFBEB', border: '#F59E0B' },
  { rank: 2, label: 'Rank 2', color: '#6B7280', bg: '#F9FAFB', border: '#D1D5DB' },
]

export default function JuryVoting() {
  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState('')
  const [nominees, setNominees] = useState([])
  const [myVotes, setMyVotes] = useState({})
  const [votingOpen, setVotingOpen] = useState(false)
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchData() }, [selectedAward])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchData = async () => {
    try {
      const [nomRes, ctrlRes, voteRes] = await Promise.all([
        api.get(`/jury/awards/${selectedAward}/nominees`),
        api.get(`/jury/vote-control/${selectedAward}`),
        api.get(`/jury/my-votes/${selectedAward}`),
      ])
      setNominees(nomRes.data)
      setVotingOpen(ctrlRes.data.voting_enabled || false)
      const map = {}
      voteRes.data.forEach(v => { map[v.nominee_id] = v })
      setMyVotes(map)
    } catch (e) {}
  }

  const handleVote = async (nomineeId, rank) => {
    if (!votingOpen || myVotes[nomineeId]) return
    setLoading(true)
    try {
      await api.post('/jury/vote', { award_id: selectedAward, nominee_id: nomineeId, rank })
      await fetchData()
      setSelectedNominee(null)
    } catch (e) {
      alert(e.response?.data?.detail || 'Voting failed')
    } finally { setLoading(false) }
  }

  const totalVoted = Object.keys(myVotes).length

  return (
    <div className="p-8">
      <PageHeader icon={Vote} title="Voting" subtitle="Cast your votes for nominees" accent="#0091DA" light="#EAF5FC" />

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

      {/* Voting closed state */}
      {selectedAward && !votingOpen && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-600 text-sm">Voting is not open yet</p>
            <p className="text-gray-400 text-xs mt-0.5">The admin will open voting when the time comes.</p>
          </div>
        </div>
      )}

      {selectedAward && votingOpen && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="font-semibold text-green-800 text-sm">Voting is open — {totalVoted}/{nominees.length} votes cast</p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ${!votingOpen ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        {nominees.map(nom => {
          const myVote = myVotes[nom.id]
          const rankInfo = myVote ? RANKS.find(r => r.rank === myVote.rank) : null
          return (
            <div key={nom.id}
              onClick={() => votingOpen && !myVote && setSelectedNominee(nom)}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${myVote ? 'border-green-200' : votingOpen ? 'border-gray-100 hover:shadow-xl hover:border-[#0091DA]/20 cursor-pointer hover:-translate-y-0.5' : 'border-gray-100'}`}>
              <div className="h-28 bg-gradient-to-br from-[#EAF5FC] to-[#dce8f5] flex items-center justify-center relative">
                {nom.photo_url ? (
                  <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div className="w-14 h-14 bg-[#0091DA] rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-black">{nom.name?.[0]}</span>
                  </div>
                )}
                {myVote && rankInfo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">{rankInfo.label}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-black text-[#1a1a2e] text-sm mb-1">{nom.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5"><Briefcase className="w-3 h-3" />{nom.designation}</div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4"><Building2 className="w-3 h-3" />{nom.organisation}</div>
                {myVote ? (
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ backgroundColor: rankInfo?.bg, color: rankInfo?.color }}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Voted — {rankInfo?.label}</span>
                  </div>
                ) : votingOpen ? (
                  <div className="py-2 px-3 bg-[#EAF5FC] text-[#0091DA] rounded-xl text-xs font-semibold text-center">Tap to vote</div>
                ) : (
                  <div className="py-2 px-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3" /> Voting closed
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rank selection modal — no points shown */}
      {selectedNominee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedNominee(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#0091DA] to-[#00338D] p-6 rounded-t-3xl relative">
              <button onClick={() => setSelectedNominee(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/30">
                  <span className="text-white text-lg font-black">{selectedNominee.name?.[0]}</span>
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{selectedNominee.name}</h2>
                  <p className="text-white/70 text-xs">{selectedNominee.organisation}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-4 text-center">Select a rank for this nominee</p>
              <div className="space-y-3">
                {RANKS.map(r => (
                  <button key={r.rank} onClick={() => handleVote(selectedNominee.id, r.rank)} disabled={loading}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 hover:scale-[1.01] transition-all disabled:opacity-50"
                    style={{ borderColor: r.border, backgroundColor: r.bg }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0" style={{ backgroundColor: r.color }}>
                      #{r.rank}
                    </div>
                    <span className="font-bold text-base" style={{ color: r.color }}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
