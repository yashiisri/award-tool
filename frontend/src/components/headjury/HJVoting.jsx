import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  GripVertical, Trophy, Lock, CheckCircle,
  Sparkles, RotateCcw, Send, Building2, Briefcase, Info, ArrowLeft, Award, ArrowRight
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const POSITION_POINTS = [10, 8, 6, 5, 4, 3, 2, 1]
function getPoints(index) { return POSITION_POINTS[index] ?? 1 }

// ── Golden confetti ───────────────────────────────────────────────────────────
const GOLD_SHADES = ['#FFD700','#FFC200','#FFB300','#FFAA00','#FFE066','#FFF0A0','#E6B800','#FFCA28']

function ConfettiBurst({ onDone }) {
  const pieces = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      color: GOLD_SHADES[Math.floor(Math.random() * GOLD_SHADES.length)],
      size: 6 + Math.random() * 8,
      angle: -80 + Math.random() * 160,
      speed: 0.6 + Math.random() * 0.8,
      spin: Math.random() > 0.5 ? 1 : -1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      delay: Math.random() * 0.25,
    }))
  ).current

  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: '-10px', left: `${p.left}%`,
          width: p.shape === 'circle' ? p.size : p.size * 0.6,
          height: p.shape === 'circle' ? p.size : p.size * 1.6,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
          backgroundColor: p.color, boxShadow: `0 0 4px ${p.color}88`,
          animation: `confetti-fly ${1.4 * p.speed}s ease-out ${p.delay}s forwards`,
          '--angle': `${p.angle}deg`, '--spin': p.spin,
        }} />
      ))}
      <style>{`
        @keyframes confetti-fly {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
          60%  { opacity:1; }
          100% { transform: translate(calc(sin(var(--angle))*260px),calc(-1*cos(var(--angle))*420px)) rotate(calc(var(--spin)*540deg)) scale(0.4); opacity:0; }
        }
      `}</style>
    </div>
  )
}

function PositionBadge({ index }) {
  const medals = ['🥇','🥈','🥉']
  const colors = [
    'bg-amber-50 text-amber-600 border-amber-200',
    'bg-gray-50 text-gray-500 border-gray-200',
    'bg-orange-50 text-orange-500 border-orange-200',
  ]
  if (index < 3) {
    return (
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg flex-shrink-0 ${colors[index]}`}>
        {medals[index]}
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
      <span className="text-gray-400 font-black text-xs">#{index + 1}</span>
    </div>
  )
}

export default function HJVoting() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const awardFromUrl = searchParams.get('award')

  const [awardName, setAwardName] = useState('')
  const [nominees, setNominees] = useState([])
  const [aiOrder, setAiOrder] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [votingOpen, setVotingOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const dragNode = useRef(null)
  const touchStartY = useRef(null)
  const touchStartIdx = useRef(null)

  useEffect(() => { if (awardFromUrl) fetchData(awardFromUrl) }, [awardFromUrl])

  const fetchData = async (awardId) => {
    setLoading(true)
    try {
      const [nomRes, ctrlRes, rankRes, awardRes] = await Promise.all([
        api.get(`/jury/awards/${awardId}/nominees`),
        api.get(`/jury/vote-control/${awardId}`),
        api.get(`/jury/ranking/${awardId}`).catch(() => ({ data: null })),
        api.get('/jury/awards'),
      ])
      const award = awardRes.data.find(a => a.id === awardId)
      setAwardName(award?.name || '')
      setVotingOpen(ctrlRes.data.voting_enabled || false)

      const sorted = [...nomRes.data].sort((a, b) => {
        const sa = a.rationale_data?.confidence_score ?? 0
        const sb = b.rationale_data?.confidence_score ?? 0
        return sb - sa
      })
      setAiOrder(sorted.map(n => n.id))

      if (rankRes.data && rankRes.data.rankings?.length > 0) {
        const rankMap = {}
        rankRes.data.rankings.forEach(r => { rankMap[r.nominee_id] = r.rank })
        const ordered = [...nomRes.data].sort((a, b) => (rankMap[a.id] ?? 99) - (rankMap[b.id] ?? 99))
        setNominees(ordered)
        setSubmitted(true)
      } else {
        setNominees(sorted)
        setSubmitted(false)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Drag ──────────────────────────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    dragNode.current = e.currentTarget
    setDragIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { if (dragNode.current) dragNode.current.classList.add('opacity-40') }, 0)
  }
  const handleDragEnter = (e, index) => { e.preventDefault(); if (index !== dragIdx) setDragOverIdx(index) }
  const handleDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIndex) return
    const updated = [...nominees]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(dropIndex, 0, moved)
    setNominees(updated); setDragIdx(null); setDragOverIdx(null)
  }
  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.classList.remove('opacity-40')
    dragNode.current = null; setDragIdx(null); setDragOverIdx(null)
  }

  // ── Touch ─────────────────────────────────────────────────────────────────────
  const handleTouchStart = (e, index) => { touchStartY.current = e.touches[0].clientY; touchStartIdx.current = index }
  const handleTouchMove  = (e) => {
    e.preventDefault()
    const y = e.touches[0].clientY
    const items = document.querySelectorAll('[data-hj-rank-item]')
    let targetIdx = touchStartIdx.current
    items.forEach((el, i) => { const r = el.getBoundingClientRect(); if (y >= r.top && y <= r.bottom) targetIdx = i })
    setDragOverIdx(targetIdx)
  }
  const handleTouchEnd = () => {
    if (touchStartIdx.current !== null && dragOverIdx !== null && touchStartIdx.current !== dragOverIdx) {
      const updated = [...nominees]
      const [moved] = updated.splice(touchStartIdx.current, 1)
      updated.splice(dragOverIdx, 0, moved)
      setNominees(updated)
    }
    touchStartIdx.current = null; touchStartY.current = null; setDragOverIdx(null)
  }

  const handleReset = () => {
    setNominees([...nominees].sort((a, b) => aiOrder.indexOf(a.id) - aiOrder.indexOf(b.id)))
  }

  const handleSubmit = async () => {
    if (!votingOpen || !awardFromUrl) return
    setSaving(true)
    try {
      const rankings = nominees.map((nom, i) => ({ nominee_id: nom.id, rank: i + 1, points: getPoints(i) }))
      await api.post('/jury/ranking', { award_id: awardFromUrl, rankings })
      setSubmitted(true); setShowConfetti(true); setShowSuccessPopup(true)
      setTimeout(() => setShowSuccessPopup(false), 3000)
      await fetchData(awardFromUrl)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit ranking')
    } finally { setSaving(false) }
  }

  const handleConfettiDone = useCallback(() => setShowConfetti(false), [])

  // ── No award ──────────────────────────────────────────────────────────────────
  if (!awardFromUrl) {
    return (
      <div className="p-8">
        <PageHeader icon={Trophy} title="Your Vote" subtitle="Drag nominees to rank them" accent="#7F3F98" light="#F5EEF8" />
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#F5EEF8] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#7F3F98]" />
          </div>
          <p className="text-gray-500 font-semibold mb-1">No award selected</p>
          <p className="text-gray-400 text-sm mb-6">Go to Awards and click an award to start ranking.</p>
          <button onClick={() => navigate('/head_jury/awards')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go to Awards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {showConfetti && <ConfettiBurst onDone={handleConfettiDone} />}

      {/* Toast */}
      {showSuccessPopup && createPortal(
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 bg-white border border-amber-200 rounded-2xl shadow-xl shadow-amber-100/60"
          style={{ animation: 'toast-in-out 3s ease forwards' }}>
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-[#1a1a2e] text-sm leading-tight">Ranking Submitted!</p>
            <p className="text-gray-400 text-xs mt-0.5">Results will be published by the admin soon.</p>
          </div>
          <style>{`
            @keyframes toast-in-out {
              0%   { transform:translateX(120%); opacity:0; }
              12%  { transform:translateX(0);    opacity:1; }
              70%  { transform:translateX(0);    opacity:1; max-width:360px; }
              88%  { transform:translateX(0);    opacity:1; max-width:44px; padding-right:12px; }
              100% { transform:translateX(120%); opacity:0; max-width:44px; }
            }
          `}</style>
        </div>,
        document.body
      )}

      <PageHeader icon={Trophy} title="Your Vote" subtitle="Drag nominees to rank them — your order determines their points" accent="#7F3F98" light="#F5EEF8" />

      {/* Award pill + back */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/head_jury/nominees?award=${awardFromUrl}`)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#7F3F98] hover:border-[#7F3F98]/30 text-xs font-semibold transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        {awardName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F5EEF8] border border-[#7F3F98]/15 rounded-xl">
            <Award className="w-4 h-4 text-[#7F3F98] flex-shrink-0" />
            <span className="text-[#7F3F98] font-bold text-sm">{awardName}</span>
          </div>
        )}
      </div>

      {/* Voting closed */}
      {!votingOpen && !loading && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-600 text-sm">Ranking is not open yet</p>
            <p className="text-gray-400 text-xs mt-0.5">The admin will open voting when the time comes.</p>
          </div>
        </div>
      )}

      {/* Submitted banner */}
      {submitted && votingOpen && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Ranking submitted successfully</p>
            <p className="text-green-600 text-xs mt-0.5">You can still drag to reorder and resubmit.</p>
          </div>
        </div>
      )}

      {/* AI notice */}
      {nominees.length > 0 && !loading && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-gradient-to-r from-[#7F3F98]/5 to-[#0091DA]/5 border border-[#7F3F98]/15 rounded-xl">
          <Sparkles className="w-4 h-4 text-[#7F3F98] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-[#1a1a2e]">AI-Suggested Order</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Nominees are pre-ordered by AI confidence score. Drag to reorder.
              Position 1 earns <strong>{getPoints(0)} pts</strong>, position 2 earns <strong>{getPoints(1)} pts</strong>, and so on.
            </p>
          </div>
          {!submitted && (
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 hover:text-[#7F3F98] hover:border-[#7F3F98]/30 transition-all flex-shrink-0">
              <RotateCcw className="w-3 h-3" /> Reset to AI order
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#7F3F98] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && nominees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No nominees for this award yet.</p>
        </div>
      )}

      {/* Drag list */}
      {!loading && nominees.length > 0 && (
        <div className="space-y-2 mb-6">
          {nominees.map((nom, index) => {
            const pts = getPoints(index)
            const isAiTop = aiOrder[0] === nom.id
            const isDraggingOver = dragOverIdx === index
            return (
              <div
                key={nom.id}
                data-hj-rank-item
                draggable={votingOpen && !submitted}
                onDragStart={e => handleDragStart(e, index)}
                onDragEnter={e => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={e => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`
                  flex items-center gap-3 p-4 bg-white rounded-2xl border-2 transition-all select-none
                  ${isDraggingOver ? 'border-[#7F3F98] shadow-lg scale-[1.01]' : 'border-gray-100'}
                  ${votingOpen && !submitted ? 'cursor-grab active:cursor-grabbing hover:border-[#7F3F98]/30 hover:shadow-md' : 'cursor-default'}
                  ${submitted ? 'opacity-90' : ''}
                `}
              >
                <div className={`flex-shrink-0 ${votingOpen && !submitted ? 'text-gray-300' : 'text-gray-200'}`}>
                  <GripVertical className="w-5 h-5" />
                </div>

                <PositionBadge index={index} />

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5EEF8] to-[#ead5f5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {nom.photo_url ? (
                    <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <span className="text-[#7F3F98] font-black text-sm">{nom.name?.[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[#1a1a2e] text-sm truncate">{nom.name}</span>
                    {isAiTop && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#7F3F98]/10 text-[#7F3F98] text-xs rounded-md font-semibold flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5" /> AI #1
                      </span>
                    )}
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

                <div className={`
                  flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2
                  ${index === 0 ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    index === 1 ? 'bg-gray-50 border-gray-200 text-gray-500' :
                    index === 2 ? 'bg-orange-50 border-orange-200 text-orange-500' :
                    'bg-[#F5EEF8] border-[#7F3F98]/20 text-[#7F3F98]'}
                `}>
                  <span className="text-lg font-black leading-none">{pts}</span>
                  <span className="text-xs font-medium opacity-70">pts</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Points legend */}
      {nominees.length > 0 && !loading && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Points System</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {nominees.map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-500">#{i + 1}</span>
                <span className="text-xs font-black text-[#7F3F98]">{getPoints(i)} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit / View Results */}
      {nominees.length > 0 && votingOpen && !loading && (
        <button
          onClick={submitted
            ? () => navigate(`/head_jury/results${awardFromUrl ? `?award=${awardFromUrl}` : ''}`)
            : handleSubmit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#7F3F98] to-[#5B2D6E] text-white rounded-2xl font-black text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-lg"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
          ) : submitted ? (
            <><ArrowRight className="w-4 h-4" /> View Results</>
          ) : (
            <><Send className="w-4 h-4" /> Submit My Ranking</>
          )}
        </button>
      )}
    </div>
  )
}
