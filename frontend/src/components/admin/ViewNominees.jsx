import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, Plus, Trash2, X, Sparkles, AlertTriangle,
  ChevronDown, Building2, Briefcase,
  CheckCircle, Loader2, Brain,
  FileText, Flag, ShieldCheck, ShieldOff, Printer
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from './NomineeProfileCard'
import DossierModal from './DossierModal'

// ── AI Results Preview Modal ──────────────────────────────────────────────────
function AIResultsModal({ results, onConfirm, onClose, saving }) {
  const [selected, setSelected] = useState(() => new Set(results.map((_, i) => i)))
  const toggle = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00338D] to-[#00338D] rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0A1628]">AI Nominee Suggestions</h2>
              <p className="text-xs text-gray-400">{results.length} candidates found — select to add</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {results.map((nom, i) => {
            const isSelected = selected.has(i)
            const sources = nom.rationale_data?.source_links || nom.sources || []
            const reason = nom.rationale_data?.relevance_reason || ''
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-[#00338D] bg-[#EEF2FA]' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00338D] to-[#00338D] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {nom.photo_url && (
                      <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    )}
                    <span className="text-white text-lg font-black" style={{ display: nom.photo_url ? 'none' : 'flex' }}>{nom.name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#0A1628] text-sm">{nom.name}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#00338D]" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{nom.designation}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{nom.organisation}</span>
                    </div>
                    {reason && <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">{reason}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sources.slice(0, 3).map((s, si) => (
                        <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] text-[#00338D] text-xs rounded font-medium border border-[#00338D]/10">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-gray-400">{selected.size} of {results.length} selected</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            <button
              onClick={() => onConfirm(results.filter((_, i) => selected.has(i)))}
              disabled={selected.size === 0 || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : `Add ${selected.size} Nominee${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ViewNominees() {
  const [searchParams] = useSearchParams()
  const preselectedAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preselectedAward || '')
  const [nominees, setNominees] = useState([])
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDossier, setShowDossier] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState(null)
  const [aiSaving, setAiSaving] = useState(false)
  const [aiError, setAiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({}) // { nomineeId: 'validate'|'flag'|'unflag'|'delete' }

  const [form, setForm] = useState({ name: '', designation: '', organisation: '' })

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])

  // While a newly-added nominee's profile is still being built, poll so its
  // card (photo, rationale) fills in without the admin refreshing manually.
  useEffect(() => {
    if (!nominees.some(n => n.enrichment_status === 'pending')) return
    const id = setInterval(fetchNominees, 4000)
    return () => clearInterval(id)
  }, [selectedAward, nominees])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) }
    catch (err) { console.error(err) }
  }

  const fetchNominees = async () => {
    try { const { data } = await api.get(`/admin/nominees/${selectedAward}`); setNominees(data) }
    catch (err) { console.error(err) }
  }

  const setLoaderFor = (id, action) => setActionLoading(prev => ({ ...prev, [id]: action }))
  const clearLoaderFor = (id) => setActionLoading(prev => { const next = { ...prev }; delete next[id]; return next })

  const handleAdd = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/nominees/suggest', { ...form, award_id: selectedAward })
      setShowAddModal(false)
      setForm({ name: '', designation: '', organisation: '' })
      fetchNominees()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee permanently?')) return
    setLoaderFor(id, 'delete')
    try { await api.delete(`/admin/nominees/${id}`); fetchNominees() }
    catch (err) { console.error(err) }
    finally { clearLoaderFor(id) }
  }

  const handleValidate = async (id) => {
    setLoaderFor(id, 'validate')
    try { await api.post(`/admin/nominees/${id}/validate`); fetchNominees() }
    catch (err) { console.error(err) }
    finally { clearLoaderFor(id) }
  }

  const handleFlag = async (id) => {
    const reason = prompt('Enter reason for flagging this nominee:')
    if (!reason?.trim()) return
    setLoaderFor(id, 'flag')
    try { await api.post('/admin/red-flag', { nominee_id: id, reason }); fetchNominees() }
    catch (err) { console.error(err) }
    finally { clearLoaderFor(id) }
  }

  const handleUnflag = async (id) => {
    setLoaderFor(id, 'unflag')
    try { await api.post(`/admin/nominees/${id}/unflag`); fetchNominees() }
    catch (err) { console.error(err) }
    finally { clearLoaderFor(id) }
  }

  const handleAISearch = async () => {
    if (!selectedAward) return
    setAiLoading(true); setAiError('')
    try {
      const award = awards.find(a => a.id === selectedAward)
      // Call the new v2 AI search engine — saves directly to DB
      await api.post(`/admin/awards/${selectedAward}/ai-search`, {
        award_id:            selectedAward,
        award_name:          award?.name || '',
        award_description:   award?.description || '',
        num_nominees:        award?.num_nominees || 5,
        evaluation_criteria: award?.criteria || [],
      })
      // Nominees saved directly to DB — just refresh the list
      fetchNominees()
    } catch (err) {
      const raw = err.response?.data?.detail
      let msg = 'AI search failed. Please try again.'
      if (typeof raw === 'string') {
        if (raw.toLowerCase().includes('rate limit') || raw.toLowerCase().includes('token')) {
          msg = 'AI quota reached for today. The limit resets at midnight UTC. You can add nominees manually in the meantime, or try again tomorrow.'
        } else if (raw.toLowerCase().includes('groq_key') || raw.toLowerCase().includes('api key')) {
          msg = 'AI service not configured. Please add your GROQ_KEY to the backend .env file.'
        } else if (raw.toLowerCase().includes('no candidates') || raw.toLowerCase().includes('not found')) {
          msg = 'No candidates found for this award. Try adding more detail to the award description.'
        } else {
          msg = raw
        }
      } else if (Array.isArray(raw)) {
        msg = raw.map(e => e.msg || String(e)).join(', ')
      }
      setAiError(msg)
    } finally { setAiLoading(false) }
  }

  const handleConfirmAIResults = async (selected) => {
    setAiSaving(true)
    try {
      for (const nom of selected) {
        await api.post('/admin/nominees', {
          name: nom.name, designation: nom.designation,
          organisation: nom.organisation, photo_url: nom.photo_url || '',
          rationale: nom.rationale, award_id: selectedAward,
        })
      }
      setAiResults(null); fetchNominees()
    } catch (err) { console.error(err) }
    finally { setAiSaving(false) }
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader
        icon={Users}
        title="Nominees"
        subtitle="Manage, approve, and review nominees for each award"
        accent="#00338D"
        light="#EEF2FA"
        action={
          <div className="flex gap-2 flex-wrap">
            {selectedAward && nominees.length > 0 && (
              <button
                onClick={() => setShowDossier(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#00338D] rounded-xl font-semibold text-sm hover:bg-[#EEF2FA] hover:border-[#00338D]/30 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" /> Generate Dossier
              </button>
            )}
            {selectedAward && (
              <>
                <button
                  onClick={handleAISearch}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00338D] to-[#00338D] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
                >
                  {aiLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                    : <><Sparkles className="w-4 h-4" /> AI Search</>
                  }
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Nominee
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Award selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
        <div className="relative w-full max-w-sm">
          <select
            value={selectedAward}
            onChange={e => setSelectedAward(e.target.value)}
            className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm shadow-sm pr-10"
          >
            <option value="">Choose an award</option>
            {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Award info banner */}
      {currentAward && (
        <div className="mb-6 p-4 bg-[#EEF2FA] border border-[#00338D]/15 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 bg-[#00338D] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#00338D] text-sm">{currentAward.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{currentAward.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[#00338D] text-sm font-bold">{nominees.length} <span className="font-normal text-gray-500">/ {currentAward.num_nominees}</span></p>
            <p className="text-gray-400 text-xs">nominees</p>
          </div>
        </div>
      )}

      {/* AI loading */}
      {aiLoading && (
        <div className="mb-6 p-5 bg-[#EEF2FF] border border-[#00338D]/15 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00338D] rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0A1628] text-sm">AI research engine running...</p>
            <p className="text-[#6B7A8D] text-xs mt-0.5">
              Classifying award → Generating candidates → Enriching from Wikipedia &amp; Forbes → Building dossiers
            </p>
          </div>
          <Loader2 className="w-5 h-5 text-[#00338D] animate-spin flex-shrink-0" />
        </div>
      )}

      {/* AI error */}
      {aiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-700 text-sm">AI Search Failed</p>
            <p className="text-red-600 text-xs mt-0.5">{aiError}</p>
          </div>
          <button onClick={() => setAiError('')} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Nominees grid */}
      {nominees.length === 0 && selectedAward ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold text-sm mb-1">No nominees yet</p>
          <p className="text-gray-400 text-xs">Use AI Search or add manually to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {nominees.map(nom => {
            const busy = actionLoading[nom.id]
            const isApproved = nom.validated
            const isFlagged = nom.red_flagged
            const isPending = nom.enrichment_status === 'pending'

            return (
              <div
                key={nom.id}
                className={`group bg-white border rounded-2xl overflow-hidden transition-all shadow-sm ${
                  isFlagged ? 'border-red-200' : isApproved ? 'border-emerald-200' : 'border-gray-100 hover:border-[#00338D]/25 hover:shadow-lg'
                }`}
              >
                {/* Header band + circular photo */}
                <div className="pt-4 pb-4 px-5 bg-gradient-to-b from-[#EEF2FA] to-white text-center">
                  {/* Status badges — normal flow, above the circle, never overlapping it */}
                  {(isApproved || isFlagged || isPending) && (
                    <div className="flex items-center justify-between gap-1 mb-3">
                      <span>
                        {isApproved && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </span>
                      <span>
                        {isFlagged && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                        {isPending && !isFlagged && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00338D] text-white text-xs font-semibold rounded-full shadow-sm">
                            <Loader2 className="w-3 h-3 animate-spin" /> Building profile
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-20 h-20 rounded-full mx-auto overflow-hidden cursor-pointer relative ring-4 ring-white ${nom.photo_url ? 'shadow-md' : ''}`}
                    style={{ background: nom.photo_url ? 'linear-gradient(135deg, #00338D, #0057D9)' : '#E2E5EA' }}
                    onClick={() => setSelectedNominee(nom)}
                  >
                    {nom.photo_url && (
                      <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                    )}
                    <div className="w-full h-full items-center justify-center absolute inset-0" style={{ display: nom.photo_url ? 'none' : 'flex' }}>
                      <span className="text-[#6B7280] text-lg font-semibold">{nom.name?.[0]}</span>
                    </div>
                  </div>

                  <h3
                    className="mt-3 font-bold text-[#0A1628] text-[15px] leading-snug cursor-pointer hover:text-[#00338D] transition-colors line-clamp-1"
                    onClick={() => setSelectedNominee(nom)}
                  >
                    {nom.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{nom.designation}{nom.organisation ? ` · ${nom.organisation}` : ''}</p>
                </div>

                <div className="px-4 pb-4">
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 min-h-[2.2em] text-center">
                    {nom.rationale || (isPending ? 'Researching biography and rationale…' : '')}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 pt-3 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                    {/* Approve */}
                    {!isApproved ? (
                      <button
                        onClick={() => handleValidate(nom.id)}
                        disabled={!!busy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#00338D] bg-[#EEF2FA] border border-[#00338D]/20 rounded-lg hover:bg-[#00338D] hover:text-white hover:border-[#00338D] transition-all disabled:opacity-50"
                        title="Approve nominee"
                      >
                        {busy === 'validate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-lg cursor-default">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </div>
                    )}

                    {/* Flag / Unflag */}
                    {isFlagged ? (
                      <button
                        onClick={() => handleUnflag(nom.id)}
                        disabled={!!busy}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-50"
                        title="Clear flag"
                      >
                        {busy === 'unflag' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFlag(nom.id)}
                        disabled={!!busy}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-50"
                        title="Flag nominee"
                      >
                        {busy === 'flag' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(nom.id)}
                      disabled={!!busy}
                      className="flex items-center justify-center px-3 py-2 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
                      title="Remove nominee"
                    >
                      {busy === 'delete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dossier Modal */}
      {showDossier && currentAward && (
        <DossierModal
          award={currentAward}
          nominees={nominees}
          onClose={() => setShowDossier(false)}
        />
      )}

      {/* AI Results Preview Modal */}
      {aiResults && (
        <AIResultsModal
          results={aiResults}
          onConfirm={handleConfirmAIResults}
          onClose={() => setAiResults(null)}
          saving={aiSaving}
        />
      )}

      {/* Nominee Profile Modal */}
      {selectedNominee && (
        <NomineeProfileCard nominee={selectedNominee} award={currentAward} awardName={currentAward?.name} onClose={() => setSelectedNominee(null)} />
      )}

      {/* Add Nominee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-[#0A1628]">Add Nominee</h2>
                <p className="text-xs text-gray-400 mt-0.5">Just the name and role — we'll build their profile for you</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Roshni Nadar Malhotra', required: true },
                { label: 'Designation', key: 'designation', placeholder: 'e.g. Chairperson', required: true },
                { label: 'Organisation (optional)', key: 'organisation', placeholder: 'e.g. HCLTech', required: false },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm"
                    placeholder={placeholder}
                    required={required}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400 leading-relaxed bg-[#EEF2FA] rounded-xl px-4 py-3">
                Their photo, biography and selection rationale are researched and generated automatically once you submit.
              </p>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                  {loading ? 'Adding...' : 'Add Nominee'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
