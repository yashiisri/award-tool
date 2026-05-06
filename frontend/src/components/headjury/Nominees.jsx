import { useState, useEffect } from 'react'
import { UserCheck, Flag, User, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function Nominees() {
  const [nominees, setNominees] = useState([])
  const [showFlagModal, setShowFlagModal] = useState(null)
  const [flagReason, setFlagReason] = useState('')

  useEffect(() => { fetchNominees() }, [])

  const fetchNominees = async () => {
    try { const { data } = await api.get('/head-jury/nominees'); setNominees(data) }
    catch (err) { console.error(err) }
  }

  const handleValidate = async (id) => {
    try { await api.post('/head-jury/validate-nominee', { nominee_id: id }); fetchNominees() }
    catch (err) { console.error(err) }
  }

  const handleRedFlag = async () => {
    if (!flagReason.trim()) return
    try {
      await api.post('/admin/red-flag', { nominee_id: showFlagModal, reason: flagReason })
      setShowFlagModal(null); setFlagReason(''); fetchNominees()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={User} title="Nominees" subtitle="Validate or red flag nominees" accent="#7F3F98" light="#F5EEF8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nominees.map((nom) => (
          <div key={nom.id} className={`p-6 bg-white border rounded-2xl transition-all ${nom.red_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-[#F5EEF8] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#7F3F98]" />
              </div>
              {nom.red_flagged && <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-lg font-medium"><AlertTriangle className="w-3 h-3" /> Flagged</span>}
            </div>
            <h3 className="font-bold text-[#1a1a2e] mb-4">{nom.name}</h3>
            <div className="flex gap-2">
              <button onClick={() => handleValidate(nom.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                <UserCheck className="w-4 h-4" /> Validate
              </button>
              <button onClick={() => setShowFlagModal(nom.id)} className="p-2 bg-red-50 text-red-500 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
