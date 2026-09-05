import { Sparkles, AlertTriangle, CheckCircle, UserPlus, Loader2 } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Same restrained profile-card treatment as the Admin section's nominee grid
// (ViewNominees.jsx) — plain text status indicators instead of bright pill
// badges, a navy-tinted photo placeholder instead of a gradient, and a subtle
// colored top border for state instead of a coloured header band. Shared by
// Admin, Jury, and Head Jury so all three read as the same document, not
// three different card systems. The whole card is the tap target, opening
// the full dossier (NomineeProfileCard.jsx) on click.
export default function NomineeGridCard({ nominee, onClick, actions }) {
  const isFlagged        = nominee.red_flagged
  const isPending        = nominee.enrichment_status === 'pending'
  const isValidated      = (nominee.validated_by?.length || 0) > 0
  const pendingApproval  = !!nominee.suggested_by && !isValidated
  const hasBadges        = isValidated || pendingApproval || isFlagged || isPending

  return (
    <div
      onClick={onClick}
      className="group bg-white border rounded-lg overflow-hidden transition-all cursor-pointer"
      style={{
        borderColor: isFlagged ? '#FCA5A5' : isValidated ? '#A7D9BE' : 'var(--border-light)',
        borderTopWidth: 3,
        borderTopColor: isFlagged ? '#DC2626' : isValidated ? '#15803D' : 'var(--border-light)',
      }}
    >
      <div
        className="pt-4 pb-4 px-5 text-center"
        style={{ background: 'linear-gradient(180deg, #F7F9FC 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border-light)' }}
      >
        {/* Status — plain text + icon, normal flow above the circle, never overlapping it */}
        {hasBadges && (
          <div className="flex items-center justify-between gap-1 mb-3">
            <span>
              {isValidated && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#15803D' }}>
                  <CheckCircle className="w-3 h-3" /> Approved
                </span>
              )}
              {pendingApproval && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--gold-bright)' }}>
                  <UserPlus className="w-3 h-3" /> Pending Approval
                </span>
              )}
            </span>
            <span>
              {isFlagged && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#DC2626' }}>
                  <AlertTriangle className="w-3 h-3" /> Flagged
                </span>
              )}
              {isPending && !isFlagged && (
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Building profile
                </span>
              )}
            </span>
          </div>
        )}

        <div
          className="w-16 h-16 rounded-full mx-auto overflow-hidden relative"
          style={{
            background: nominee.photo_url ? 'transparent' : '#EEF3FF',
            boxShadow: '0 0 0 3px #fff, 0 0 0 4px var(--border-light)',
          }}
        >
          {nominee.photo_url && (
            <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          )}
          <div className="w-full h-full items-center justify-center absolute inset-0" style={{ display: nominee.photo_url ? 'none' : 'flex' }}>
            <span style={{ color: 'var(--kpmg-blue)' }} className="text-lg font-semibold">{getInitials(nominee.name)}</span>
          </div>
        </div>

        <h3
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-3 font-semibold text-[#0A1628] text-[15px] leading-snug group-hover:text-[#00338D] transition-colors truncate"
        >
          {nominee.name}
        </h3>
        <div style={{ width: 22, height: 2, background: 'var(--gold)', margin: '6px auto 0' }} />
        <p className="text-gray-500 text-xs mt-2 truncate">{nominee.designation}{nominee.organisation ? ` · ${nominee.organisation}` : ''}</p>
      </div>

      <div className="px-4 pb-4">
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 min-h-[2.2em] text-center">
          {nominee.rationale || (isPending ? 'Researching biography and rationale…' : '')}
        </p>

        {actions && (
          <div className="flex gap-1.5 pt-3 border-t border-gray-50" onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
