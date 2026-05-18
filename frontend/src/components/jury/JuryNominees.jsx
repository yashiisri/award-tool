import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Users, CheckCircle, MessageSquare, Flag, X, Send, Building2, Briefcase, ChevronDown, Award, AlertTriangle, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from '../admin/NomineeProfileCard'

export default function JuryNominees() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preAward || '')
  const [nominees, setNominees] = useState([])
  const [validated, setValidated] = useState(new Set())
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [commentModal, setCommentModal] = useState(null)
  const [flagModal, setFlagModal] = useState(null)
  const [comment, setComment] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchNominees = async () => {
    try {
      const { data } = await api.get(`/jury/awards/${selectedAward}/nominees`)
      setNominees(data)
      // Build validated set from the nominee's validated_by array
      const username = localStorage.getItem('username') || ''
      const myValidated = new Set(
        data.filter(n => n.validated_by?.includes(username)).map(n => n.id)
      )
      setValidated(myValidated)
    } catch (e) {}
  }

  const handleValidate = async (id) => {
    try {
      await api.post('/jury/validate-nominee', { nominee_id: id })
      setValidated(new Set([...validated, id]))
      fetchNominees()
    } catch (e) {}
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setLoading(true)
    try {
      await api.post('/jury/comment', { nominee_id: commentModal, award_id: selectedAward, comment })
      setCommentModal(null); setComment('')
    } catch (e) {} finally { setLoading(false) }
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/jury/flag-nominee', { nominee_id: flagModal, reason: flagReason })
      setFlagModal(null); setFlagReason(''); fetchNominees()
    } catch (e) {}
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader icon={Users} title="Nominees & Validation" subtitle="Review nominees and submit your validation or comments" accent="#0091DA" light="#EAF5FC" />

      {/* Award selector — only shown when no award was pre-selected from Awards page */}
      {!preAward && (
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
      )}

      {currentAward && (
        <div className="mb-6 p-4 bg-[#EAF5FC] border border-[#0091DA]/15 rounded-xl flex items-center gap-3">
          <Award className="w-5 h-5 text-[#0091DA] flex-shrink-0" />
          <div>
            <p className="font-bold text-[#0091DA] text-sm">{currentAward.name}</p>
            <p className="text-gray-500 text-xs">{currentAward.description}</p>
          </div>
        </div>
      )}

      {nominees.length === 0 && selectedAward ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Users className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No nominees for this award yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {nominees.map(nom => {
            const isValidated = validated.has(nom.id)
            const isFlagged   = nom.red_flagged

            return (
              <div
                key={nom.id}
                className={`
                  group relative bg-white rounded-3xl overflow-hidden
                  border-2 transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#0091DA]/10
                  ${isFlagged
                    ? 'border-red-200 hover:border-red-300'
                    : isValidated
                    ? 'border-green-200 hover:border-green-300'
                    : 'border-gray-100 hover:border-[#0091DA]/30'}
                `}
              >
                {/* ── Avatar banner ── */}
                <div
                  className="relative h-44 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedNominee(nom)}
                >
                  {/* Background gradient — always visible, image overlays it */}
                  <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105
                    ${isFlagged
                      ? 'bg-gradient-to-br from-red-50 to-red-100'
                      : 'bg-gradient-to-br from-[#EAF5FC] via-[#dce8f5] to-[#c8dff0]'}`}
                  />

                  {/* Photo or initials */}
                  {nom.photo_url ? (
                    <img
                      src={nom.photo_url}
                      alt={nom.name}
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center
                        shadow-lg transition-transform duration-300 group-hover:scale-110
                        ${isFlagged ? 'bg-red-400' : 'bg-gradient-to-br from-[#0091DA] to-[#00338D]'}
                      `}>
                        <span className="text-white text-2xl font-black">{nom.name?.[0]}</span>
                      </div>
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    {isValidated && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-xl shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Validated
                      </span>
                    )}
                    {isFlagged && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-xl shadow-sm ml-auto">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="px-5 pt-4 pb-5">
                  {/* Name */}
                  <h3
                    className="font-black text-[#1a1a2e] text-sm leading-snug mb-1 cursor-pointer hover:text-[#0091DA] transition-colors duration-200 line-clamp-1"
                    onClick={() => setSelectedNominee(nom)}
                  >
                    {nom.name}
                  </h3>

                  {/* Role + org */}
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{nom.designation}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-5">
                    <Building2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{nom.organisation}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* Validate */}
                    <button
                      onClick={() => handleValidate(nom.id)}
                      disabled={isValidated}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold
                        transition-all duration-200
                        ${isValidated
                          ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed'
                          : 'bg-[#EAF5FC] text-[#0091DA] border border-[#0091DA]/20 hover:bg-[#0091DA] hover:text-white hover:border-[#0091DA] hover:shadow-md hover:shadow-[#0091DA]/20 active:scale-95'}
                      `}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isValidated ? 'Validated' : 'Validate'}
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => setCommentModal(nom.id)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 border border-gray-200 rounded-2xl hover:bg-[#EAF5FC] hover:text-[#0091DA] hover:border-[#0091DA]/20 transition-all duration-200 active:scale-95"
                      title="Add comment"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Flag */}
                    <button
                      onClick={() => setFlagModal(nom.id)}
                      className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-400 border border-orange-200 rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 active:scale-95"
                      title="Flag nominee"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Hover accent line at bottom ── */}
                <div className={`
                  absolute bottom-0 inset-x-0 h-0.5 scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-left rounded-full
                  ${isFlagged ? 'bg-red-400' : isValidated ? 'bg-green-400' : 'bg-gradient-to-r from-[#0091DA] to-[#00338D]'}
                `} />
              </div>
            )
          })}
        </div>
      )}

      {/* Profile detail modal */}
      {selectedNominee && <NomineeProfileCard nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />}

      {/* Comment modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-[#1a1a2e]">Add Comment</h2>
              <button onClick={() => { setCommentModal(null); setComment('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 resize-none text-sm mb-4" rows="4"
                placeholder="Share your thoughts, suggestions, or concerns about this nominee..." />
              <div className="flex gap-3">
                <button onClick={handleComment} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0091DA] text-white rounded-xl font-semibold text-sm hover:bg-[#007ab8] disabled:opacity-50 transition-colors">
                  <Send className="w-4 h-4" /> Submit Comment
                </button>
                <button onClick={() => { setCommentModal(null); setComment('') }} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Flag modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Flag className="w-5 h-5 text-red-500" /></div>
              <h2 className="text-lg font-black text-[#1a1a2e]">Flag Nominee</h2>
            </div>
            <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4" rows="3"
              placeholder="Reason for flagging this nominee..." />
            <div className="flex gap-3">
              <button onClick={handleFlag} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">Confirm</button>
              <button onClick={() => { setFlagModal(null); setFlagReason('') }} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Next → Jury Ranking button */}
      {selectedAward && nominees.length > 0 && (
        <button
          onClick={() => navigate(`/jury/ranking?award=${selectedAward}`)}
          className="fixed bottom-8 right-8 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#0091DA] to-[#00338D] text-white rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all z-40"
        >
          Jury Ranking
          <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}
    </div>
  )
}
