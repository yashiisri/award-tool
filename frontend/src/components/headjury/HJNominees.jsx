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
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee from the award?')) return
    try { await api.delete(`/head-jury/nominees/${id}`); fetchNominees() } catch (e) {}
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/head-jury/red-flag', { nominee_id: showFlagModal, reason: flagReason })
      setShowFlagModal(null)
      setFlagReason('')
      fetchNominees()
    } catch (e) {}
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
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
        subtitle="Review and manage nominees for this award"
        accent="#7F3F98"
        light="#F5EEF8"
        action={selectedAward && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Nominee
          </button>
        )}
      />

      {/* Award selector */}
      {!preAward && (
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Award</label>
          <div className="relative w-full max-w-sm">
            <select
              value={selectedAward}
              onChange={e => setSelectedAward(e.target.value)}
              className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm shadow-sm pr-10"
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
          <p className="text-gray-500 font-medium text-sm">No nominees for this award yet.</p>
          <p className="text-gray-400 text-xs mt-1">Use the Add Nominee button to add the first candidate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {nominees.map(nom => {
            const isApproved = nom.validated
            const isFlagged  = nom.red_flagged

            return (
              <div
                key={nom.id}
                className={`
                  group relative bg-white rounded-2xl overflow-hidden
                  border transition-all duration-300 ease-out
                  hover:-translate-y-1 hover:shadow-xl hover:shadow-[#7F3F98]/8
                  ${isFlagged
                    ? 'border-red-200 hover:border-red-300'
                    : 'border-gray-100 hover:border-[#7F3F98]/20'}
                `}
              >
                {/* Avatar banner */}
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
                    {isApproved && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#00338D] text-white text-xs font-semibold rounded-lg shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {isFlagged && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm ml-auto">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pt-4 pb-5">
                  <h3
                    className="font-bold text-[#0A1628] text-sm leading-snug mb-1 cursor-pointer hover:text-[#7F3F98] transition-colors duration-200 line-clamp-1"
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

                  {/* Action buttons — flag & delete only */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFlagModal(nom.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 text-orange-500 border border-orange-200 rounded-xl text-xs font-semibold hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md transition-all duration-200 active:scale-95"
                      title="Flag nominee"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Flag
                    </button>
                    <button
                      onClick={() => handleDelete(nom.id)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 border border-red-200 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 active:scale-95"
                      title="Remove nominee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`
                  absolute bottom-0 inset-x-0 h-0.5 scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-left
                  ${isFlagged ? 'bg-red-400' : 'bg-gradient-to-r from-[#7F3F98] to-[#5B2D6E]'}
                `} />
              </div>
            )
          })}
        </div>
      )}

      {/* Profile modal */}
      {selectedNominee && (
        <NomineeProfileCard nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />
      )}

      {/* Add Nominee modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.12)', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div>
                <h2 style={{ color: '#0A1628', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Add Nominee</h2>
                <p style={{ color: '#9BA8B5', fontSize: 13, marginTop: 2 }}>Add a candidate to this award</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9BA8B5', padding: 4, borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.color = '#0A1628'}
                onMouseLeave={e => e.currentTarget.style.color = '#9BA8B5'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Full Name', 'name', 'e.g. Roshni Nadar Malhotra', true],
                ['Designation', 'designation', 'e.g. Chairperson', true],
                ['Organisation', 'organisation', 'e.g. HCLTech', true],
                ['Photo URL (optional)', 'photo_url', 'https://...', false],
              ].map(([label, key, ph, req]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', boxSizing: 'border-box' }}
                    placeholder={ph}
                    required={req}
                    onFocus={e => e.target.style.borderColor = '#00338D'}
                    onBlur={e => e.target.style.borderColor = '#E8ECF0'}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9BA8B5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Rationale *</label>
                <textarea
                  value={form.rationale}
                  onChange={e => setForm({ ...form, rationale: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, color: '#0A1628', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  rows={4}
                  placeholder="Why is this person being nominated?"
                  required
                  onFocus={e => e.target.style.borderColor = '#00338D'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF0'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', background: loading ? '#9BA8B5' : '#00338D', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#002a73' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#00338D' }}
                >
                  {loading ? 'Adding...' : 'Add Nominee'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '12px 18px', background: '#F7F9FC', color: '#6B7A8D', border: '1px solid #E8ECF0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {showFlagModal && (
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
              <button onClick={handleFlag} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">
                Submit Flag
              </button>
              <button
                onClick={() => { setShowFlagModal(null); setFlagReason('') }}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
