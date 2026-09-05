import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users, Plus, Trash2, X, FileText,
  ChevronDown, Award, ArrowRight, CheckCircle, Lock, Check
} from 'lucide-react'
import api from '../../api/axios'
import NomineeProfileCard from '../admin/NomineeProfileCard'
import NomineeGridCard from '../admin/NomineeGridCard'
import DossierModal from '../admin/DossierModal'
import PageContextBar from '../layout/PageContextBar'

const ACCENT = 'var(--kpmg-blue)'
const LIGHT = '#EEF3FF'

export default function HJNominees() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preAward || '')
  const [nominees, setNominees] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDossier, setShowDossier] = useState(false)
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [form, setForm] = useState({ name: '', designation: '', organisation: '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('all') // 'all' | 'pending'
  const [confirming, setConfirming] = useState(false)
  const [showLockedNotice, setShowLockedNotice] = useState(false)

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])
  useEffect(() => { setShowLockedNotice(false) }, [selectedAward])

  // While any suggested nominee is still being enriched, poll so its card
  // fills in (photo/designation/etc.) without the user refreshing manually.
  useEffect(() => {
    if (!nominees.some(n => n.enrichment_status === 'pending')) return
    const id = setInterval(fetchNominees, 4000)
    return () => clearInterval(id)
  }, [selectedAward, nominees])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/head-jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchNominees = async () => {
    try {
      const { data } = await api.get(`/head-jury/nominees/${selectedAward}`)
      setNominees(data)
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee from the award?')) return
    try { await api.delete(`/head-jury/nominees/${id}`); fetchNominees() } catch (e) {}
  }

  const handleFlag = async (nomineeId, reason) => {
    await api.post('/head-jury/red-flag', { nominee_id: nomineeId, reason })
    await fetchNominees()
    setSelectedNominee(prev => prev && { ...prev, red_flagged: true, red_flag_reason: reason })
  }

  const handleValidate = async (nomineeId) => {
    await api.post('/head-jury/validate-nominee', { nominee_id: nomineeId })
    await Promise.all([fetchNominees(), fetchAwards()])
    setSelectedNominee(prev => prev && { ...prev, validated_by: [...(prev.validated_by || []), 'you'] })
  }

  const toggleConfirm = async () => {
    if (!selectedAward || confirming) return
    setConfirming(true)
    try {
      await api.post('/jury/confirm-nominations', { award_id: selectedAward })
      await fetchAwards()
    } catch (e) {} finally { setConfirming(false) }
  }

  const handleSuggest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/jury/suggest-nominee', { ...form, award_id: selectedAward })
      setShowAddModal(false)
      setForm({ name: '', designation: '', organisation: '' })
      fetchNominees()
    } catch (e) {} finally { setLoading(false) }
  }

  const currentAward = awards.find(a => a.id === selectedAward)
  const isPendingApproval = n => n.suggested_by && (n.validated_by?.length || 0) === 0
  const pendingCount = nominees.filter(isPendingApproval).length
  const visibleNominees = tab === 'pending' ? nominees.filter(isPendingApproval) : nominees

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Inter', sans-serif" }}>
      <PageContextBar
        breadcrumb={currentAward ? ['Awards', currentAward.name, 'Nominees'] : ['Awards', 'Nominees']}
        helpText="You can approve or decline jury-suggested nominees here. Approved nominees enter the ballot immediately. You can also suggest nominees yourself."
      />
      <div style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold-bright)', fontWeight: 700 }}>
              AIMA · Head Jury Portal
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 600, color: 'var(--kpmg-navy)', letterSpacing: '-0.01em', margin: 0 }}>
            Nominees
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Suggest a name — their profile is built for you
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
            <button onClick={() => setShowAddModal(true)} style={{
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

      {currentAward && (
        <div style={{ marginBottom: 22, padding: '14px 18px', borderRadius: 8, background: LIGHT, borderLeft: `3px solid var(--gold)`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Award size={17} color={ACCENT} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, color: ACCENT, fontSize: 13, margin: 0 }}>{currentAward.name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: 0 }}>{currentAward.description}</p>
          </div>
        </div>
      )}

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

      {selectedAward && nominees.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[['all', `All Nominees (${nominees.length})`], ['pending', `Pending Approval (${pendingCount})`]].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)} style={{
              padding: '7px 14px', borderRadius: 6, border: `1px solid ${tab === val ? ACCENT : 'var(--border)'}`,
              background: tab === val ? ACCENT : '#fff', color: tab === val ? '#fff' : 'var(--text-secondary)',
              fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {nominees.length === 0 && selectedAward ? (
        <div style={{ padding: '72px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={32} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>No nominees for this award yet.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Use Suggest Nominee to name the first candidate — their profile is built for you.</p>
        </div>
      ) : tab === 'pending' && visibleNominees.length === 0 ? (
        <div style={{ padding: '72px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border-light)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={32} color="var(--gold)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Nothing pending approval.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {visibleNominees.map(nom => (
            <NomineeGridCard
              key={nom.id}
              nominee={nom}
              awardName={currentAward?.name}
              onClick={() => setSelectedNominee(nom)}
              actions={<>
                {isPendingApproval(nom) && (
                  <button onClick={(e) => { e.stopPropagation(); handleValidate(nom.id) }} title="Approve nominee" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 5,
                    padding: '9px', background: '#fff', color: '#15803D', border: '1px solid #A7D9BE',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#15803D' }}>
                    <CheckCircle size={13} /> Approve
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(nom.id) }} title="Remove / decline nominee" style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 5,
                  padding: '9px', background: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border-light)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)' }}>
                  <Trash2 size={13} /> {isPendingApproval(nom) ? 'Decline' : 'Remove'}
                </button>
              </>}
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
          role="head_jury"
          onValidate={handleValidate}
          onFlag={handleFlag}
          onClose={() => setSelectedNominee(null)}
        />
      )}

      {/* Suggest Nominee modal */}
      {showAddModal && (
        <div style={overlaySt} onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div style={modalSt}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `2px solid ${ACCENT}` }}>
              <div>
                <h2 style={modalTitleSt}>Suggest Nominee</h2>
                <p style={modalSubSt}>Just the name and role — we'll build their profile for you</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={closeBtnSt}><X size={16} /></button>
            </div>
            <form onSubmit={handleSuggest} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Full Name', 'name', 'e.g. Roshni Nadar Malhotra', true],
                ['Designation', 'designation', 'e.g. Chairperson', true],
                ['Organisation (optional)', 'organisation', 'e.g. HCLTech', false],
              ].map(([label, key, ph, req]) => (
                <div key={key}>
                  <label style={labelSt}>{label}</label>
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={inputSt} placeholder={ph} required={req}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" disabled={loading} style={{ ...primaryBtnSt('var(--kpmg-blue)', loading), flex: 1 }}>
                  {loading ? 'Submitting…' : 'Suggest Nominee'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} style={secondaryBtnSt}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proceed to voting — locked until the award's voting phase opens;
          tapping while locked reveals why instead of navigating away. */}
      {selectedAward && nominees.length > 0 && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {showLockedNotice && !currentAward?.voting_open && (
            <div style={{ padding: '10px 16px', background: 'var(--kpmg-navy)', color: '#fff', fontSize: 12, maxWidth: 260, textAlign: 'right', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
              Voting is closed for this award.
            </div>
          )}
          <button
            onClick={() => {
              if (currentAward?.voting_open) navigate(`/head_jury/voting?award=${selectedAward}`)
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
const modalSt = { background: '#fff', borderRadius: 10, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,20,60,0.2)', animation: 'modalIn 0.2s ease' }
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
