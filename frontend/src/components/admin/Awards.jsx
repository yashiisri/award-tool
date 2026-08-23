import { useState, useEffect } from 'react'
import { Plus, Award, X, Trash2, ChevronRight, Users, CheckSquare, Trophy, Sparkles, TrendingUp, Grid3X3, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import PageHeader from '../layout/PageHeader'

const CRITERIA = [
  { id: 'governance', label: 'Governance & Societal Responsibilities' },
  { id: 'org_performance', label: 'Organisational Performance' },
  { id: 'general', label: 'General Eligibility' },
]
const CRITERIA_DETAILS = {
  governance: ['Contribution to society and nation at large', 'Personal values, ethics and corporate integrity', 'Contribution to positive evolution of government policy', 'Contribution towards globalisation of Indian economy'],
  org_performance: ['Display of corporate courage and leadership', 'Contribution towards evolving appropriate management culture', 'Contribution towards development of management profession', 'Vision and support for innovation and new ideas'],
  general: ['Organisation must be operating in India', 'Business must have contributed substantially to Indian economy', 'Nominations of individuals from their own organisations will be considered'],
}

// Small, on-brand accent rotation reused from the role-select palette — not an arbitrary rainbow.
const ACCENTS = [
  { text: 'text-[#00338D]', bg: 'bg-[#EEF2FF]', solid: 'bg-[#00338D]' },
  { text: 'text-[#0891B2]', bg: 'bg-[#ECFEFF]', solid: 'bg-[#0891B2]' },
  { text: 'text-[#6D28D9]', bg: 'bg-[#F3F0FF]', solid: 'bg-[#6D28D9]' },
]

function AwardCard({ award, index, onDelete, onClick }) {
  const accent = ACCENTS[index % ACCENTS.length]
  return (
    <div
      onClick={onClick}
      className="group hover-lift animate-fade-in-up bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer hover:border-[#00338D]/20 hover:shadow-lg hover:shadow-[#00338D]/5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${accent.bg} rounded-xl flex items-center justify-center icon-pop`}>
          <Trophy className={`w-5 h-5 ${accent.text}`} />
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(award.id, e) }}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="font-bold text-[#0A1628] text-[15px] mb-1.5 tracking-tight">{award.name}</h3>
      <p className="text-gray-400 text-[13px] leading-relaxed mb-4 line-clamp-2">{award.description}</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${accent.bg} ${accent.text}`}>
          <Users className="w-2.5 h-2.5" /> {award.num_nominees} nominees
        </span>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${accent.bg} ${accent.text}`}>
          <CheckSquare className="w-2.5 h-2.5" /> {award.criteria?.length || 3} criteria
        </span>
      </div>

      <div className="flex items-center justify-between pt-3.5 border-t border-gray-50">
        <span className={`text-xs font-semibold ${accent.text}`}>View Nominees</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent.solid} transition-transform group-hover:translate-x-0.5`}>
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  )
}

function AwardRow({ award, index, onDelete, onClick }) {
  const accent = ACCENTS[index % ACCENTS.length]
  return (
    <div
      onClick={onClick}
      className="animate-fade-in-up flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-5 py-4 cursor-pointer hover:border-[#00338D]/20 hover:shadow-md transition-shadow"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent.solid}`}>
        <Trophy className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[#0A1628] text-sm truncate">{award.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${accent.bg} ${accent.text} flex-shrink-0`}>{award.num_nominees}</span>
        </div>
        <p className="text-gray-400 text-xs truncate">{award.description}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(award.id, e) }}
        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </div>
  )
}

export default function Awards() {
  const [awards, setAwards] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [form, setForm] = useState({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
  const navigate = useNavigate()

  useEffect(() => { fetchAwards() }, [])

  const fetchAwards = async () => {
    try { const { data } = await api.get('/admin/awards'); setAwards(data) } catch (err) { console.error(err) }
  }
  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post('/admin/awards', form)
      setDrawerOpen(false)
      setForm({ name: '', description: '', num_nominees: 5, criteria: ['governance', 'org_performance', 'general'] })
      fetchAwards()
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }
  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this award and all its nominees?')) return
    try { await api.delete(`/admin/awards/${id}`); fetchAwards() } catch (err) { console.error(err) }
  }
  const toggleCriteria = (id) => {
    const c = form.criteria
    setForm({ ...form, criteria: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }

  const totalNominees = awards.reduce((s, a) => s + (a.num_nominees || 0), 0)

  const stats = [
    { label: 'Total Awards', value: awards.length, icon: Trophy },
    { label: 'Total Nominees', value: totalNominees, icon: Users },
    { label: 'Criteria Sets', value: awards.length * 3, icon: CheckSquare },
    { label: 'Avg. Nominees', value: awards.length ? Math.round(totalNominees / awards.length) : 0, icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      <PageHeader
        icon={Award} title="Awards" subtitle="Create and manage award categories for this cycle" accent="#00338D" light="#EEF2FF"
        action={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white text-[#00338D] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-lg hover:shadow-[#00338D]/20"
            >
              <Plus className="w-4 h-4" /> New Award
            </button>
          </div>
        }
      />

      {/* Stats strip */}
      {awards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <div key={label} className="animate-fade-in-up bg-white border border-gray-100 rounded-xl p-4" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <Icon className="w-3.5 h-3.5 text-[#0091DA]" />
              </div>
              <span className="text-2xl font-extrabold text-[#0A1628] tracking-tight">{value}</span>
            </div>
          ))}
        </div>
      )}

      {awards.length === 0 ? (
        <div className="animate-fade-in-up flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-[#EEF2FF] rounded-2xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-[#00338D]" />
          </div>
          <p className="text-[#0A1628] font-bold text-[15px] mb-1">No awards yet</p>
          <p className="text-gray-400 text-sm mb-5">Create your first award to get started.</p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Award
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {awards.map((award, i) => (
            <AwardCard key={award.id} award={award} index={i} onDelete={handleDelete} onClick={() => navigate(`/admin/nominees?award=${award.id}`)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {awards.map((award, i) => (
            <AwardRow key={award.id} award={award} index={i} onDelete={handleDelete} onClick={() => navigate(`/admin/nominees?award=${award.id}`)} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false) }}
        >
          <div className="absolute inset-0 bg-[#0A1628]/40 backdrop-blur-sm" />
          <div className="animate-slide-in-right relative w-full max-w-md h-full bg-white overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex items-start justify-between px-7 py-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#00338D] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#0A1628] tracking-tight">New Award</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Configure details & criteria</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-7 py-6 flex flex-col gap-5 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Award Name *</label>
                <input
                  type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  placeholder="e.g. Business Leader of the Year"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] text-sm focus:outline-none focus:ring-2 focus:ring-[#00338D]/25 focus:border-[#00338D]/40 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description *</label>
                <textarea
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required
                  rows={4} placeholder="Describe the purpose and significance of this award..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00338D]/25 focus:border-[#00338D]/40 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Number of Nominees</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1" max="20" value={form.num_nominees}
                    onChange={e => setForm({ ...form, num_nominees: parseInt(e.target.value) })}
                    className="w-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#0A1628] text-sm focus:outline-none focus:ring-2 focus:ring-[#00338D]/25 focus:border-[#00338D]/40 transition-all"
                  />
                  <span className="text-xs text-gray-400">nominees per award (1–20)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Evaluation Criteria</label>
                <div className="flex flex-col gap-2">
                  {CRITERIA.map(({ id, label }) => {
                    const on = form.criteria.includes(id)
                    const isExp = expanded === id
                    return (
                      <div key={id} className={`rounded-xl overflow-hidden border transition-colors ${on ? 'border-[#00338D]/30 bg-[#F5F8FF]' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleCriteria(id)}>
                          <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors ${on ? 'bg-[#00338D] border-[#00338D]' : 'bg-white border-gray-300'}`}>
                            {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span className="flex-1 text-[13px] font-semibold text-[#0A1628]">{label}</span>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setExpanded(isExp ? null : id) }}
                            className="text-[11px] font-bold text-[#00338D] bg-[#00338D]/10 hover:bg-[#00338D]/20 px-2.5 py-1 rounded-full transition-colors"
                          >
                            {isExp ? 'Hide' : 'Details'}
                          </button>
                        </div>
                        {isExp && (
                          <div className="px-4 pb-3.5 pt-0 border-t border-[#00338D]/10">
                            <ul className="mt-2.5 flex flex-col gap-1.5">
                              {CRITERIA_DETAILS[id].map((pt, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                                  <div className="w-1 h-1 rounded-full bg-[#00338D] mt-1.5 flex-shrink-0" />
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-auto pt-2 flex gap-3">
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-3.5 bg-[#00338D] text-white rounded-xl font-semibold text-sm hover:bg-[#002a73] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : 'Create Award'}
                </button>
                <button type="button" onClick={() => setDrawerOpen(false)} className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
