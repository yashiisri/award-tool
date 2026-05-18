import { useState, useEffect } from 'react'
import { Award, Plus, X, Users, ChevronRight, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const CRITERIA = [
  { id: 'governance', label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general', label: 'General Eligibility' },
]

export default function HJAwards() {
  const [awards, setAwards] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/head-jury/awards'); setAwards(data) } catch (e) {}
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/head-jury/awards', form)
      setShowModal(false); setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
      fetchAwards()
    } catch (e) {} finally { setLoading(false) }
  }

  const toggleCriteria = (id) => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }

  return (
    <div className="p-8">
      <PageHeader icon={Award} title="Awards" subtitle="Create and manage AIMA award categories" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Award
          </button>
        }
      />

      {awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#F5EEF8] rounded-2xl flex items-center justify-center mb-4"><Award className="w-8 h-8 text-[#7F3F98]" /></div>
          <p className="text-gray-500 font-semibold">No awards yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {awards.map(award => (
            <div key={award.id} onClick={() => {
                localStorage.setItem('hj_selected_award', award.id)
                navigate(`/head_jury/nominees?award=${award.id}`)
              }}
              className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-[#7F3F98]/20 transition-all cursor-pointer hover:-translate-y-0.5">
              <div className="w-11 h-11 bg-[#F5EEF8] rounded-xl flex items-center justify-center mb-4"><Award className="w-5 h-5 text-[#7F3F98]" /></div>
              <h3 className="font-black text-[#1a1a2e] text-base mb-2">{award.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">{award.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4"><Users className="w-3.5 h-3.5" />{award.num_nominees} nominees</div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-[#7F3F98] font-semibold">View Nominees</span>
                <ChevronRight className="w-4 h-4 text-[#7F3F98] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-[#1a1a2e]">Create New Award</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Award Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm" placeholder="e.g. Business Leader of the Year" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 resize-none text-sm" rows="3" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Nominees</label>
                <input type="number" min="1" max="20" value={form.num_nominees} onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                  className="w-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Evaluation Criteria</label>
                <div className="space-y-2">
                  {CRITERIA.map(({ id, label }) => (
                    <div key={id} onClick={() => toggleCriteria(id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.criteria.includes(id) ? 'border-[#7F3F98]/30 bg-[#F5EEF8]/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${form.criteria.includes(id) ? 'bg-[#7F3F98] border-[#7F3F98]' : 'border-gray-300'}`}>
                        {form.criteria.includes(id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm font-medium text-[#1a1a2e]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] disabled:opacity-50 transition-colors">
                  {loading ? 'Creating...' : 'Create Award'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
