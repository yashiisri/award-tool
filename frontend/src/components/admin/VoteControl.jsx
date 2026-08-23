import { useState, useEffect } from 'react'
import { Settings, Clock, Calendar } from 'lucide-react'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function VoteControl() {
  const [awards, setAwards] = useState([])
  const [controls, setControls] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [awardsRes, controlsRes] = await Promise.all([
        api.get('/admin/awards'),
        api.get('/admin/vote-control'),
      ])
      setAwards(awardsRes.data)
      const map = {}
      controlsRes.data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch (err) { console.error(err) }
  }

  const save = async (awardId) => {
    setSaving({ ...saving, [awardId]: true })
    const ctrl = controls[awardId] || {}
    try {
      await api.post('/admin/vote-control', {
        award_id: awardId,
        voting_enabled: ctrl.voting_enabled || false,
        nomination_enabled: ctrl.nomination_enabled || false,
        voting_start: ctrl.voting_start || null,
        voting_end: ctrl.voting_end || null,
      })
    } catch (err) { console.error(err) }
    finally { setSaving({ ...saving, [awardId]: false }) }
  }

  const update = (awardId, field, value) => {
    setControls({ ...controls, [awardId]: { ...(controls[awardId] || {}), [field]: value } })
  }

  const Toggle = ({ active, onClick }) => (
    <button type="button" onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${active ? 'bg-[#00338D]' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${active ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  )

  return (
    <div className="p-8">
      <PageHeader icon={Settings} title="Vote Control" subtitle="Control when jury and head jury can vote and nominate" accent="#00338D" light="#EEF2FA" />

      {awards.length === 0 ? (
        <div className="animate-fade-in-up flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-14 h-14 bg-[#EEF2FA] rounded-2xl flex items-center justify-center mb-4">
            <Settings className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-gray-500 font-semibold">No awards to configure</p>
          <p className="text-gray-400 text-sm mt-1">Create awards first to set up vote controls.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {awards.map((award, i) => {
            const ctrl = controls[award.id] || {}
            return (
              <div key={award.id} className="animate-fade-in-up bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-black text-[#1a1a2e] text-base">{award.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{award.description}</p>
                  </div>
                  <button onClick={() => save(award.id)} disabled={saving[award.id]}
                    className="px-4 py-2 bg-[#00338D] text-white rounded-xl text-xs font-semibold hover:bg-[#002a73] disabled:opacity-50 transition-colors">
                    {saving[award.id] ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Voting toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-[#1a1a2e] text-sm">Voting Enabled</div>
                      <div className="text-gray-400 text-xs mt-0.5">Allow jury to cast votes</div>
                    </div>
                    <Toggle active={ctrl.voting_enabled || false} onClick={() => update(award.id, 'voting_enabled', !ctrl.voting_enabled)} />
                  </div>

                  {/* Nomination toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-[#1a1a2e] text-sm">Nominations Open</div>
                      <div className="text-gray-400 text-xs mt-0.5">Allow adding/editing nominees</div>
                    </div>
                    <Toggle active={ctrl.nomination_enabled || false} onClick={() => update(award.id, 'nomination_enabled', !ctrl.nomination_enabled)} />
                  </div>

                  {/* Voting window */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-[#00338D]" />
                      <span className="font-semibold text-[#1a1a2e] text-sm">Voting Start</span>
                    </div>
                    <input type="datetime-local" value={ctrl.voting_start || ''}
                      onChange={e => update(award.id, 'voting_start', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#1a1a2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#00338D]/30" />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-[#00338D]" />
                      <span className="font-semibold text-[#1a1a2e] text-sm">Voting End</span>
                    </div>
                    <input type="datetime-local" value={ctrl.voting_end || ''}
                      onChange={e => update(award.id, 'voting_end', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#1a1a2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#00338D]/30" />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${ctrl.voting_enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ctrl.voting_enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    Voting {ctrl.voting_enabled ? 'Open' : 'Closed'}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${ctrl.nomination_enabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ctrl.nomination_enabled ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                    Nominations {ctrl.nomination_enabled ? 'Open' : 'Closed'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
