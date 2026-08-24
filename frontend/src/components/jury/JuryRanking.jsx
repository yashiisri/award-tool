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

const CHOICE_STYLE = {
  first:  { label: '1st Choice', rank: 1, ring: 'ring-2 ring-amber-400', badge: 'bg-amber-500' },
  second: { label: '2nd Choice', rank: 2, ring: 'ring-2 ring-gray-400',  badge: 'bg-gray-500'  },
}

export default function JuryRanking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const awardFromUrl = searchParams.get('award')

  const [awardName, setAwardName] = useState('')
  const [nominees, setNominees] = useState([])
  const [firstChoice, setFirstChoice] = useState(null)
  const [secondChoice, setSecondChoice] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [votingOpen, setVotingOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (awardFromUrl) fetchData(awardFromUrl)
  }, [awardFromUrl])

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
        setFirstChoice(voteRes.data.first_choice)
        setSecondChoice(voteRes.data.second_choice)
        setSubmitted(true)
      } else {
        setFirstChoice(null)
        setSecondChoice(null)
        setSubmitted(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Tap a nominee: 1st empty -> fill 1st; then 2nd empty -> fill 2nd;
  // tapping an already-picked nominee again clears that pick.
  const handlePick = (nomineeId) => {
    if (!votingOpen || submitted) return
    if (firstChoice === nomineeId) { setFirstChoice(null); return }
    if (secondChoice === nomineeId) { setSecondChoice(null); return }
    if (!firstChoice) { setFirstChoice(nomineeId); return }
    if (!secondChoice) { setSecondChoice(nomineeId); return }
    // Both slots full and this nominee isn't in either — replace 2nd choice
    setSecondChoice(nomineeId)
  }

  const handleSubmit = async () => {
    if (!votingOpen || !awardFromUrl || !firstChoice || !secondChoice) return
    setSaving(true)
    try {
      await api.post('/jury/vote-top2', {
        award_id: awardFromUrl,
        first_choice: firstChoice,
        second_choice: secondChoice,
      })
      setConfirmOpen(false)
      await fetchData(awardFromUrl)
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to submit vote')
    } finally {
      setSaving(false)
    }
  }

  const firstNominee  = nominees.find(n => n.id === firstChoice)
  const secondNominee = nominees.find(n => n.id === secondChoice)

  // ── No award selected ─────────────────────────────────────────────────────────
  if (!awardFromUrl) {
    return (
      <div className="p-8">
        <PageHeader icon={Trophy} title="Jury Voting" subtitle="Pick your top 2 nominees" accent="#00338D" light="#EEF3FF" />
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF3FF] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-600 font-semibold text-sm mb-1">No award selected</p>
          <p className="text-gray-400 text-xs mb-6">Navigate to Award Categories and select an award to begin voting.</p>
          <button
            onClick={() => navigate('/jury/awards')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Awards
          </button>
        </div>
      </div>
    )
  }

  const bothPicked = firstChoice && secondChoice

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
            Thank you for your participation in the AIMA Managing India Awards 2025.
          </p>

          <div style={{ textAlign: 'left', border: '1px solid var(--border-light)', marginBottom: 28 }}>
            {[['1st Choice', firstNominee], ['2nd Choice', secondNominee]].map(([label, nom], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i === 0 ? '1px solid var(--border-light)' : 'none' }}>
                <RankMedal rank={i + 1} size={26} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
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
            onClick={() => navigate('/jury/awards')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#00338D] text-white rounded-none font-bold text-sm hover:bg-[#002a73] transition-all"
          >
            Back to Award Categories
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
              {[['1st Choice', firstNominee], ['2nd Choice', secondNominee]].map(([label, nom], i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i === 0 ? '1px solid var(--border-light)' : 'none' }}>
                  <RankMedal rank={i + 1} size={20} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
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
        title="Jury Voting"
        subtitle="Tap to pick your 1st and 2nd choice nominee"
        accent="#00338D"
        light="#EEF3FF"
      />

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/jury/nominees?award=${awardFromUrl}`)}
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

      {/* Voting closed banner */}
      {!votingOpen && !loading && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-700 text-sm">Voting for this award has not yet opened</p>
            <p className="text-gray-400 text-xs mt-0.5">You will be notified when voting begins.</p>
          </div>
        </div>
      )}

      {/* Picking instructions */}
      {votingOpen && !loading && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-[#EEF3FF] border border-[#00338D]/20 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">1</div>
            <span className="text-sm text-[#0A1628] font-medium">Tap your 1st choice</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs font-black flex items-center justify-center">2</div>
            <span className="text-sm text-[#0A1628] font-medium">Tap your 2nd choice</span>
          </div>
          <span className="text-gray-300">→</span>
          <span className="text-sm text-[#00338D] font-bold">Confirm</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && votingOpen && nominees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium text-sm">No nominees available for this award.</p>
        </div>
      )}

      {/* Nominee grid — tap to pick. Not shown at all while voting is locked. */}
      {!loading && votingOpen && nominees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
          {nominees.map(nom => {
            const choice = firstChoice === nom.id ? 'first' : secondChoice === nom.id ? 'second' : null
            const style = choice ? CHOICE_STYLE[choice] : null
            return (
              <div
                key={nom.id}
                onClick={() => handlePick(nom.id)}
                className={`bg-white border rounded-2xl overflow-hidden transition-all relative cursor-pointer hover:shadow-lg hover:-translate-y-0.5
                  ${style ? `border-transparent ${style.ring}` : 'border-gray-100'}
                `}
              >
                {style && (
                  <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-black shadow-md ${style.badge}`}>
                    <RankMedal rank={style.rank} size={16} /> {style.label}
                  </div>
                )}
                <div className="h-28 bg-gradient-to-br from-[#EEF3FF] to-[#dce8f5] flex items-center justify-center relative">
                  {nom.photo_url && (
                    <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  )}
                  <div className="w-14 h-14 bg-[#00338D] rounded-full items-center justify-center" style={{ display: nom.photo_url ? 'none' : 'flex' }}>
                    <span className="text-white text-xl font-black">{nom.name?.[0]}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-[#1a1a2e] text-sm mb-1">{nom.name}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5"><Briefcase className="w-3 h-3" />{nom.designation}</div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4"><Building2 className="w-3 h-3" />{nom.organisation}</div>
                  {style ? (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-gray-50 text-gray-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-bold">Selected — {style.label}</span>
                    </div>
                  ) : (
                    <div className="py-2 px-3 bg-[#EEF3FF] text-[#00338D] rounded-xl text-xs font-semibold text-center">
                      Tap to select
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm */}
      {votingOpen && nominees.length > 0 && !loading && (
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!bothPicked}
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#00338D] text-white rounded-xl font-bold text-sm hover:bg-[#002a73] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {bothPicked ? <><Send className="w-4 h-4" /> Confirm My Vote</> : <>Pick 2 nominees to continue</>}
        </button>
      )}
    </div>
  )
}
