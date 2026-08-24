import { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, Award, CheckCircle2, Users, ChevronDown, UserCheck } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const ACCENT = 'var(--kpmg-blue)'

function ProgressCard({ award, expanded, onToggle }) {
  const { award_name, voted_count, total_voters, percentage, voters } = award
  const complete = total_voters > 0 && voted_count === total_voters

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#EEF2FA] rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-[#00338D]" />
            </div>
            <p className="font-bold text-[#0A1628] text-sm truncate">{award_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {complete && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-end justify-between mb-2.5">
            <span className="text-3xl font-black" style={{ color: ACCENT, fontFamily: "'Playfair Display', serif" }}>{percentage}%</span>
            <span className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
              <Users className="w-3.5 h-3.5" /> {voted_count} jury member{voted_count === 1 ? '' : 's'} voted
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: complete ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #0057D9, #00338D)',
              }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-5 border-t border-gray-50 pt-4">
          {voters.length === 0 ? (
            <p className="text-gray-400 text-xs">No one has voted for this award yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {voters.map(name => (
                <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HJVotingProgress() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchProgress() }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/head-jury/voting-progress')
      setAwards(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <PageHeader
        icon={BarChart3}
        title="Voting Progress"
        subtitle="How much of the jury has voted so far — tap an award to see who"
        accent={ACCENT}
        light="#EEF3FF"
        action={
          <button
            onClick={fetchProgress}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#00338D] hover:border-[#00338D]/30 text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#00338D] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && awards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold text-sm mb-1">No award categories yet</p>
        </div>
      )}

      {!loading && awards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {awards.map(a => (
            <ProgressCard
              key={a.award_id}
              award={a}
              expanded={expandedId === a.award_id}
              onToggle={() => setExpandedId(prev => prev === a.award_id ? null : a.award_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
