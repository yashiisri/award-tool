import { useState, useEffect } from 'react'
import { UserCheck, CheckCircle, User } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function ValidateNominees() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [nominees, setNominees] = useState([])
  const [validated, setValidated] = useState(new Set())

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { if (selectedCategory) fetchNominees() }, [selectedCategory])

  const fetchCategories = async () => {
    try { const { data } = await api.get('/admin/categories'); setCategories(data) }
    catch (err) { console.error(err) }
  }

  const fetchNominees = async () => {
    try { const { data } = await api.get(`/jury/nominees/${selectedCategory}`); setNominees(data) }
    catch (err) { console.error(err) }
  }

  const handleValidate = async (id) => {
    try { await api.post('/jury/validate-nominee', { nominee_id: id }); setValidated(new Set([...validated, id])) }
    catch (err) { console.error(err) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={UserCheck} title="Validate Nominees" subtitle="Review and validate nominees for each category" accent="#0091DA" light="#EAF5FC" />

      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Category</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full max-w-sm px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0091DA]/30 text-sm shadow-sm">
          <option value="">Choose a category</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {nominees.length === 0 && selectedCategory && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EAF5FC] rounded-2xl flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-[#0091DA]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No nominees in this category.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nominees.map((nom) => {
          const isValidated = validated.has(nom.id)
          return (
            <div key={nom.id} className={`p-6 bg-white border rounded-2xl transition-all ${isValidated ? 'border-green-200 bg-green-50/30' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-[#EAF5FC] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0091DA]" />
                </div>
                {isValidated && <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium"><CheckCircle className="w-3 h-3" /> Validated</span>}
              </div>
              <h3 className="font-bold text-[#1a1a2e] mb-4">{nom.name}</h3>
              <button onClick={() => handleValidate(nom.id)} disabled={isValidated}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#EAF5FC] text-[#0091DA] border border-[#0091DA]/20 rounded-xl text-sm font-semibold hover:bg-[#0091DA] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <CheckCircle className="w-4 h-4" />
                {isValidated ? 'Validated' : 'Validate'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
