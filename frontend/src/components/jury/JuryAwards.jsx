import { useState, useEffect } from 'react'
import { Award, Users, ChevronRight, CheckCircle, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

export default function JuryAwards() {
  const [awards, setAwards] = useState([])
  const [controls, setControls] = useState({})
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/jury/awards')
      setAwards(data)
      // fetch vote controls for each
      const ctrlRes = await api.get('/admin/vote-control')
      const map = {}
      ctrlRes.data.forEach(c => { map[c.award_id] = c })
      setControls(map)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="p-8">
      <PageHeader icon={Award} title="Award Categories" subtitle="Select an award to view nominees and cast your vote" accent="#0091DA" light="#EAF5FC" />

      {awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-[#EAF5FC] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-[#0091DA]" />
          </div>
          <p className="text-gray-500 font-semibold">No awards available yet</p>
          <p className="text-gray-400 text-sm mt-1">The admin will create awards for this cycle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {awards.map(award => {
            const ctrl = controls[award.id] || {}
            const votingOpen = ctrl.voting_enabled
            return (
              <div key={award.id} onClick={() => navigate(`/jury/nominees?award=${award.id}`)}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-[#0091DA]/20 transition-all cursor-pointer hover:-translate-y-0.5">
                {/* Top */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-[#EAF5FC] rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#0091DA]" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${votingOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {votingOpen ? <><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />Voting Open</> : <><Lock className="w-3 h-3" />Voting Closed</>}
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-[#1a1a2e] text-base mb-2">{award.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2">{award.description}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{award.num_nominees} nominees</span>
                  {award.results_published && (
                    <span className="flex items-center gap-1.5 text-green-600"><CheckCircle className="w-3.5 h-3.5" />Results out</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs text-[#0091DA] font-semibold">View Nominees</span>
                  <ChevronRight className="w-4 h-4 text-[#0091DA] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
