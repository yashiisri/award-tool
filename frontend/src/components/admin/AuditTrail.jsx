import { useState, useEffect } from 'react'
import { FileText, Clock, RefreshCw, Download } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACTION_STYLES = {
  create_award:       'bg-blue-50 text-blue-700 border-blue-200',
  create_category:    'bg-blue-50 text-blue-700 border-blue-200',
  add_nominee:        'bg-green-50 text-green-700 border-green-200',
  delete_nominee:     'bg-red-50 text-red-700 border-red-200',
  validate_nominee:   'bg-teal-50 text-teal-700 border-teal-200',
  vote:               'bg-yellow-50 text-yellow-700 border-yellow-200',
  add_comment:        'bg-purple-50 text-purple-700 border-purple-200',
  red_flag_nominee:   'bg-orange-50 text-orange-700 border-orange-200',
  update_vote_control:'bg-indigo-50 text-indigo-700 border-indigo-200',
  create_user:        'bg-cyan-50 text-cyan-700 border-cyan-200',
  delete_award:       'bg-red-50 text-red-700 border-red-200',
}

const ROLE_STYLES = {
  admin:     'bg-[#EEF2FA] text-[#00338D]',
  jury:      'bg-[#EAF5FC] text-[#0091DA]',
  head_jury: 'bg-[#F5EEF8] text-[#7F3F98]',
}

export default function AuditTrail() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try { const { data } = await api.get('/audit/logs'); setLogs(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.user_role === filter)

  return (
    <div className="p-8">
      <PageHeader icon={FileText} title="Audit Trail" subtitle="Complete timestamped log of all platform activity" accent="#00338D" light="#EEF2FA"
        action={
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-medium transition-all shadow-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Events', value: logs.length, color: '#00338D' },
          { label: 'Admin Actions', value: logs.filter(l => l.user_role === 'admin').length, color: '#00338D' },
          { label: 'Jury Actions', value: logs.filter(l => l.user_role === 'jury').length, color: '#0091DA' },
          { label: 'Head Jury Actions', value: logs.filter(l => l.user_role === 'head_jury').length, color: '#7F3F98' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
            <div className="text-gray-400 text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Role filter */}
      <div className="flex gap-2 mb-5">
        {[['all', 'All Roles'], ['admin', 'Admin'], ['jury', 'Jury'], ['head_jury', 'Head Jury']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === val ? 'bg-[#00338D] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#00338D]/30'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 bg-gray-50 gap-4">
          {[['col-span-2', 'User'], ['col-span-1', 'Role'], ['col-span-2', 'Action'], ['col-span-5', 'Details'], ['col-span-2', 'Timestamp']].map(([cls, h]) => (
            <div key={h} className={`${cls} text-xs font-bold text-gray-500 uppercase tracking-wider`}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">No audit logs yet.</div>
        ) : (
          filtered.map((log, i) => (
            <div key={log.id} className={`grid grid-cols-12 px-6 py-4 items-start gap-4 ${i !== filtered.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}>
              <div className="col-span-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-[#EEF2FA] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00338D] text-xs font-black">{log.user_id?.[0]?.toUpperCase()}</span>
                </div>
                <span className="text-[#1a1a2e] text-sm font-medium truncate">{log.user_id}</span>
              </div>
              <div className="col-span-1">
                <span className={`px-2 py-1 text-xs rounded-lg font-medium ${ROLE_STYLES[log.user_role] || 'bg-gray-100 text-gray-600'}`}>
                  {log.user_role}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs rounded-lg font-medium border ${ACTION_STYLES[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {log.action?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="col-span-5 text-gray-500 text-xs font-mono break-all leading-relaxed">
                {JSON.stringify(log.details)}
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-gray-400 text-xs">
                <Clock className="w-3 h-3 flex-shrink-0" />
                {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
