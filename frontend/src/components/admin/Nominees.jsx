import { useState, useEffect } from 'react'
import { Plus, Flag, User, X, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function Nominees() {
  const [nominees, setNominees] = useState([])
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [form, setForm] = useState({ name: '', category_id: '', rationale: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try { const { data } = await api.get('/admin/categories'); setCategories(data) }
    catch (err) { console.error(err) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/nominees', { name: form.name, category_id: form.category_id, rationale_data: { rationale: form.rationale } })
      setShowModal(false); setForm({ name: '', category_id: '', rationale: '' })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleRedFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/admin/red-flag', { nominee_id: showFlagModal, reason: flagReason })
      setShowFlagModal(null); setFlagReason('')
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={User} title="Nominees" subtitle="Add and manage nominees from available rationale data" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Nominee
          </button>
        }
      />

      {nominees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No nominees added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nominees.map((nom) => (
            <div key={nom.id} className={`p-6 bg-white border rounded-2xl transition-all ${nom.red_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#EEF2FA] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#00338D]" />
                </div>
                <div className="flex items-center gap-2">
                  {nom.red_flagged && <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-lg font-medium"><AlertTriangle className="w-3 h-3" /> Flagged</span>}
                  <button onClick={() => setShowFlagModal(nom.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-1">{nom.name}</h3>
              <p className="text-gray-400 text-xs">{nom.category_id}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#1a1a2e]">Add Nominee</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" placeholder="Nominee name" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" required>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rationale</label>
                <textarea value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 resize-none text-sm" rows="3" placeholder="Why is this person nominated?" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                  {loading ? 'Adding...' : 'Add Nominee'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFlagModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-[#1a1a2e]">Red Flag Nominee</h2>
            </div>
            <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none text-sm mb-4" rows="3" placeholder="Reason for red flagging..." />
            <div className="flex gap-3">
              <button onClick={handleRedFlag} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors">Confirm Flag</button>
              <button onClick={() => { setShowFlagModal(null); setFlagReason('') }} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
