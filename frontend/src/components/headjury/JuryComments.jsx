import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function JuryComments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchComments() }, [])

  const fetchComments = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/jury-comments'); setComments(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={MessageSquare} title="Jury Comments" subtitle="All feedback submitted by jury members" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={fetchComments} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] hover:border-[#7F3F98]/30 text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#F5EEF8] rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-[#7F3F98]" />
          </div>
          <p className="text-gray-400 text-sm font-medium">No jury comments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#7F3F98]/20 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#7F3F98] rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-black">{c.jury_id?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="font-semibold text-[#1a1a2e] text-sm">{c.jury_id}</span>
                </div>
                <span className="text-gray-400 text-xs">{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{c.comment}</p>
              <p className="text-gray-400 text-xs mt-3">Nominee: {c.nominee_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
