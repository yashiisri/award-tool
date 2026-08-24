import { Sparkles, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const badgeSt = { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 9.5, fontWeight: 700, borderRadius: 20 }

// Same gold-swoosh / maroon-banner visual language as the full dossier's hero
// header (NomineeProfileCard.jsx) — used here as the collapsed grid tile so
// the two feel like one continuous view: photo card -> tap -> full dossier.
// The whole card is the tap target — no separate "View Profile" button.
export default function NomineeGridCard({ nominee, awardName, onClick, actions }) {
  const isFlagged   = nominee.red_flagged
  const isPending   = nominee.enrichment_status === 'pending'
  const isValidated = (nominee.validated_by?.length || 0) > 0
  const gid = nominee.id || nominee.name

  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div
        style={{
          position: 'relative', height: 270, overflow: 'hidden',
          background: 'linear-gradient(180deg, #6B6F5C 0%, #4A4D3F 55%, #34362C 100%)',
        }}
      >
        {nominee.photo_url ? (
          <img
            src={nominee.photo_url}
            alt={nominee.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,0.22)', fontFamily: "'Playfair Display', serif" }}>
              {getInitials(nominee.name)}
            </span>
          </div>
        )}

        {awardName && (
          <div style={{ position: 'absolute', top: 14, left: 16, right: 60, zIndex: 3 }}>
            <p style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13,
              color: '#E9C766', margin: 0, lineHeight: 1.3, textShadow: '0 2px 6px rgba(0,0,0,0.55)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {awardName}
            </p>
          </div>
        )}

        {(isValidated || nominee.suggested_by) && (
          <div style={{ position: 'absolute', bottom: 100, left: 16, zIndex: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isValidated && (
              <span style={{ ...badgeSt, background: 'rgba(34,197,94,0.92)', color: '#fff' }}>
                <CheckCircle size={10} /> Approved
              </span>
            )}
            {nominee.suggested_by && (
              <span style={{ ...badgeSt, background: 'rgba(212,160,23,0.92)', color: '#fff' }}>
                <UserPlus size={10} /> Nominated
              </span>
            )}
          </div>
        )}

        {isPending && (
          <span style={{
            position: 'absolute', top: 14, right: 14, zIndex: 4, display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', background: 'rgba(0,51,141,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20,
          }}>
            <Sparkles size={10} /> Enriching
          </span>
        )}
        {isFlagged && !isPending && (
          <span style={{
            position: 'absolute', top: 14, right: 14, zIndex: 4, display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20,
          }}>
            <AlertTriangle size={10} /> Flagged
          </span>
        )}

        <svg viewBox="0 0 400 270" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}>
          <defs>
            <linearGradient id={`ngc-maroon-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C1530" />
              <stop offset="100%" stopColor="#280A16" />
            </linearGradient>
            <linearGradient id={`ngc-gold-${gid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B98F32" />
              <stop offset="50%" stopColor="#F3DA8C" />
              <stop offset="100%" stopColor="#B98F32" />
            </linearGradient>
          </defs>
          <path d="M0,200 C90,155 145,215 200,196 C260,176 315,206 400,182 L400,270 L0,270 Z" fill={`url(#ngc-maroon-${gid})`} opacity="0.96" />
          <path d="M0,200 C90,155 145,215 200,196 C260,176 315,206 400,182" fill="none" stroke={`url(#ngc-gold-${gid})`} strokeWidth="2.5" />
        </svg>

        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 3 }}>
          <h3 style={{
            color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', margin: 0,
            textShadow: '0 2px 6px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {nominee.name}
          </h3>
          {nominee.designation && (
            <p style={{ color: 'rgba(255,255,255,0.94)', fontSize: 13, fontWeight: 600, margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nominee.designation}
            </p>
          )}
          {nominee.organisation && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nominee.organisation}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ padding: '12px 14px', display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  )
}
