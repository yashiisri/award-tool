import { Sparkles, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Same circular-photo profile-card treatment as the Admin section's nominee
// grid (ViewNominees.jsx) — the whole card is the tap target, opening the
// full dossier (NomineeProfileCard.jsx) on click.
export default function NomineeGridCard({ nominee, awardName, onClick, actions }) {
  const isFlagged   = nominee.red_flagged
  const isPending   = nominee.enrichment_status === 'pending'
  const isValidated = (nominee.validated_by?.length || 0) > 0
  const hasBadges   = isValidated || nominee.suggested_by || isFlagged || isPending

  return (
    <div
      onClick={onClick}
      className={`group bg-white border rounded-2xl overflow-hidden transition-all shadow-sm cursor-pointer ${
        isFlagged ? 'border-red-200' : isValidated ? 'border-emerald-200' : 'border-gray-100 hover:border-[#00338D]/25 hover:shadow-lg'
      }`}
    >
      {/* Header band + circular photo */}
      <div className="pt-4 pb-4 px-5 bg-gradient-to-b from-[#EEF2FA] to-white text-center">
        {/* Status badges — normal flow, above the circle, never overlapping it */}
        {hasBadges && (
          <div className="flex items-center justify-between gap-1 mb-3">
            <div className="flex gap-1 flex-wrap">
              {isValidated && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  <CheckCircle className="w-3 h-3" /> Approved
                </span>
              )}
              {nominee.suggested_by && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  <UserPlus className="w-3 h-3" /> Nominated
                </span>
              )}
            </div>
            <span>
              {isFlagged && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                  <AlertTriangle className="w-3 h-3" /> Flagged
                </span>
              )}
              {isPending && !isFlagged && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#00338D] text-white text-xs font-semibold rounded-full shadow-sm">
                  <Sparkles className="w-3 h-3 animate-pulse" /> Building profile
                </span>
              )}
            </span>
          </div>
        )}

        <div
          className={`w-20 h-20 rounded-full mx-auto overflow-hidden relative ring-4 ring-white ${nominee.photo_url ? 'shadow-md' : ''}`}
          style={{ background: nominee.photo_url ? 'linear-gradient(135deg, #00338D, #0057D9)' : '#E2E5EA' }}
        >
          {nominee.photo_url && (
            <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          )}
          <div className="w-full h-full items-center justify-center absolute inset-0" style={{ display: nominee.photo_url ? 'none' : 'flex' }}>
            <span className="text-[#6B7280] text-lg font-semibold">{getInitials(nominee.name)}</span>
          </div>
        </div>

        {awardName && (
          <p className="mt-3 text-[#00338D] text-xs font-bold uppercase tracking-wide truncate">{awardName}</p>
        )}
        <h3 className="mt-1 font-bold text-[#0A1628] text-[15px] leading-snug group-hover:text-[#00338D] transition-colors truncate">
          {nominee.name}
        </h3>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{nominee.designation}{nominee.organisation ? ` · ${nominee.organisation}` : ''}</p>
      </div>

      {actions && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-50 flex gap-1.5" onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  )
}
