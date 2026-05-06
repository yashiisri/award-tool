import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Plus, Trash2, Flag, X, CheckCircle, Building2, Briefcase, ChevronDown, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'
import NomineeProfileCard from '../admin/NomineeProfileCard'

export default function HJNominees() {
  const [searchParams] = useSearchParams()
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
    try { const { data } = await api.get(`/head-jury/nominees/${selectedAward}`); setNominees(data) } catch (e) {}
  }

  const handleAdd = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/head-jury/nominees', { ...form, award_id: selectedAward })
      setShowAddModal(false); setForm({ name: '', designation: '', organisation: '', photo_url: '', rationale: '' })
      fetchNominees()
    } catch (e) {} finally { setLoading(false) }
  }

  const handleValidate = async (id) => {
    try { await api.post('/jury/validate-nominee', { nominee_id: id }); fetchNominees() } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this nominee?')) return
    try { await api.delete(`/head-jury/nominees/${id}`); fetchNominees() } catch (e) {}
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return
    try { await api.post('/head-jury/red-flag', { nominee_id: showFlagModal, reason: flagReason }); setShowFlagModal(null); setFlagReason(''); fetchNominees() } catch (e) {}
  }

  return (
    <div className="p-8">
      <PageHeader icon={Users} title="Nominees" subtitle="Add, validate, and manage nominees" accent="#7F3F98" light="#F5EEF8"
        action={selectedAward && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Nominee
          </button>
        )}
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {nominees.map(nom => (
          <div key={nom.id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all ${nom.red_flagged ? 'border-red-200' : 'border-gray-100 hover:border-[#7F3F98]/20'}`}>
            <div className="h-28 bg-gradient-to-br from-[#F5EEF8] to-[#ead5f5] flex items-center justify-center relative cursor-pointer" onClick={() => setSelectedNominee(nom)}>
              {nom.photo_url ? <img src={nom.photo_url} alt={nom.name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} /> : (
                <div className="w-14 h-14 bg-[#7F3F98] rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-black">{nom.name?.[0]}</span>
                </div>
              )}
              {nom.red_flagged && <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-lg"><AlertTriangle className="w-3 h-3" /> Flagged</div>}
            </div>
            <div className="p-5">
              <h3 className="font-black text-[#1a1a2e] text-sm mb-1">{nom.name}</h3>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5"><Briefcase className="w-3 h-3" />{nom.designation}</div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4"><Building2 className="w-3 h-3" />{nom.organisation}</div>
              <div className="flex gap-2">
                <button onClick={() => handleValidate(nom.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Validate
                </button>
                <button onClick={() => setShowFlagModal(nom.id)} className="p-2 bg-orange-50 text-orange-500 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors">
                  <Flag className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(nom.id)} className="p-2 bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              {[['Full Name', 'name', 'e.g. Roshni Nadar Malhotra'], ['Designation', 'designation', 'e.g. Chairperson'], ['Organisation', 'organisation', 'e.g. HCLTech'], ['Photo URL (optional)', 'photo_url', 'https://...']].map(([label, key, ph]) => (
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
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Flag className="w-5 h-5 text-red-500" /></div>
              <h2 className="text-lg font-black text-[#1a1a2e]">Red Flag Nominee</h2>
            </div>
            <textarea value={flagReason} onChange={e => setFlagReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4" rows="3" placeholder="Reason..." />
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
