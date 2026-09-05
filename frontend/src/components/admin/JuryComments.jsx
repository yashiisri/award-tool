import { useState, useEffect } from 'react'
import { MessageSquare, RefreshCw, Crown, Users, Award, User, Trash2, Loader2 } from 'lucide-react'
import api from '../../api/axios'

const TABS = [
  { key: 'jury',      label: 'Jury',      icon: Users },
  { key: 'head_jury', label: 'Head Jury', icon: Crown },
]

export default function JuryComments() {
  const [comments, setComments] = useState([])
  const [awards, setAwards] = useState([])
  const [nomineeMap, setNomineeMap] = useState({}) // nominee_id -> nominee
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('jury')
  const [deletingId, setDeletingId] = useState(null)

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

      // Resolve nominee names for every award a comment references, so each
      // comment can show which nominee it's about (not just the award).
      const awardIds = [...new Set(commentsRes.data.map(c => c.award_id).filter(Boolean))]
      const nomineeLists = await Promise.all(
        awardIds.map(id => api.get(`/admin/nominees/${id}`).then(r => r.data).catch(() => []))
      )
      const map = {}
      nomineeLists.flat().forEach(n => { map[n.id] = n })
      setNomineeMap(map)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const awardName = (id) => awards.find(a => a.id === id)?.name || ''
  const nomineeName = (id) => nomineeMap[id]?.name || ''
  const filtered = comments.filter(c => (c.jury_role || 'jury') === tab)

  const handleDelete = async (id) => {
    if (!confirm('Delete this comment permanently?')) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/jury-comments/${id}`)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (err) { console.error(err) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div style={{ width: 26, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--gold-bright)', fontWeight: 700 }} className="uppercase">
              AIMA · Administration Console
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--kpmg-navy)' }} className="text-[26px] font-semibold tracking-tight">
            Jury Comments
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-[13px] mt-1">
            Feedback and assessment notes submitted on nominees
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-semibold transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--border-light)' }} className="mb-6" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = comments.filter(c => (c.jury_role || 'jury') === key).length
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all ${tab === key ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === key ? 'bg-[#EEF2FA] text-[#00338D]' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-100 text-center">
          <MessageSquare className="w-8 h-8 mb-4" style={{ color: 'var(--gold)' }} strokeWidth={1.5} />
          <p className="text-gray-500 font-semibold text-sm mb-1">No comments yet</p>
          <p className="text-gray-400 text-xs">
            {tab === 'jury' ? 'Jury members haven\'t submitted any feedback.' : 'Head Jury hasn\'t submitted any feedback.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-50">
          {filtered.map(c => (
            <div key={c.id} className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpmg-navy)' }}>
                <span className="text-white text-sm font-bold">{c.jury_id?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-semibold text-[#0A1628] text-sm">{c.jury_id}</span>
                  {c.award_id && awardName(c.award_id) && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EEF2FA] text-[#00338D] text-xs font-semibold rounded">
                      <Award className="w-3 h-3" /> {awardName(c.award_id)}
                    </span>
                  )}
                  {c.nominee_id && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                      <User className="w-3 h-3" /> {nomineeName(c.nominee_id) || 'Nominee no longer available'}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{c.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {c.created_at ? new Date(c.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                  title="Delete comment"
                >
                  {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
