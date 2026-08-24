import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Trophy, Lock, CheckCircle, Send, Building2, Briefcase,
  ArrowLeft, Award, Check,
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import RankMedal from '../layout/RankMedal'
import aimaLogo from '../../aima-logo.png'

// Same 5-tier palette as RankMedal.jsx (gold/silver/bronze/blue/plum) — no
// yellow-and-grey flatness, each rank reads as visually distinct.
const RANK_META = [
  { key: 'first',  label: '1st Choice', rank: 1, ring: '#D4AF37', badge: 'linear-gradient(135deg, #D4AF37, #B8860B)' },
  { key: 'second', label: '2nd Choice', rank: 2, ring: '#B0B7C0', badge: 'linear-gradient(135deg, #B0B7C0, #8A94A0)' },
  { key: 'third',  label: '3rd Choice', rank: 3, ring: '#C08552', badge: 'linear-gradient(135deg, #C08552, #9C6B3E)' },
  { key: 'fourth', label: '4th Choice', rank: 4, ring: '#0057D9', badge: 'linear-gradient(135deg, #0057D9, #00338D)' },
  { key: 'fifth',  label: '5th Choice', rank: 5, ring: '#7C4B94', badge: 'linear-gradient(135deg, #7C4B94, #5B2D6E)' },
]

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function HJVoting() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const awardFromUrl = searchParams.get('award')

  const [awardName, setAwardName] = useState('')
  const [nominees, setNominees] = useState([])
  const [picks, setPicks] = useState([])          // ordered nominee_ids, index 0 = 1st choice
  const [submitted, setSubmitted] = useState(false)
  const [votingOpen, setVotingOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => { if (awardFromUrl) fetchData(awardFromUrl) }, [awardFromUrl])

  const fetchData = async (awardId) => {
    setLoading(true)
    try {
      const [nomRes, ctrlRes, voteRes, awardRes] = await Promise.all([
        api.get(`/jury/awards/${awardId}/nominees`),
        api.get(`/jury/vote-control/${awardId}`),
        api.get(`/jury/my-vote/${awardId}`).catch(() => ({ data: null })),
        api.get('/jury/awards'),
      ])
      const award = awardRes.data.find(a => a.id === awardId)
      setAwardName(award?.name || '')
      setVotingOpen(ctrlRes.data.voting_enabled || false)
      setNominees(nomRes.data)

      if (voteRes.data) {
        setPicks(voteRes.data.choices || [])
        setSubmitted(true)
      } else {
        setPicks([])
        setSubmitted(false)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const maxPicks = Math.min(5, nominees.length)

  const handlePick = (nomineeId) => {
    if (!votingOpen || submitted) return
    setPicks(prev => {
      if (prev.includes(nomineeId)) return prev.filter(id => id !== nomineeId)
      if (prev.length >= maxPicks) return prev
      return [...prev, nomineeId]
    })
  }

  const handleSubmit = async () => {
    if (!votingOpen || !awardFromUrl || picks.length !== maxPicks) return
    setSaving(true)
    try {
      await api.post('/jury/vote-ranked', {
        award_id: awardFromUrl,
        choices: picks,
      })
      setConfirmOpen(false)
      await fetchData(awardFromUrl)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit vote')
    } finally { setSaving(false) }
  }

  const pickedNominees = picks.map(id => nominees.find(n => n.id === id)).filter(Boolean)

  if (!awardFromUrl) {
    return (
      <div className="p-8">
        <PageHeader icon={Trophy} title="Your Vote" subtitle="Rank your top nominees" accent="#00338D" light="#EEF3FF" />
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF3FF] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-600 font-semibold text-sm mb-1">No award selected</p>
          <p className="text-gray-400 text-xs mb-6">Navigate to Awards and select an award to begin voting.</p>
          <button
            onClick={() => navigate('/head_jury/awards')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Awards
          </button>
        </div>
      </div>
    )
  }

  const allPicked = maxPicks > 0 && picks.length === maxPicks

  // ── Already voted — formal confirmation, not the interactive grid ──────────────
  if (submitted && !loading) {
    return (
      <div className="p-8" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid var(--border-light)', textAlign: 'center', padding: '48px 40px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle className="w-7 h-7" style={{ color: '#16A34A' }} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: 'var(--kpmg-navy)', marginBottom: 8 }}>
            Your vote has been recorded
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>
            Thank you for your participation in the AIMA Managing India Awards 2026.
          </p>

          <div style={{ textAlign: 'left', border: '1px solid var(--border-light)', marginBottom: 28 }}>
            {pickedNominees.map((nom, i) => (
              <div key={nom.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < pickedNominees.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <RankMedal rank={i + 1} size={26} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RANK_META[i]?.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{nom?.name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{nom?.organisation}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 24 }}>
            You may close this window or continue reviewing other award categories.
          </p>

          <img src={aimaLogo} alt="AIMA" style={{ height: 30, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />

          <button
            onClick={() => navigate('/head_jury/awards')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#00338D] text-white rounded-none font-bold text-sm hover:bg-[#002a73] transition-all"
          >
            Back to Awards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Confirmation dialog before final submit */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget && !saving) setConfirmOpen(false) }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 420, padding: '28px 26px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: 'var(--kpmg-navy)', marginBottom: 6 }}>
              Confirm Your Official Vote
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 18 }}>Once submitted, your vote cannot be changed.</p>
            <div style={{ border: '1px solid var(--border-light)', marginBottom: 22 }}>
              {pickedNominees.map((nom, i) => (
                <div key={nom.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < pickedNominees.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <RankMedal rank={i + 1} size={20} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{RANK_META[i]?.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{nom?.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSubmit} disabled={saving} style={{
                flex: 1, padding: '11px', background: saving ? '#9BA8B5' : 'var(--kpmg-blue)', color: '#fff', border: 'none',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Submitting…' : 'Confirm Vote'}
              </button>
              <button onClick={() => setConfirmOpen(false)} disabled={saving} style={{
                padding: '11px 18px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        icon={Trophy}
        title="Your Vote"
        subtitle={`Tap to rank your 1st through ${maxPicks > 1 ? RANK_META[maxPicks - 1]?.label.replace(' Choice', '') : ''} choice nominee`}
        accent="#00338D"
        light="#EEF3FF"
      />

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/head_jury/nominees?award=${awardFromUrl}`)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#00338D] hover:border-[#00338D]/30 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        {awardName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#EEF3FF] border border-[#00338D]/15 rounded-xl">
            <Award className="w-4 h-4 text-[#00338D] flex-shrink-0" />
            <span className="text-[#00338D] font-bold text-sm">{awardName}</span>
          </div>
        )}
      </div>

      {!votingOpen && !loading && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Voting for this award has not yet opened</p>
            <p className="text-gray-400 text-xs mt-0.5">You will be notified when voting begins.</p>
          </div>
        </div>
      )}

      {votingOpen && !loading && maxPicks > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-[#EEF3FF] border border-[#00338D]/20 rounded-xl flex-wrap">
          {RANK_META.slice(0, maxPicks).map((r, i) => (
            <div key={r.key} className="flex items-center gap-3">
              {i > 0 && <span className="text-gray-300">→</span>}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0" style={{ background: r.badge }}>{r.rank}</div>
                <span className="text-sm text-[#0A1628] font-medium whitespace-nowrap">Tap your {r.label.toLowerCase()}</span>
              </div>
            </div>
          ))}
          <span className="text-gray-300">→</span>
          <span className="text-sm text-[#00338D] font-bold">Confirm</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && votingOpen && nominees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-sm">No nominees available for this award.</p>
        </div>
      )}
      {!loading && votingOpen && nominees.length === 1 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-sm">At least 2 nominees are needed to vote.</p>
        </div>
      )}

      {!loading && votingOpen && nominees.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
          {nominees.map(nom => {
            const pickIndex = picks.indexOf(nom.id)
            const meta = pickIndex >= 0 ? RANK_META[pickIndex] : null
            const disabled = !meta && picks.length >= maxPicks

            return (
              <div
                key={nom.id}
                onClick={() => handlePick(nom.id)}
                className={`bg-white border rounded-2xl overflow-hidden transition-all relative ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                } ${meta ? 'border-transparent' : 'border-gray-100'}`}
                style={meta ? { boxShadow: `0 0 0 2px ${meta.ring}` } : undefined}
              >
                {meta && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-black shadow-md" style={{ background: meta.badge }}>
                    <RankMedal rank={meta.rank} size={16} /> {meta.label}
                  </div>
                )}

                <div className="relative pt-7 pb-4 px-5 bg-gradient-to-b from-[#EEF2FA] to-white text-center">
                  <div
                    className={`w-20 h-20 rounded-full mx-auto overflow-hidden relative ring-4 ring-white ${nom.photo_url ? 'shadow-md' : ''}`}
                    style={{ background: nom.photo_url ? 'linear-gradient(135deg, #00338D, #0057D9)' : '#E2E5EA' }}
                  >
                    {nom.photo_url && (
                      <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    )}
                    <div className="w-full h-full items-center justify-center absolute inset-0" style={{ display: nom.photo_url ? 'none' : 'flex' }}>
                      <span className="text-[#6B7280] text-lg font-semibold">{getInitials(nom.name)}</span>
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold text-[#0A1628] text-[15px] leading-snug truncate">{nom.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mt-1"><Briefcase className="w-3 h-3 flex-shrink-0" /><span className="truncate">{nom.designation}</span></div>
                  {nom.organisation && (
                    <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs mt-0.5"><Building2 className="w-3 h-3 flex-shrink-0" /><span className="truncate">{nom.organisation}</span></div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  {meta ? (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-50 text-gray-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-bold">Selected — {meta.label}</span>
                    </div>
                  ) : (
                    <div className="py-2 px-3 bg-[#EEF3FF] text-[#00338D] rounded-xl text-xs font-semibold text-center">
                      {disabled ? 'All ranks filled' : 'Tap to select'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {votingOpen && nominees.length >= 2 && !loading && (
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!allPicked}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#00338D] text-white rounded-xl font-bold text-sm hover:bg-[#002a73] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {allPicked ? <><Send className="w-4 h-4" /> Confirm My Vote</> : <>Pick {maxPicks} nominee{maxPicks !== 1 ? 's' : ''} to continue ({picks.length}/{maxPicks})</>}
        </button>
      )}
    </div>
  )
}
