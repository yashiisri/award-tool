import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Star } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function VoteStatus() {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchVotes() }, [])

  const fetchVotes = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/vote-status'); setVotes(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={BarChart3} title="Vote Status" subtitle="Live overview of all jury votes and scores" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={fetchVotes} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] hover:border-[#7F3F98]/30 text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
          {['Nominee', 'Jury Member', 'Score', 'Category'].map(h => (
            <div key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        {votes.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">No votes recorded yet.</div>
        ) : (
          votes.map((v, i) => (
            <div key={v.id} className={`grid grid-cols-4 px-6 py-4 items-center ${i !== votes.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
              <div className="text-[#1a1a2e] text-sm font-medium">{v.nominee_id}</div>
              <div className="text-gray-500 text-sm">{v.jury_id}</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className={`w-4 h-4 ${idx < v.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
                <span className="text-gray-400 text-xs ml-1">{v.score}/5</span>
              </div>
              <div className="text-gray-400 text-xs">{v.category_id}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
