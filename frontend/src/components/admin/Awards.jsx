import { useState, useEffect } from 'react'
import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const AIMA_CRITERIA = [
  { id: 'governance', label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general', label: 'General Eligibility' },
]

const CRITERIA_DETAILS = {
  governance: [
    'Contribution to society and nation at large',
    'Personal values, ethics and corporate integrity',
    'Contribution to positive evolution of government policy',
    'Contribution towards globalisation of Indian economy',
  ],
  org_performance: [
    'Display of corporate courage and leadership',
    'Contribution towards evolving appropriate management culture',
    'Contribution towards development of management profession',
    'Vision and support for innovation and new ideas',
  ],
  general: [
    'Organisation must be operating in India',
    'Business must have contributed substantially to Indian economy',
    'Nominations of individuals from their own organisations will be considered',
  ],
}

export default function Awards() {
  const [awards, setAwards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedCriteria, setExpandedCriteria] = useState(null)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', description: '', num_nominees: 5,
    criteria: ['governance', 'org_performance', 'general'],
  })

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) }
    catch (err) { console.error(err) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/awards', form)
      setShowModal(false)
      setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
      fetchAwards()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this award and all its nominees?')) return
    try { await api.delete(`/admin/awards/${id}`); fetchAwards() }
    catch (err) { console.error(err) }
  }

  const toggleCriteria = (id) => {
    const current = form.criteria
    setForm({ ...form, criteria: current.includes(id) ? current.filter(c => c !== id) : [...current, id] })
  }

  return (
    <div className="p-8">
      <PageHeader icon={Award} title="Awards" subtitle="Create and manage AIMA award categories" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Award
          </button>
        }
      />

      {awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold mb-1">No awards created yet</p>
          <p className="text-gray-400 text-sm">Create your first AIMA award to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {awards.map((award) => (
            <div key={award.id} onClick={() => navigate(`/admin/nominees?award=${award.id}`)}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-[#00338D]/20 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-[#EEF2FA] rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#00338D]" />
                </div>
                <button onClick={(e) => handleDelete(award.id, e)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-black text-[#1a1a2e] text-base mb-1">{award.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{award.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {award.num_nominees} nominees
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {award.criteria?.length || 3} criteria
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-[#00338D] font-semibold">View Nominees</span>
                <ChevronRight className="w-4 h-4 text-[#00338D] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Award Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-8 pb-0">
              <div>
                <h2 className="text-xl font-black text-[#1a1a2e]">Create New Award</h2>
                <p className="text-gray-400 text-sm mt-0.5">Configure award details and evaluation criteria</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Award Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm"
                    placeholder="e.g. Business Leader of the Year" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Award Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 resize-none text-sm" rows="3"
                    placeholder="Describe the purpose and significance of this award..." required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Nominees</label>
                  <input type="number" min="1" max="20" value={form.num_nominees} onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                    className="w-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" />
                </div>
              </div>

              {/* AIMA Evaluation Criteria */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AIMA Evaluation Criteria</label>
                <div className="space-y-3">
                  {AIMA_CRITERIA.map(({ id, label }) => (
                    <div key={id} className={`border rounded-xl overflow-hidden transition-all ${form.criteria.includes(id) ? 'border-[#00338D]/30 bg-[#EEF2FA]/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleCriteria(id)}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.criteria.includes(id) ? 'bg-[#00338D] border-[#00338D]' : 'border-gray-300'}`}>
                          {form.criteria.includes(id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="font-semibold text-sm text-[#1a1a2e] flex-1">{label}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setExpandedCriteria(expandedCriteria === id ? null : id) }}
                          className="text-xs text-[#0091DA] hover:underline">
                          {expandedCriteria === id ? 'Hide' : 'View details'}
                        </button>
                      </div>
                      {expandedCriteria === id && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <ul className="mt-3 space-y-1.5">
                            {CRITERIA_DETAILS[id].map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                <div className="w-1.5 h-1.5 bg-[#0091DA] rounded-full mt-1.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                  {loading ? 'Creating Award...' : 'Create Award'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
