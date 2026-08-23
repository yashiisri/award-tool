import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Award, User } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function JuryComments() {
  const [comments, setComments] = useState([])
  const [awards, setAwards] = useState([])
  const [nominees, setNominees] = useState({})
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [commentsRes, awardsRes] = await Promise.all([
        api.get('/admin/jury-comments'),
        api.get('/admin/awards'),
      ])
      setComments(commentsRes.data)
      setAwards(awardsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.jury_id === filter)
  const juryMembers = [...new Set(comments.map(c => c.jury_id))]

  return (
    <div className="p-8">
      <PageHeader icon={MessageSquare} title="Jury Comments" subtitle="All feedback and suggestions submitted by jury members" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Comments', value: comments.length, color: '#00338D', bg: '#EEF2FA' },
          { label: 'Jury Members', value: juryMembers.length, color: '#7F3F98', bg: '#F5EEF8' },
          { label: 'Awards Covered', value: [...new Set(comments.map(c => c.award_id))].length, color: '#0091DA', bg: '#EAF5FC' },
        ].map(({ label, value, color, bg }, i) => (
          <div key={label} className="animate-fade-in-up hover-lift bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter by jury member */}
      {juryMembers.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === 'all' ? 'bg-[#00338D] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#00338D]/30'}`}>
            All Members
          </button>
          {juryMembers.map(j => (
            <button key={j} onClick={() => setFilter(j)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === j ? 'bg-[#00338D] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#00338D]/30'}`}>
              {j}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold mb-1">No comments yet</p>
          <p className="text-gray-400 text-sm">Jury members haven't submitted any feedback.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <div key={c.id} className="animate-fade-in-up bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-[#00338D]/15 hover:-translate-y-0.5 transition-all" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 bg-[#00338D] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">{c.jury_id?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1a1a2e] text-sm">{c.jury_id}</span>
                      <span className="px-2 py-0.5 bg-[#EEF2FA] text-[#00338D] text-xs rounded-lg font-medium">Jury</span>
                    </div>
                    {c.nominee_id && <p className="text-gray-400 text-xs mb-2">Re: Nominee {c.nominee_id}</p>}
                    <p className="text-gray-700 text-sm leading-relaxed">{c.comment}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">
                  {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
