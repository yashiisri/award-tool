import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users, X, Plus, FileText,
  ChevronDown, Award, ArrowRight, CheckCircle, Lock, Check
} from 'lucide-react'
import api from '../../api/axios'
import NomineeProfileCard from '../admin/NomineeProfileCard'
import NomineeGridCard from '../admin/NomineeGridCard'
import DossierModal from '../admin/DossierModal'
import PageContextBar from '../layout/PageContextBar'

const ACCENT = 'var(--kpmg-blue)'
const LIGHT = '#EEF3FF'

export default function JuryNominees() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preAward || '')
  const [nominees, setNominees] = useState([])
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [showDossier, setShowDossier] = useState(false)
  const [suggestForm, setSuggestForm] = useState({ name: '', designation: '', organisation: '' })
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showLockedNotice, setShowLockedNotice] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])
  useEffect(() => { setShowLockedNotice(false) }, [selectedAward])

  const toggleConfirm = async () => {
    if (!selectedAward || confirming) return
    setConfirming(true)
    try {
      await api.post('/jury/confirm-nominations', { award_id: selectedAward })
      await fetchAwards()
    } catch (e) {} finally { setConfirming(false) }
  }

  // While any suggested nominee is still being enriched, poll so its card
  // fills in without the user refreshing manually.
  useEffect(() => {
    if (!nominees.some(n => n.enrichment_status === 'pending')) return
    const id = setInterval(fetchNominees, 4000)
    return () => clearInterval(id)
  }, [selectedAward, nominees])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchNominees = async () => {
    try {
      const { data } = await api.get(`/jury/awards/${selectedAward}/nominees`)
      setNominees(data)
    } catch (e) {}
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    setSuggestLoading(true)
    try {
      await api.post('/jury/suggest-nominee', { ...suggestForm, award_id: selectedAward })
      setShowSuggestModal(false)
      setSuggestForm({ name: '', designation: '', organisation: '' })
      fetchNominees()
      fetchAwards()
    } catch (e) {} finally { setSuggestLoading(false) }
  }

  const handleComment = async (nomineeId, text) => {
    await api.post('/jury/comment', { nominee_id: nomineeId, award_id: selectedAward, comment: text })
  }

  const handleFlag = async (nomineeId, reason) => {
    await api.post('/jury/flag-nominee', { nominee_id: nomineeId, reason })
    await fetchNominees()
    setSelectedNominee(prev => prev && { ...prev, red_flagged: true, red_flag_reason: reason })
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageContextBar
        breadcrumb={currentAward ? ['Awards', currentAward.name, 'Nominees'] : ['Awards', 'Nominees']}
        helpText="Review each nominee's profile before voting. Use &quot;Download Dossier&quot; for a full PDF report. Click &quot;+ Suggest Nominee&quot; to add someone you believe deserves recognition."
      />
      <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
              AIMA · Jury Portal
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
            Nominees
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Review nominees, or suggest a name — their profile is built for you
          </p>
        </div>
        {selectedAward && (
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {nominees.length > 0 && (
              <button onClick={() => setShowDossier(true)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 6,
                background: '#fff', color: 'var(--kpmg-blue)', border: '1px solid var(--kpmg-blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--kpmg-blue)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--kpmg-blue)' }}>
                <FileText size={13} /> Download Dossier
              </button>
            )}
            <button onClick={() => setShowSuggestModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 6,
              background: 'var(--kpmg-blue)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--kpmg-navy)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--kpmg-blue)'}>
              <Plus size={13} /> Suggest Nominee
            </button>
          </div>
        )}
      </div>
      <div style={{ height: 1, background: 'var(--border-light)', marginBottom: 28 }} />

      {/* Award selector */}
      {!preAward && (
        <div style={{ marginBottom: 22 }}>
          <label style={labelSt}>Select Award</label>
          <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
            <select value={selectedAward} onChange={e => setSelectedAward(e.target.value)} style={selectSt}>
              <option value="">Choose an award</option>
              {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        </div>
      )}

      {/* Award context pill */}
      {currentAward && (
        <div style={{ marginBottom: 22, padding: '14px 18px', borderRadius: 8, background: LIGHT, borderLeft: `3px solid var(--gold)`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Award size={17} color={ACCENT} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, color: ACCENT, fontSize: 13, margin: 0 }}>{currentAward.name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: 0 }}>{currentAward.description}</p>
          </div>
        </div>
      )}

      {/* Nomination / voting phase status */}
      {currentAward && (
        <div style={{
          marginBottom: 22, padding: '14px 18px', borderRadius: 8,
          background: currentAward.voting_open ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${currentAward.voting_open ? '#BBF7D0' : '#FDE68A'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentAward.voting_open
              ? <CheckCircle size={16} color="#15803D" style={{ flexShrink: 0 }} />
              : <Lock size={16} color="#B45309" style={{ flexShrink: 0 }} />}
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: currentAward.voting_open ? '#15803D' : '#B45309' }}>
              {currentAward.voting_open ? 'Voting Open' : 'Voting Closed'}
            </p>
          </div>
          {!currentAward.voting_open && (
            <button onClick={toggleConfirm} disabled={confirming} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: currentAward.my_confirmed ? '#FEF3C7' : '#fff', color: '#92400E',
              border: '1px solid #FDE68A', fontSize: 11.5, fontWeight: 600,
              cursor: confirming ? 'not-allowed' : 'pointer', flexShrink: 0,
            }}>
              {currentAward.my_confirmed ? <><Check size={12} /> You've Confirmed</> : 'Confirm Nominations'}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {nominees.length === 0 && selectedAward ? (
        <div style={{ padding: '72px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={32} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>No nominees for this award yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Use Suggest Nominee to name the first candidate — their profile is built for you.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {nominees.map(nom => (
            <NomineeGridCard
              key={nom.id}
              nominee={nom}
              awardName={currentAward?.name}
              onClick={() => setSelectedNominee(nom)}
            />
          ))}
        </div>
      )}

      {showDossier && currentAward && (
        <DossierModal
          award={currentAward}
          nominees={nominees}
          onClose={() => setShowDossier(false)}
        />
      )}

      {selectedNominee && (
        <NomineeProfileCard
          nominee={selectedNominee}
          award={currentAward}
          awardName={currentAward?.name}
          role="jury"
          onComment={handleComment}
          onFlag={handleFlag}
          onClose={() => setSelectedNominee(null)}
        />
      )}

      {/* Suggest Nominee modal */}
      {showSuggestModal && (
        <div style={overlaySt} onClick={e => { if (e.target === e.currentTarget) setShowSuggestModal(false) }}>
          <div style={modalSt}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `2px solid ${ACCENT}` }}>
              <div>
                <h2 style={modalTitleSt}>Suggest Nominee</h2>
                <p style={modalSubSt}>Just the name and role — we'll build their profile for you</p>
              </div>
              <button onClick={() => setShowSuggestModal(false)} style={closeBtnSt}><X size={16} /></button>
            </div>
            <form onSubmit={handleSuggest} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Full Name', 'name', 'e.g. Roshni Nadar Malhotra', true],
                ['Designation', 'designation', 'e.g. Chairperson', true],
                ['Organisation (optional)', 'organisation', 'e.g. HCLTech', false],
              ].map(([label, key, ph, req]) => (
                <div key={key}>
                  <label style={labelSt}>{label}</label>
                  <input type="text" value={suggestForm[key]} onChange={e => setSuggestForm({ ...suggestForm, [key]: e.target.value })}
                    style={inputSt} placeholder={ph} required={req}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" disabled={suggestLoading} style={{ ...primaryBtnSt(ACCENT, suggestLoading), flex: 1 }}>
                  {suggestLoading ? 'Submitting…' : 'Suggest Nominee'}
                </button>
                <button type="button" onClick={() => setShowSuggestModal(false)} style={secondaryBtnSt}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proceed to voting — locked until nominations_ready; tapping while locked
          reveals why instead of navigating away. */}
      {selectedAward && nominees.length > 0 && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {showLockedNotice && !currentAward?.voting_open && (
            <div style={{ padding: '10px 16px', background: 'var(--kpmg-navy)', color: '#fff', fontSize: 12, maxWidth: 260, textAlign: 'right', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
              Voting is closed for this award.
            </div>
          )}
          <button
            onClick={() => {
              if (currentAward?.voting_open) navigate(`/jury/ranking?award=${selectedAward}`)
              else setShowLockedNotice(v => !v)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 22px',
              background: currentAward?.voting_open ? 'var(--kpmg-blue)' : '#9BA8B5',
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 12px 32px rgba(0,51,141,0.28)', transition: 'background 0.15s',
            }}
          >
            {currentAward?.voting_open ? (
              <>
                Proceed to Voting
                <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight size={13} />
                </div>
              </>
            ) : (
              <><Lock size={13} /> Voting Closed</>
            )}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}

const labelSt = { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }
const selectSt = { width: '100%', appearance: 'none', padding: '10px 34px 10px 14px', borderRadius: 6, background: '#fff', border: '1px solid var(--border)', borderLeft: `2px solid ${ACCENT}`, fontSize: 13, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }
const overlaySt = { position: 'fixed', inset: 0, background: 'rgba(0,20,60,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, animation: 'fadeIn 0.15s ease' }
const modalSt = { background: '#fff', borderRadius: 10, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,20,60,0.2)', animation: 'modalIn 0.2s ease', overflow: 'hidden' }
const modalTitleSt = { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: 'var(--kpmg-navy)', margin: 0 }
const modalSubSt = { color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }
const closeBtnSt = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }
const inputSt = { width: '100%', padding: '10px 12px', background: '#fff', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit' }
const secondaryBtnSt = { padding: '10px 18px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }
const primaryBtnSt = (color, loading) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '10px', background: loading ? '#9BA8B5' : color, color: '#fff', border: 'none',
  fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.03em',
})
