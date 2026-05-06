import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function HJJuryComments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchComments() }, [])

  const fetchComments = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/jury-comments'); setComments(data) }
    catch (e) {} finally { setLoading(false) }
  }

  const members = [...new Set(comments.map(c => c.jury_id))]
  const filtered = filter === 'all' ? comments : comments.filter(c => c.jury_id === filter)

  return (
    <div className="p-8">
      <PageHeader icon={MessageSquare} title="Jury Comments" subtitle="All feedback submitted by jury members" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={fetchComments} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-black text-[#7F3F98] mb-1">{comments.length}</div>
          <div className="text-gray-400 text-xs font-medium">Total Comments</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-black text-[#7F3F98] mb-1">{members.length}</div>
          <div className="text-gray-400 text-xs font-medium">Jury Members</div>
        </div>
      </div>

      {members.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === 'all' ? 'bg-[#7F3F98] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>All</button>
          {members.map(m => (
            <button key={m} onClick={() => setFilter(m)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === m ? 'bg-[#7F3F98] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>{m}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No comments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm hover:border-[#7F3F98]/15 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 bg-[#7F3F98] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">{c.jury_id?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1a1a2e] text-sm">{c.jury_id}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-lg font-medium ${c.jury_role === 'head_jury' ? 'bg-[#F5EEF8] text-[#7F3F98]' : 'bg-[#EAF5FC] text-[#0091DA]'}`}>{c.jury_role || 'jury'}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{c.comment}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
