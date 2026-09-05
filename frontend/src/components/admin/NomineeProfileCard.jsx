import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Sparkles, Send, Flag } from 'lucide-react'
import { filterDisplaySources } from '../../utils/sourceDisplay'

const BLUE      = 'var(--kpmg-blue)'
const NAVY      = 'var(--kpmg-navy)'
const BLUE_TINT = '#EEF2FF'
const INK       = '#1A2333'
const BODY      = '#2D3648'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Matches the reference dossier document format: plain header (name / org /
// designation), then a series of "Section Name:" headings each followed by a
// bulleted list, and a final "Source:" list of full URLs — a single-column,
// document-style read rather than a card/tile dashboard layout.

function Bullets({ heading, items, emptyText }) {
  const has = items && items.length > 0
  if (!has && !emptyText) return null
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ color: INK, fontWeight: 700, fontSize: 14, margin: '0 0 8px' }}>{heading}:</p>
      {has ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 9, paddingLeft: 2 }}>
              <span style={{ color: BODY, fontSize: 13.5, lineHeight: 1.4 }}>•</span>
              <span style={{ color: BODY, fontSize: 13.5, lineHeight: 1.8 }}>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#8A99B3', fontSize: 13, fontStyle: 'italic', margin: 0 }}>{emptyText}</p>
      )}
    </div>
  )
}

export default function NomineeProfileCard({ nominee, onClose, awardName, award, role, onComment, onValidate, onFlag }) {
  const [comment, setComment] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  const rd        = nominee.rationale_data || {}
  const wikiUrl   = rd.wikipedia_url || nominee.wikipedia_url || ''

  const aboutBullets    = rd.about_nominee      || []
  const rationBullets   = rd.selection_rationale || []
  const activityBullets = rd.recent_activity     || []
  const achievements    = rd.key_achievements    || []
  const awardsRec       = rd.awards_recognitions || []
  const bio             = rd.bio || nominee.rationale || ''
  const pointsOfConcern = rd.points_of_concern   || []
  const sourceLinks     = rd.source_links || nominee.sources || []
  const allRawSources   = wikiUrl && !sourceLinks.includes(wikiUrl) ? [wikiUrl, ...sourceLinks] : sourceLinks
  const displaySources  = filterDisplaySources(allRawSources)

  const hasStructured = aboutBullets.length > 0 || rationBullets.length > 0
  const isValidated = (nominee.validated_by?.length || 0) > 0

  const submitComment = async () => {
    if (!comment.trim() || !onComment) return
    setBusy(true)
    try { await onComment(nominee.id, comment); setComment('') } finally { setBusy(false) }
  }
  const submitFlag = async () => {
    if (!flagReason.trim() || !onFlag) return
    setBusy(true)
    try { await onFlag(nominee.id, flagReason); setFlagReason(''); setShowFlagInput(false) } finally { setBusy(false) }
  }
  const submitValidate = async () => {
    if (!onValidate) return
    setBusy(true)
    try { await onValidate(nominee.id) } finally { setBusy(false) }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,16,40,0.68)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 14, width: '100%', maxWidth: 760,
          maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,20,60,0.35)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header — photo + name, tinted band like the nominee grid cards ── */}
        <div style={{
          padding: '32px 44px 24px', flexShrink: 0, position: 'relative',
          background: 'linear-gradient(180deg, #F7F9FC 0%, #FFFFFF 100%)',
          borderBottom: '1px solid #EEF2F7',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 28, height: 28, borderRadius: '50%',
              background: '#F3F5F9', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#6B7A8D',
            }}
          >
            <X size={14} />
          </button>

          {(awardName || award?.name) && (
            <p style={{
              color: '#8A99B3', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.1em',
              textTransform: 'uppercase', margin: '0 0 16px',
            }}>
              {awardName || award?.name}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', position: 'relative',
                background: nominee.photo_url && !photoFailed ? 'transparent' : BLUE_TINT,
                boxShadow: '0 0 0 3px #fff, 0 0 0 4px #EEF2F7',
              }}
            >
              {nominee.photo_url && !photoFailed && (
                <img
                  src={nominee.photo_url} alt={nominee.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setPhotoFailed(true)}
                />
              )}
              {(!nominee.photo_url || photoFailed) && (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: BLUE, fontSize: 22, fontWeight: 700 }}>{getInitials(nominee.name)}</span>
                </div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <h2 style={{ color: INK, fontSize: 21, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                {nominee.name}
              </h2>
              <div style={{ width: 22, height: 2, background: 'var(--gold)', margin: '7px 0' }} />
              {nominee.organisation && (
                <p style={{ color: BODY, fontSize: 14, margin: 0 }}>{nominee.organisation}</p>
              )}
              {nominee.designation && (
                <p style={{ color: BODY, fontSize: 14, margin: '2px 0 0' }}>{nominee.designation}</p>
              )}
            </div>
          </div>

          {(nominee.red_flagged || isValidated) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {isValidated && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: BLUE_TINT, color: BLUE, fontSize: 10.5, fontWeight: 700, borderRadius: 4 }}>
                  <CheckCircle size={10} /> Validated
                </span>
              )}
              {nominee.red_flagged && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', background: '#FEF2F2', color: '#DC2626', fontSize: 10.5, fontWeight: 700, borderRadius: 4 }}>
                  <AlertTriangle size={10} /> Flagged
                </span>
              )}
            </div>
          )}
        </div>

        {!bio && !hasStructured && nominee.enrichment_status === 'pending' && (
          <div style={{ margin: '0 44px 20px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, background: BLUE_TINT, borderRadius: 8 }}>
            <Sparkles size={13} color={BLUE} />
            <p style={{ color: BLUE, fontSize: 12.5, fontWeight: 600, margin: 0 }}>Profile is being built — check back in a moment.</p>
          </div>
        )}
        {!bio && !hasStructured && nominee.enrichment_status === 'no_data_found' && (
          <div style={{ margin: '0 44px 20px' }}>
            <p style={{ color: '#6B7A8D', fontSize: 12.5, margin: 0 }}>No public profile information was found for this nominee yet.</p>
          </div>
        )}

        {/* ── Document body — single column ── */}
        <div style={{ padding: '0 44px 8px' }}>
          {bio && !hasStructured && (
            <p style={{ color: BODY, fontSize: 13.5, lineHeight: 1.85, margin: '0 0 22px' }}>{bio}</p>
          )}

          <Bullets heading="About the nominee" items={aboutBullets} />
          <Bullets heading="Selection rationale" items={rationBullets} />
          <Bullets heading="Recent activity" items={activityBullets} />
          <Bullets heading="Key achievements" items={achievements} />
          <Bullets heading="Awards and recognitions" items={awardsRec} />
          <Bullets
            heading="Points to consider"
            items={pointsOfConcern}
            emptyText="No concerns identified in available public sources."
          />

          {displaySources.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ color: INK, fontWeight: 700, fontSize: 14, margin: '0 0 8px' }}>Source:</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {displaySources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: BLUE, fontSize: 12, textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {nominee.red_flagged && nominee.red_flag_reason && (
          <div style={{ padding: '0 44px 20px', flexShrink: 0 }}>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <AlertTriangle size={13} color="#DC2626" />
                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 12.5 }}>Flagged</span>
              </div>
              <p style={{ color: '#991B1B', fontSize: 12.5, margin: 0 }}>{nominee.red_flag_reason}</p>
              {nominee.red_flagged_by && <p style={{ color: '#B91C1C', fontSize: 11, marginTop: 4 }}>By: {nominee.red_flagged_by}</p>}
            </div>
          </div>
        )}

        {nominee.validated_by?.length > 0 && (
          <div style={{ padding: '0 44px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={BLUE} />
              <span style={{ color: '#8A99B3', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Validated By</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {nominee.validated_by.map((v, i) => (
                <span key={i} style={{ padding: '4px 10px', background: BLUE_TINT, color: BLUE, fontSize: 11, fontWeight: 600, border: '1px solid rgba(0,51,141,0.15)', borderRadius: 4 }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Sticky bottom action bar ── */}
        {(onComment || onValidate || onFlag) && (
          <div style={{
            borderTop: '1px solid #EEF2FF', padding: '16px 44px', flexShrink: 0,
            position: 'sticky', bottom: 0, background: '#fff',
            display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap',
          }}>
            {onComment && (
              <div style={{ flex: 1, minWidth: 220, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)} rows={1}
                  placeholder="Add your assessment notes for this nominee..."
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12.5, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={submitComment} disabled={busy || !comment.trim()} style={{
                  padding: '9px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 5,
                  fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  opacity: !comment.trim() ? 0.5 : 1,
                }}>
                  <Send size={12} /> Submit
                </button>
              </div>
            )}

            {(onValidate || onFlag) && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {onValidate && (
                  isValidated ? (
                    <span style={{ padding: '9px 14px', background: BLUE_TINT, color: BLUE, fontSize: 11, fontWeight: 700, border: `1px solid rgba(0,51,141,0.2)`, borderRadius: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={12} /> Validated
                    </span>
                  ) : (
                    <button onClick={submitValidate} disabled={busy} style={{
                      padding: '9px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 5,
                      fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <CheckCircle size={12} /> Validate
                    </button>
                  )
                )}
                {onFlag && !showFlagInput && (
                  <button onClick={() => setShowFlagInput(true)} style={{
                    padding: '9px 14px', background: '#fff', color: 'var(--text-muted)', border: `1px solid var(--border-light)`, borderRadius: 5,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)' }}>
                    <Flag size={12} /> Flag Concern
                  </button>
                )}
              </div>
            )}

            {onFlag && showFlagInput && (
              <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  value={flagReason} onChange={e => setFlagReason(e.target.value)} autoFocus
                  placeholder="Reason for flagging…"
                  style={{ flex: 1, padding: '9px 12px', border: `1px solid rgba(0,51,141,0.3)`, borderRadius: 5, fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={submitFlag} disabled={busy || !flagReason.trim()} style={{
                  padding: '9px 14px', background: NAVY, color: '#fff', border: 'none', borderRadius: 5,
                  fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: !flagReason.trim() ? 0.5 : 1,
                }}>
                  Confirm
                </button>
                <button onClick={() => { setShowFlagInput(false); setFlagReason('') }} style={{
                  padding: '9px 14px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
