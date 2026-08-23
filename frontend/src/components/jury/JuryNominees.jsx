import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users, MessageSquare, Flag, X, Send,
  Building2, Briefcase, ChevronDown, Award, AlertTriangle, ArrowRight, CheckCircle
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from '../admin/NomineeProfileCard'
import Avatar from '../common/Avatar'

export default function JuryNominees() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preAward || '')
  const [nominees, setNominees] = useState([])
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
    } catch (e) {}
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setLoading(true)
    try {
      await api.post('/jury/comment', { nominee_id: commentModal, award_id: selectedAward, comment })
      setCommentModal(null)
      setComment('')
    } catch (e) {} finally { setLoading(false) }
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/jury/flag-nominee', { nominee_id: flagModal, reason: flagReason })
      setFlagModal(null)
      setFlagReason('')
      fetchNominees()
    } catch (e) {}
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader
        icon={Users}
        title="Nominees"
        subtitle="Review nominees and submit your evaluation or comments"
        accent="#0091DA"
        light="#EAF5FC"
      />

      {/* Award selector */}
      {!preAward && (
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
          <div className="relative w-full max-w-sm">
            <select
              value={selectedAward}
              onChange={e => setSelectedAward(e.target.value)}
              className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 text-sm shadow-sm pr-10"
            >
              <option value="">Choose an award</option>
              {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Award context pill */}
      {currentAward && (
        <div className="mb-6 p-4 bg-[#EAF5FC] border border-[#0091DA]/15 rounded-xl flex items-center gap-3">
          <Award className="w-5 h-5 text-[#0091DA] flex-shrink-0" />
          <div>
            <p className="font-bold text-[#0091DA] text-sm">{currentAward.name}</p>
            <p className="text-gray-500 text-xs">{currentAward.description}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {nominees.length === 0 && selectedAward ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Users className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-sm">No nominees for this award yet.</p>
          <p className="text-gray-400 text-xs mt-1">Nominees are added and approved by the administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nominees.map((nom, i) => {
            const isValidated = nom.validated
            const isFlagged   = nom.red_flagged

            return (
              <div
                key={nom.id}
                className={`group hover-lift animate-fade-in-up bg-white border rounded-2xl overflow-hidden transition-all ${
                  isFlagged ? 'border-red-200' : isValidated ? 'border-green-200' : 'border-gray-100 hover:border-[#0091DA]/20 hover:shadow-lg hover:shadow-[#0091DA]/5'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="p-4 pb-0">
                  {/* Status badges */}
                  {(isValidated || isFlagged) && (
                    <div className="flex items-center justify-between gap-1 mb-3">
                      <div className="flex gap-1">
                        {isValidated && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EAF5FC] text-[#0091DA] text-[11px] font-semibold rounded-lg">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </div>
                      {isFlagged && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[11px] font-semibold rounded-lg border border-red-100">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                  )}

                  {/* Avatar + identity */}
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setSelectedNominee(nom)}>
                    <Avatar name={nom.name} photoUrl={nom.photo_url} size={56} />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-[#0A1628] text-sm leading-snug hover:text-[#0091DA] transition-colors line-clamp-1">
                        {nom.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{nom.designation}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{nom.organisation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons — comment & flag only */}
                <div className="p-4">
                  <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => setCommentModal(nom.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#0091DA] bg-[#EAF5FC] border border-[#0091DA]/20 rounded-lg hover:bg-[#0091DA] hover:text-white hover:border-[#0091DA] transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Add Comment
                    </button>
                    <button
                      onClick={() => setFlagModal(nom.id)}
                      className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                      title="Flag nominee"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Profile detail modal */}
      {selectedNominee && (
        <NomineeProfileCard nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />
      )}

      {/* Comment modal */}
      {commentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#0A1628]">Add Comment</h2>
                <p className="text-xs text-gray-400 mt-0.5">Share your assessment of this nominee</p>
              </div>
              <button
                onClick={() => { setCommentModal(null); setComment('') }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 resize-none text-sm mb-4"
                rows="4"
                placeholder="Share your thoughts, evaluation, or concerns about this nominee..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleComment}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Comment'}
                </button>
                <button
                  onClick={() => { setCommentModal(null); setComment('') }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0A1628]">Flag Nominee</h2>
                <p className="text-xs text-gray-400">Raise a concern for review</p>
              </div>
            </div>
            <textarea
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4"
              rows="3"
              placeholder="Describe the concern with this nominee..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleFlag}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Submit Flag
              </button>
              <button
                onClick={() => { setFlagModal(null); setFlagReason('') }}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proceed to ranking */}
      {selectedAward && nominees.length > 0 && (
        <button
          onClick={() => navigate(`/jury/ranking?award=${selectedAward}`)}
          className="fixed bottom-8 right-8 flex items-center gap-2.5 px-5 py-3.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm shadow-xl hover:bg-[#002a73] hover:shadow-2xl active:scale-95 transition-all z-40"
        >
          Proceed to Ranking
          <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      )}
    </div>
  )
}
