import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users, Plus, Trash2, X, Sparkles, AlertTriangle,
  ChevronDown, Building2, Briefcase,
  CheckCircle, Loader2, Brain, BarChart3
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from './NomineeProfileCard'

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color =
    pct >= 85 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    pct >= 65 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-amber-100 text-amber-700 border-amber-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      <BarChart3 className="w-3 h-3" /> {pct}% match
    </span>
  )
}

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#7F3F98] to-[#0091DA] rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1a1a2e]">Nominee Suggestions</h2>
              <p className="text-xs text-gray-400">{results.length} candidates found · select to add</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {results.map((nom, i) => {
            const isSelected = selected.has(i)
            const sources = nom.rationale_data?.source_links || nom.sources || []
            const wikiUrl = nom.rationale_data?.wikipedia_url || ''
            const score = nom.rationale_data?.confidence_score ?? 0
            const reason = nom.rationale_data?.relevance_reason || ''

            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#00338D] bg-[#EEF2FA]'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00338D] to-[#0091DA] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {nom.photo_url ? (
                      <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <span className="text-white text-lg font-black">{nom.name?.[0]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-[#1a1a2e] text-sm">{nom.name}</span>
                      <ConfidenceBadge score={score} />
                      {isSelected && <CheckCircle className="w-4 h-4 text-[#00338D]" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{nom.designation}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{nom.organisation}</span>
                    </div>
                    {reason && (
                      <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">{reason}</p>
                    )}
                    {/* Source tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sources.slice(0, 3).map((s, si) => (
                        <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FF] text-[#00338D] text-xs rounded font-medium border border-[#00338D]/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-gray-400">{selected.size} of {results.length} selected</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              Cancel
            </button>
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
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState(null)   // preview modal data
  const [aiSaving, setAiSaving] = useState(false)
  const [aiError, setAiError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ name: '', designation: '', organisation: '', photo_url: '', rationale: '' })

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) }
    catch (err) { console.error(err) }
  }

  const fetchNominees = async () => {
    try { const { data } = await api.get(`/admin/nominees/${selectedAward}`); setNominees(data) }
    catch (err) { console.error(err) }
  }

  const handleAdd = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/nominees', { ...form, award_id: selectedAward })
      setShowAddModal(false)
      setForm({ name: '', designation: '', organisation: '', photo_url: '', rationale: '' })
      fetchNominees()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee?')) return
    try { await api.delete(`/admin/nominees/${id}`); fetchNominees() }
    catch (err) { console.error(err) }
  }

  // ── AI Search ───────────────────────────────────────────────────────────────
  const handleAISearch = async () => {
    if (!selectedAward) return
    setAiLoading(true)
    setAiError('')
    try {
      const award = awards.find(a => a.id === selectedAward)
      const { data } = await api.post('/admin/ai-search-nominees', {
        award_id: selectedAward,
        num_results: award?.num_nominees || 5,
      })
      setAiResults(data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI search failed. Please try again.'
      setAiError(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const handleConfirmAIResults = async (selected) => {
    setAiSaving(true)
    try {
      for (const nom of selected) {
        await api.post('/admin/nominees', {
          name: nom.name,
          designation: nom.designation,
          organisation: nom.organisation,
          photo_url: nom.photo_url || '',
          rationale: nom.rationale,
          award_id: selectedAward,
        })
      }
      setAiResults(null)
      fetchNominees()
    } catch (err) {
      console.error('Failed to save AI nominees:', err)
    } finally {
      setAiSaving(false)
    }
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader
        icon={Users}
        title="View Nominees"
        subtitle="Manage nominees for each award"
        accent="#00338D"
        light="#EEF2FA"
        action={
          <div className="flex gap-2">
            {selectedAward && (
              <>
                <button
                  onClick={handleAISearch}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7F3F98] to-[#0091DA] text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
                >
                  {aiLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                    : <><Sparkles className="w-4 h-4" /> AI Search Nominees</>
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
          <div>
            <p className="font-bold text-[#00338D] text-sm">{currentAward.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{currentAward.description}</p>
            <p className="text-[#00338D] text-xs mt-1 font-medium">
              Target: {currentAward.num_nominees} nominees · {nominees.length} added
            </p>
          </div>
        </div>
      )}

      {/* AI loading state */}
      {aiLoading && (
        <div className="mb-6 p-5 bg-[#EEF2FF] border border-[#00338D]/15 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00338D] rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0A1628] text-sm">Searching verified sources...</p>
            <p className="text-[#6B7A8D] text-xs mt-0.5">
              Scraping business news, rankings &amp; award databases · Ranking with AI · Fetching profile photos
            </p>
          </div>
          <Loader2 className="w-5 h-5 text-[#00338D] animate-spin flex-shrink-0" />
        </div>
      )}

      {/* AI error */}
      {aiError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">AI Search Failed</p>
            <p className="text-red-600 text-xs mt-0.5">{aiError}</p>
          </div>
          <button onClick={() => setAiError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nominees grid */}
      {nominees.length === 0 && selectedAward ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold mb-1">No nominees yet</p>
          <p className="text-gray-400 text-sm">Use AI Search or add manually.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {nominees.map(nom => (
            <div
              key={nom.id}
              className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                nom.red_flagged ? 'border-red-200' : 'border-gray-100 hover:border-[#00338D]/20'
              }`}
              onClick={() => setSelectedNominee(nom)}
            >
              {/* Photo */}
              <div className="h-32 bg-gradient-to-br from-[#EEF2FA] to-[#dce8f5] flex items-center justify-center relative">
                {nom.photo_url ? (
                  <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-16 h-16 bg-[#00338D] rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-black">{nom.name?.[0]}</span>
                  </div>
                )}
                {nom.red_flagged && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-lg font-medium">
                    <AlertTriangle className="w-3 h-3" /> Flagged
                  </div>
                )}
                {nom.ai_generated && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#7F3F98] to-[#0091DA] text-white text-xs rounded-lg font-medium">
                    <Sparkles className="w-3 h-3" /> AI
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-black text-[#1a1a2e] text-sm mb-1">{nom.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                  <Briefcase className="w-3 h-3" /> {nom.designation}
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                  <Building2 className="w-3 h-3" /> {nom.organisation}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{nom.rationale}</p>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleDelete(nom.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
        <NomineeProfileCard nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />
      )}

      {/* Add Nominee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-[#1a1a2e]">Add Nominee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. Roshni Nadar Malhotra' },
                { label: 'Designation', key: 'designation', placeholder: 'e.g. Chairperson' },
                { label: 'Organisation', key: 'organisation', placeholder: 'e.g. HCLTech' },
                { label: 'Photo URL (optional)', key: 'photo_url', placeholder: 'https://...' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm"
                    placeholder={placeholder}
                    required={key !== 'photo_url'}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rationale</label>
                <textarea
                  value={form.rationale}
                  onChange={e => setForm({ ...form, rationale: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 resize-none text-sm"
                  rows="4"
                  placeholder="Detailed rationale for nomination..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Nominee'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
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
