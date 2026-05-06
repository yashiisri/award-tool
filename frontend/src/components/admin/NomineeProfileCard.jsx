import { X, AlertTriangle, CheckCircle, Trophy, TrendingUp, User, Star } from 'lucide-react'

// Generate initials from name
function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase()
}

// Parse rationale into structured sections
// Rationale can be a plain string or contain structured data
function parseRationale(nominee) {
  const raw = nominee.rationale || ''

  // If nominee has explicit structured fields, use them
  if (nominee.biography || nominee.achievements || nominee.financial_impact || nominee.awards_recognition) {
    return {
      biography: nominee.biography || '',
      achievements: nominee.achievements || [],
      financial_impact: nominee.financial_impact || '',
      awards_recognition: nominee.awards_recognition || [],
      selection_rationale: nominee.selection_rationale || raw,
    }
  }

  // Parse from raw rationale text — split into sentences and categorise
  const sentences = raw.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10)

  // Heuristic: financial sentences contain INR / USD / crore / billion / revenue
  const financialKeywords = /INR|USD|crore|billion|revenue|market cap|capitalisation|profit|turnover/i
  const achievementKeywords = /launched|led|founded|built|pioneered|transformed|expanded|achieved|won|ranked|conferred|awarded|partnered/i

  const financialSentences = sentences.filter(s => financialKeywords.test(s))
  const achievementSentences = sentences.filter(s => achievementKeywords.test(s) && !financialKeywords.test(s))
  const otherSentences = sentences.filter(s => !financialKeywords.test(s) && !achievementKeywords.test(s))

  // Financial impact: pick the most impactful financial sentence
  const financial_impact = financialSentences[0] || ''

  // Awards & Recognition: sentences with award/honour/recognition keywords
  const awardKeywords = /award|honour|honor|recognition|ranked|conferred|knight|legion|prize|medal/i
  const awards_recognition = sentences.filter(s => awardKeywords.test(s)).slice(0, 4)

  // Key achievements: bullet-worthy sentences
  const achievements = achievementSentences.slice(0, 5)

  // Biography: first 2 non-financial, non-achievement sentences
  const biography = otherSentences.slice(0, 2).join(' ')

  // Selection rationale: full text
  const selection_rationale = raw

  return { biography, achievements, financial_impact, awards_recognition, selection_rationale }
}

export default function NomineeProfileCard({ nominee, onClose }) {
  const initials = getInitials(nominee.name)
  const parsed = parseRationale(nominee)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="relative rounded-t-2xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, #1a4a7a 0%, #0e7490 60%, #0891b2 100%)'
        }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-10">
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-6 p-8">
            {/* Initials avatar */}
            <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {nominee.photo_url ? (
                <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <span className="text-white text-2xl font-black tracking-tight">{initials}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white">{nominee.name}</h2>
                {nominee.red_flagged && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                    <AlertTriangle className="w-3 h-3" /> Flagged
                  </span>
                )}
              </div>
              <p className="text-white/85 text-base font-medium">{nominee.designation}</p>
              <p className="text-white/65 text-sm mt-0.5">{nominee.organisation}</p>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="divide-y divide-gray-100">

          {/* Awards & Recognition */}
          {parsed.awards_recognition.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-[#0e7490]" />
                <h3 className="font-bold text-[#1a1a2e] text-sm">Awards & Recognition</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {parsed.awards_recognition.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-gray-700 text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection Rationale */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#0e7490]" />
              <h3 className="font-bold text-[#1a1a2e] text-sm">Selection Rationale</h3>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <p className="text-gray-600 text-sm leading-relaxed">{parsed.selection_rationale}</p>
            </div>
          </div>

          {/* Biography */}
          {parsed.biography && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#0e7490]" />
                <h3 className="font-bold text-[#1a1a2e] text-sm">Biography</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{parsed.biography}</p>
            </div>
          )}

          {/* Key Achievements */}
          {parsed.achievements.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#0e7490]" />
                <h3 className="font-bold text-[#1a1a2e] text-sm">Key Achievements</h3>
              </div>
              <ul className="space-y-2.5">
                {parsed.achievements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 bg-[#0e7490] rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Financial Impact */}
          {parsed.financial_impact && (
            <div className="p-6">
              <div className="p-5 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Financial Impact</p>
                <p className="text-green-700 font-bold text-base leading-relaxed">{parsed.financial_impact}</p>
              </div>
            </div>
          )}

          {/* Sources */}
          {nominee.sources?.length > 0 && (
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources</p>
              <div className="flex flex-wrap gap-2">
                {nominee.sources.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-[#EEF2FA] text-[#00338D] text-xs rounded-lg font-medium border border-[#00338D]/10">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Red Flag */}
          {nominee.red_flagged && nominee.red_flag_reason && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-red-700 text-sm">Flagged</span>
                </div>
                <p className="text-red-600 text-sm">{nominee.red_flag_reason}</p>
                <p className="text-red-400 text-xs mt-1">By: {nominee.red_flagged_by}</p>
              </div>
            </div>
          )}

          {/* Validated by */}
          {nominee.validated_by?.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Validated By</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {nominee.validated_by.map((v, i) => (
                  <span key={i} className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
