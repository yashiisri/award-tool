import { useState, useEffect } from 'react'
import { Plus, Award, X } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try { const { data } = await api.get('/admin/categories'); setCategories(data) }
    catch (err) { console.error(err) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/categories', { name, description })
      setShowModal(false); setName(''); setDescription(''); fetchCategories()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={Award} title="Award Categories" subtitle="Create and manage award categories for this cycle" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Category
          </button>
        }
      />

      {categories.length === 0 ? (
        <div className="animate-fade-in-up flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No categories yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={cat.id} className="group hover-lift animate-fade-in-up p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#00338D]/20 hover:shadow-md transition-all" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="w-10 h-10 bg-[#EEF2FA] rounded-xl flex items-center justify-center mb-4 icon-pop">
                <Award className="w-5 h-5 text-[#00338D]" />
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-1">{cat.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="animate-fade-in fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="animate-scale-in bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#1a1a2e]">New Award Category</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 text-sm" placeholder="e.g. Innovation Award" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00338D]/30 resize-none text-sm" rows="3" placeholder="Describe this award category..." required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                  {loading ? 'Creating...' : 'Create Category'}
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
