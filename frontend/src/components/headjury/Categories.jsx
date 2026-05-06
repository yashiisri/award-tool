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
      await api.post('/head-jury/categories', { name, description })
      setShowModal(false); setName(''); setDescription(''); fetchCategories()
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={Award} title="Award Categories" subtitle="View and create award categories" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Category
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#7F3F98]/20 hover:shadow-md transition-all">
            <div className="w-10 h-10 bg-[#F5EEF8] rounded-xl flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-[#7F3F98]" />
            </div>
            <h3 className="font-bold text-[#1a1a2e] mb-1">{cat.name}</h3>
            <p className="text-gray-400 text-sm">{cat.description}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#1a1a2e]">New Award Category</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 text-sm" placeholder="Category name" required />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F3F98]/30 resize-none text-sm" rows="3" placeholder="Description" required />
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#7F3F98] text-white rounded-xl font-semibold text-sm hover:bg-[#6a3480] disabled:opacity-50 transition-colors">
                  {loading ? 'Creating...' : 'Create'}
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
