import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Users, Plus, Trash2, Flag, X, CheckCircle,
  Building2, Briefcase, ChevronDown, AlertTriangle, Award
} from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from '../admin/NomineeProfileCard'

export default function HJNominees() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preAward = searchParams.get('award')

  const [awards, setAwards] = useState([])
  const [selectedAward, setSelectedAward] = useState(preAward || '')
  const [nominees, setNominees] = useState([])
  const [validated, setValidated] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [selectedNominee, setSelectedNominee] = useState(null)
  const [form, setForm] = useState({ name: '', designation: '', organisation: '', photo_url: '', rationale: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAwards() }, [])
  useEffect(() => { if (selectedAward) fetchNominees() }, [selectedAward])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/head-jury/awards'); setAwards(data) } catch (e) {}
  }

  const fetchNominees = async () => {
    try {
      const { data } = await api.get(`/head-jury/nominees/${selectedAward}`)
      setNominees(data)
      const username = localStorage.getItem('username') || ''
      setValidated(new Set(data.filter(n => n.validated_by?.includes(username)).map(n => n.id)))
    } catch (e) {}
  }

  const handleValidate = async (id) => {
    try {
      await api.post('/jury/validate-nominee', { nominee_id: id })
      setValidated(new Set([...validated, id]))
      fetchNominees()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee?')) return
    try { await api.delete(`/head-jury/nominees/${id}`); fetchNominees() } catch (e) {}
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/head-jury/red-flag', { nominee_id: showFlagModal, reason: flagReason })
      setShowFlagModal(null); setFlagReason(''); fetchNominees()
    } catch (e) {}
  }

  const handleAdd = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/head-jury/nominees', { ...form, award_id: selectedAward })
      setShowAddModal(false)
      setForm({ name: '', designation: '', organisation: '', photo_url: '', rationale: '' })
      fetchNominees()
    } catch (e) {} finally { setLoading(false) }
  }

  const currentAward = awards.find(a => a.id === selectedAward)

  return (
    <div className="p-8">
      <PageHeader
        icon={Users}
        title="Nominees"
        subtitle="Add, validate, and manage nominees"
        accent="#7F3F98"
        light="#F5EEF8"
        action={selectedAward && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Nominee
          </button>
        )}
      />

      {/* Award selector — only when not pre-selected */}
      {!preAward && (
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
          <div className="relative w-full max-w-sm">
            <select value={selectedAward} onChange={e => setSelectedAward(e.target.value)}
              className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm shadow-sm pr-10">
              <option value="">Choose an award</option>
              {awards.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Award pill */}
      {currentAward && (
        <div className="mb-6 p-4 bg-[#F5EEF8] border border-[#7F3F98]/15 rounded-xl flex items-center gap-3">
          <Award className="w-5 h-5 text-[#7F3F98] flex-shrink-0" />
          <div>
            <p className="font-bold text-[#7F3F98] text-sm">{currentAward.name}</p>
            <p className="text-gray-500 text-xs">{currentAward.description}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
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
                  hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#7F3F98]/10
                  ${isFlagged
                    ? 'border-red-200 hover:border-red-300'
                    : isValidated
                    ? 'border-green-200 hover:border-green-300'
                    : 'border-gray-100 hover:border-[#7F3F98]/30'}
                `}
              >
                {/* ── Avatar banner ── */}
                <div
                  className="relative h-44 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedNominee(nom)}
                >
                  <div className={`absolute inset-0 transition-transform duration-500 group-hover:scale-105
                    ${isFlagged
                      ? 'bg-gradient-to-br from-red-50 to-red-100'
                      : 'bg-gradient-to-br from-[#F5EEF8] via-[#ead5f5] to-[#d8b4f0]'}`}
                  />

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
                        ${isFlagged ? 'bg-red-400' : 'bg-gradient-to-br from-[#7F3F98] to-[#5B2D6E]'}
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
                  <h3
                    className="font-black text-[#1a1a2e] text-sm leading-snug mb-1 cursor-pointer hover:text-[#7F3F98] transition-colors duration-200 line-clamp-1"
                    onClick={() => setSelectedNominee(nom)}
                  >
                    {nom.name}
                  </h3>
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
                          : 'bg-[#F5EEF8] text-[#7F3F98] border border-[#7F3F98]/20 hover:bg-[#7F3F98] hover:text-white hover:border-[#7F3F98] hover:shadow-md hover:shadow-[#7F3F98]/20 active:scale-95'}
                      `}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isValidated ? 'Validated' : 'Validate'}
                    </button>

                    {/* Flag */}
                    <button
                      onClick={() => setShowFlagModal(nom.id)}
                      className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-400 border border-orange-200 rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 active:scale-95"
                      title="Flag nominee"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(nom.id)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 border border-red-200 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 active:scale-95"
                      title="Remove nominee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Hover accent line ── */}
                <div className={`
                  absolute bottom-0 inset-x-0 h-0.5 scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-left rounded-full
                  ${isFlagged ? 'bg-red-400' : isValidated ? 'bg-green-400' : 'bg-gradient-to-r from-[#7F3F98] to-[#5B2D6E]'}
                `} />
              </div>
            )
          })}
        </div>
      )}

      {/* Profile modal */}
      {selectedNominee && <NomineeProfileCard nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />}

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-[#1a1a2e]">Add Nominee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[['Full Name','name','e.g. Roshni Nadar Malhotra'],['Designation','designation','e.g. Chairperson'],['Organisation','organisation','e.g. HCLTech'],['Photo URL (optional)','photo_url','https://...']].map(([label, key, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                  <input type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm"
                    placeholder={ph} required={key !== 'photo_url'} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rationale</label>
                <textarea value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 resize-none text-sm" rows="4" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] disabled:opacity-50 transition-colors">
                  {loading ? 'Adding...' : 'Add Nominee'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-black text-[#1a1a2e]">Red Flag Nominee</h2>
            </div>
            <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4" rows="3"
              placeholder="Reason for flagging this nominee..." />
            <div className="flex gap-3">
              <button onClick={handleFlag} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">Confirm</button>
              <button onClick={() => { setShowFlagModal(null); setFlagReason('') }} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
