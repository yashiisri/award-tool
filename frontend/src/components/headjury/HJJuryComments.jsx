import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Crown, Users, Award, User } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const TABS = [
  { key: 'jury',      label: 'Jury',      icon: Users },
  { key: 'head_jury', label: 'Head Jury', icon: Crown },
]

export default function HJJuryComments() {
  const [comments, setComments] = useState([])
  const [awards, setAwards] = useState([])
  const [nomineeMap, setNomineeMap] = useState({}) // nominee_id -> nominee
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('jury')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [commentsRes, awardsRes] = await Promise.all([
        api.get('/head-jury/jury-comments'),
        api.get('/head-jury/awards'),
      ])
      setComments(commentsRes.data)
      setAwards(awardsRes.data)

      const awardIds = [...new Set(commentsRes.data.map(c => c.award_id).filter(Boolean))]
      const nomineeLists = await Promise.all(
        awardIds.map(id => api.get(`/head-jury/nominees/${id}`).then(r => r.data).catch(() => []))
      )
      const map = {}
      nomineeLists.flat().forEach(n => { map[n.id] = n })
      setNomineeMap(map)
    } catch (e) {}
    finally { setLoading(false) }
  }

  const awardName = (id) => awards.find(a => a.id === id)?.name || ''
  const nomineeName = (id) => nomineeMap[id]?.name || ''
  const filtered = comments.filter(c => (c.jury_role || 'jury') === tab)

  return (
    <div className="p-8">
      <PageHeader
        icon={MessageSquare}
        title="Jury Comments"
        subtitle="Feedback and assessment notes submitted on nominees"
        accent="#00338D"
        light="#EEF2FA"
        action={
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = comments.filter(c => (c.jury_role || 'jury') === key).length
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
              <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${tab === key ? 'bg-[#EEF2FA] text-[#00338D]' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold text-sm mb-1">No comments yet</p>
          <p className="text-gray-400 text-xs">
            {tab === 'jury' ? 'Jury members haven\'t submitted any feedback.' : 'Head Jury hasn\'t submitted any feedback.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
          {filtered.map(c => (
            <div key={c.id} className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[#00338D] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-black">{c.jury_id?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-bold text-[#0A1628] text-sm">{c.jury_id}</span>
                  {c.award_id && awardName(c.award_id) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FA] text-[#00338D] text-xs font-semibold rounded-lg">
                      <Award className="w-3 h-3" /> {awardName(c.award_id)}
                    </span>
                  )}
                  {c.nominee_id && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                      <User className="w-3 h-3" /> {nomineeName(c.nominee_id) || 'Nominee no longer available'}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{c.comment}</p>
              </div>
              <span className="text-gray-400 text-xs flex-shrink-0 whitespace-nowrap">
                {c.created_at ? new Date(c.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
