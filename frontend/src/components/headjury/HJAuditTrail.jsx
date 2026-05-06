import { useState, useEffect } from 'react'
import { FileText, Clock, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACTION_STYLES = {
  create_award: 'bg-blue-50 text-blue-700 border-blue-200',
  add_nominee: 'bg-green-50 text-green-700 border-green-200',
  delete_nominee: 'bg-red-50 text-red-700 border-red-200',
  validate_nominee: 'bg-teal-50 text-teal-700 border-teal-200',
  vote: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  add_comment: 'bg-purple-50 text-purple-700 border-purple-200',
  red_flag_nominee: 'bg-orange-50 text-orange-700 border-orange-200',
  update_vote_control: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export default function HJAuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try { const { data } = await api.get('/head-jury/audit-logs'); setLogs(data) }
    catch (e) {} finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.user_role === filter)

  return (
    <div className="p-8">
      <PageHeader icon={FileText} title="Audit Trail" subtitle="Complete log of all platform activity" accent="#7F3F98" light="#F5EEF8"
        action={
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#7F3F98] text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="flex gap-2 mb-5">
        {[['all', 'All'], ['admin', 'Admin'], ['jury', 'Jury'], ['head_jury', 'Head Jury']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === val ? 'bg-[#7F3F98] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#7F3F98]/30'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 bg-gray-50 gap-4">
          {[['col-span-2', 'User'], ['col-span-2', 'Role'], ['col-span-2', 'Action'], ['col-span-4', 'Details'], ['col-span-2', 'Time']].map(([cls, h]) => (
            <div key={h} className={`${cls} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">No logs yet.</div>
        ) : (
          filtered.map((log, i) => (
            <div key={log.id} className={`grid grid-cols-12 px-6 py-4 items-start gap-4 ${i !== filtered.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-[#F5EEF8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#7F3F98] text-xs font-black">{log.user_id?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-[#1a1a2e] text-sm font-medium truncate">{log.user_id}</span>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-lg font-medium ${log.user_role === 'head_jury' ? 'bg-[#F5EEF8] text-[#7F3F98]' : log.user_role === 'jury' ? 'bg-[#EAF5FC] text-[#0091DA]' : 'bg-[#EEF2FA] text-[#00338D]'}`}>{log.user_role}</span>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${ACTION_STYLES[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{log.action?.replace(/_/g, ' ')}</span>
              </div>
              <div className="col-span-4 text-gray-500 text-xs font-mono break-all">{JSON.stringify(log.details)}</div>
              <div className="col-span-2 flex items-center gap-1.5 text-gray-400 text-xs">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
