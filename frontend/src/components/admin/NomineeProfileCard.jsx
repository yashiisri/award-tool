import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, ExternalLink, Sparkles, Send, Flag, Award as AwardIcon } from 'lucide-react'
import { filterDisplaySources } from '../../utils/sourceDisplay'

const BLUE      = 'var(--kpmg-blue)'
const NAVY      = 'var(--kpmg-navy)'
const BLUE_TINT = '#EEF2FF'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function DiamondBullet({ color = BLUE }) {
  return (
    <svg width="7" height="7" viewBox="0 0 8 8" style={{ marginTop: 6, flexShrink: 0 }}>
      <path d="M4 0 L8 4 L4 8 L0 4 Z" fill={color} />
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      color: NAVY, fontWeight: 700, fontSize: 11, letterSpacing: '0.12em',
      textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ width: 14, height: 2, background: BLUE, display: 'inline-block', borderRadius: 1 }} />
      {children}
    </p>
  )
}

function BulletSection({ title, bullets }) {
  if (!bullets || bullets.length === 0) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionLabel>{title}</SectionLabel>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <DiamondBullet />
            <span style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.75 }}>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CriteriaRow({ criteria, score }) {
  if (!criteria?.length) return null
  const filled = Math.round((score || 0) * 5)
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionLabel>Evaluation Against Criteria</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {criteria.map(c => (
          <div key={c.id || c.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#4A5568', flex: 1, minWidth: 0 }}>{c.title}</span>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < filled ? BLUE : '#DCE6F5' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NomineeProfileCard({ nominee, onClose, awardName, award, role, onComment, onValidate, onFlag }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const [comment, setComment] = useState('')
  const [flagReason, setFlagReason] = useState('')
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [busy, setBusy] = useState(false)

  const initials  = getInitials(nominee.name)
  const rd        = nominee.rationale_data || {}
  const wikiUrl   = rd.wikipedia_url || nominee.wikipedia_url || ''

  const aboutBullets      = rd.about_nominee      || []
  const rationBullets     = rd.selection_rationale || []
  const achievements      = rd.key_achievements    || []
  const awardsRec         = rd.awards_recognitions || []
  const financials        = rd.financials          || {}
  const bio               = rd.bio || nominee.rationale || ''
  const pointsOfConcern   = rd.points_of_concern   || []
  const sourceLinks       = rd.source_links || nominee.sources || []
  const allRawSources     = wikiUrl && !sourceLinks.includes(wikiUrl) ? [wikiUrl, ...sourceLinks] : sourceLinks
  const displaySources    = filterDisplaySources(allRawSources)

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
          background: 'white', borderRadius: 20, width: '100%', maxWidth: 820,
          maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,20,60,0.35)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── ZONE 1 — Hero header ── */}
        <div style={{
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          position: 'relative', height: 280, flexShrink: 0,
          background: 'linear-gradient(160deg, #001A4D 0%, #00338D 55%, #0057D9 100%)',
        }}>
          {nominee.photo_url && !photoFailed ? (
            <img
              src={nominee.photo_url}
              alt={nominee.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%', opacity: 0.5, mixBlendMode: 'luminosity' }}
              onError={() => setPhotoFailed(true)}
            />
          ) : null}

          {/* Blue wash + subtle dot texture, replaces the old maroon/gold banner */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,26,77,0.35) 0%, rgba(0,26,77,0.55) 55%, rgba(0,15,43,0.92) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.5 }} />

          {!nominee.photo_url || photoFailed ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 64, fontWeight: 800, color: 'rgba(255,255,255,0.16)', fontFamily: "'Playfair Display', serif" }}>{initials}</span>
            </div>
          ) : null}

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 4,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white',
            }}
          >
            <X size={14} />
          </button>

          {(awardName || award?.name) && (
            <div style={{ position: 'absolute', top: 18, left: 22, right: 60, zIndex: 3 }}>
              <p style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16,
                color: '#BFD6FF', margin: 0, lineHeight: 1.3,
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                {awardName || award?.name}
              </p>
            </div>
          )}

          {nominee.red_flagged && (
            <span style={{
              position: 'absolute', top: 68, right: 14, zIndex: 3,
              display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
              background: 'rgba(255,255,255,0.95)', color: NAVY, fontSize: 10, fontWeight: 700, borderRadius: 20,
              border: `1px solid ${BLUE}`,
            }}>
              <AlertTriangle size={9} /> Flagged
            </span>
          )}

          {/* Name + role */}
          <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22, zIndex: 3 }}>
            <h2 style={{ color: 'white', fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
              {nominee.name}
            </h2>
            {nominee.designation && (
              <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13.5, fontWeight: 600, margin: '6px 0 0' }}>
                {nominee.designation}
              </p>
            )}
            {nominee.organisation && (
              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, margin: '2px 0 0' }}>
                {nominee.organisation}
              </p>
            )}
          </div>
        </div>

        {/* ── ZONE 2 — Two-column body ── */}
        {!bio && !hasStructured && nominee.enrichment_status === 'pending' && (
          <div style={{ padding: '18px 28px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: BLUE_TINT }}>
            <Sparkles size={13} color={BLUE} />
            <p style={{ color: BLUE, fontSize: 12.5, fontWeight: 600, margin: 0 }}>Profile is being built — check back in a moment.</p>
          </div>
        )}
        {!bio && !hasStructured && nominee.enrichment_status === 'no_data_found' && (
          <div style={{ padding: '18px 28px', borderBottom: '1px solid #EEF2FF', flexShrink: 0 }}>
            <p style={{ color: '#6B7A8D', fontSize: 12.5, margin: 0 }}>No public profile information was found for this nominee yet.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 36, padding: '28px 28px 8px' }}>
          {/* Left column */}
          <div style={{ minWidth: 0 }}>
            {bio && !hasStructured && (
              <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.85, margin: '0 0 24px' }}>{bio}</p>
            )}
            <BulletSection title="About the Nominee" bullets={aboutBullets} />
            <BulletSection title="Selection Rationale" bullets={rationBullets} />
            <BulletSection title="Key Achievements" bullets={achievements} />

            {pointsOfConcern.length > 0 && (
              <div style={{ padding: '16px 18px', background: BLUE_TINT, border: `1px solid rgba(0,51,141,0.18)`, borderRadius: 10, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <AlertTriangle size={13} color={BLUE} />
                  <span style={{ color: NAVY, fontWeight: 700, fontSize: 12 }}>Points to Consider</span>
                  <span style={{ color: '#5878A8', fontSize: 10 }}>· from public reporting</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pointsOfConcern.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <DiamondBullet />
                      <span style={{ color: '#1E3A6E', fontSize: 12.5, lineHeight: 1.7 }}>{p}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ color: '#5878A8', fontSize: 10.5, marginTop: 10, marginBottom: 0 }}>
                  These points are for jury consideration only and do not constitute a finding.
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ minWidth: 0 }}>
            {Object.values(financials).some(v => v) && (
              <div style={{ marginBottom: 24 }}>
                <SectionLabel>Financial Overview</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(financials).map(([k, v]) => v ? (
                    <div key={k} style={{ borderLeft: `3px solid ${BLUE}`, paddingLeft: 12 }}>
                      <p style={{ color: '#8A99B3', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                        {k.replace(/_/g, ' ')}
                      </p>
                      <p style={{ color: NAVY, fontWeight: 700, fontSize: 16, fontFamily: "'Playfair Display', serif", margin: 0 }}>{v}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {awardsRec.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SectionLabel>Awards &amp; Recognitions</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {awardsRec.map((a, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                      <AwardIcon size={13} color={BLUE} style={{ flexShrink: 0, marginTop: 1 }} />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <CriteriaRow criteria={award?.aima_criteria} score={rd.confidence_score} />

            <div>
              <SectionLabel>Verified Sources</SectionLabel>
              {displaySources.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {displaySources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                      background: BLUE_TINT, color: BLUE, fontSize: 10.5, fontWeight: 600,
                      textDecoration: 'none', border: '1px solid rgba(0,51,141,0.12)', borderRadius: 6,
                    }}>
                      {s.label} <ExternalLink size={8} />
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9BA8B5', fontSize: 11.5, margin: 0 }}>Source documentation available on request.</p>
              )}
            </div>
          </div>
        </div>

        {nominee.validated_by?.length > 0 && (
          <div style={{ padding: '0 28px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={BLUE} />
              <span style={{ color: '#8A99B3', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Validated By</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {nominee.validated_by.map((v, i) => (
                <span key={i} style={{ padding: '4px 10px', background: BLUE_TINT, color: BLUE, fontSize: 11, fontWeight: 600, border: '1px solid rgba(0,51,141,0.15)', borderRadius: 6 }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {nominee.red_flagged && nominee.red_flag_reason && (
          <div style={{ padding: '0 28px 20px', flexShrink: 0 }}>
            <div style={{ background: BLUE_TINT, border: `1px solid rgba(0,51,141,0.18)`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <AlertTriangle size={13} color={BLUE} />
                <span style={{ color: NAVY, fontWeight: 700, fontSize: 12.5 }}>Flagged</span>
              </div>
              <p style={{ color: '#1E3A6E', fontSize: 12.5, margin: 0 }}>{nominee.red_flag_reason}</p>
              {nominee.red_flagged_by && <p style={{ color: '#5878A8', fontSize: 11, marginTop: 4 }}>By: {nominee.red_flagged_by}</p>}
            </div>
          </div>
        )}

        {/* ── ZONE 3 — Sticky bottom action bar ── */}
        {(onComment || onValidate || onFlag) && (
          <div style={{
            borderTop: '1px solid #EEF2FF', padding: '16px 28px', flexShrink: 0,
            position: 'sticky', bottom: 0, background: '#fff',
            display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap',
          }}>
            {onComment && (
              <div style={{ flex: 1, minWidth: 220, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)} rows={1}
                  placeholder="Add your assessment notes for this nominee..."
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={submitComment} disabled={busy || !comment.trim()} style={{
                  padding: '9px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8,
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
                    <span style={{ padding: '9px 14px', background: BLUE_TINT, color: BLUE, fontSize: 11, fontWeight: 700, border: `1px solid rgba(0,51,141,0.2)`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={12} /> Validated
                    </span>
                  ) : (
                    <button onClick={submitValidate} disabled={busy} style={{
                      padding: '9px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8,
                      fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <CheckCircle size={12} /> Validate
                    </button>
                  )
                )}
                {onFlag && !showFlagInput && (
                  <button onClick={() => setShowFlagInput(true)} style={{
                    padding: '9px 14px', background: '#fff', color: BLUE, border: `1px solid rgba(0,51,141,0.35)`, borderRadius: 8,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
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
                  style={{ flex: 1, padding: '9px 12px', border: `1px solid rgba(0,51,141,0.3)`, borderRadius: 8, fontSize: 12.5, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={submitFlag} disabled={busy || !flagReason.trim()} style={{
                  padding: '9px 14px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: !flagReason.trim() ? 0.5 : 1,
                }}>
                  Confirm
                </button>
                <button onClick={() => { setShowFlagInput(false); setFlagReason('') }} style={{
                  padding: '9px 14px', background: '#fff', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, cursor: 'pointer',
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
