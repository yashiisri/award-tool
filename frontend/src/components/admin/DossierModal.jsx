import { useRef } from 'react'
import { X, Printer, CheckCircle, AlertTriangle } from 'lucide-react'
import kpmgLogo from '../../kpmg-logo.png'
import { filterDisplaySources } from '../../utils/sourceDisplay'

// Reads the actual structured AI research (nominee.rationale_data — the same
// object NomineeProfileCard.jsx renders) instead of the flat nominee.rationale
// text, so the printed dossier carries the real biography, achievements,
// financials and reasoning the research pipeline produced, not a crude
// regex re-guess at them from a single paragraph.
function parseRationale(nominee) {
  const rd = nominee.rationale_data || {}
  const hasStructured = (rd.about_nominee?.length || rd.selection_rationale?.length || rd.key_achievements?.length || rd.bio)

  if (hasStructured) {
    return {
      bio: rd.bio || '',
      about: rd.about_nominee || [],
      selectionRationale: Array.isArray(rd.selection_rationale)
        ? rd.selection_rationale
        : (rd.selection_rationale ? [rd.selection_rationale] : []),
      achievements: rd.key_achievements || [],
      financials: rd.financials || {},
      awardsRecognition: rd.awards_recognitions || [],
    }
  }

  // Legacy fallback — a manually-entered nominee with only a flat rationale
  // string and none of the structured research fields.
  const raw = nominee.rationale || ''
  return {
    bio: '',
    about: [],
    selectionRationale: raw ? [raw] : [],
    achievements: [],
    financials: {},
    awardsRecognition: [],
  }
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function DossierModal({ award, nominees, onClose }) {
  const printRef = useRef(null)

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>${award.name} — Dossier</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            color: #1a1a2e;
            background: white;
            line-height: 1.6;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; }
          }
          ${PRINT_STYLES}
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const approved = nominees.filter(n => n.validated)
  const flagged = nominees.filter(n => n.red_flagged)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-gray-200">

        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-white flex-shrink-0" style={{ borderBottom: '2px solid var(--kpmg-blue)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--kpmg-blue)' }}>
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 15, color: 'var(--kpmg-navy)' }}>Award Dossier</p>
              <p className="text-xs text-gray-400">{award.name} · {nominees.length} nominee{nominees.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ background: 'var(--kpmg-blue)', letterSpacing: '0.04em' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--kpmg-navy)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--kpmg-blue)'}
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dossier content — scrollable preview */}
        <div className="flex-1 overflow-y-auto">
          <div ref={printRef} id="dossier-body">

            {/* ── Cover page ── */}
            <div className="dossier-cover">
              <div className="dossier-cover-header">
                <img src={kpmgLogo} alt="KPMG" className="dossier-logo" />
                <div className="dossier-cover-line" />
              </div>

              <div className="dossier-cover-body">
                <p className="dossier-cover-eyebrow">AWARD DOSSIER</p>
                <h1 className="dossier-cover-title">{award.name}</h1>
                {award.description && (
                  <p className="dossier-cover-desc">{award.description}</p>
                )}

                <div className="dossier-cover-stats">
                  <div className="dossier-stat-box">
                    <span className="dossier-stat-num">{nominees.length}</span>
                    <span className="dossier-stat-label">Total Nominees</span>
                  </div>
                  <div className="dossier-stat-box">
                    <span className="dossier-stat-num" style={{ color: '#22c55e' }}>{approved.length}</span>
                    <span className="dossier-stat-label">Approved</span>
                  </div>
                  <div className="dossier-stat-box">
                    <span className="dossier-stat-num" style={{ color: flagged.length > 0 ? '#ef4444' : '#9BA8B5' }}>{flagged.length}</span>
                    <span className="dossier-stat-label">Flagged</span>
                  </div>
                </div>
              </div>

              <div className="dossier-cover-footer">
                <span>Prepared by KPMG NobleCrest.AI</span>
                <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
                <span>{today}</span>
                <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
                <span>Confidential</span>
              </div>
            </div>

            {/* ── Table of contents ── */}
            <div className="dossier-section" style={{ paddingTop: 32 }}>
              <p className="dossier-section-eyebrow">Contents</p>
              <h2 className="dossier-section-title">Nominees Overview</h2>
              <div className="dossier-toc">
                {nominees.map((nom, i) => (
                  <div key={nom.id} className="dossier-toc-row">
                    <span className="dossier-toc-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="dossier-toc-name">{nom.name}</span>
                    <span className="dossier-toc-dots" />
                    <div className="dossier-toc-meta">
                      <span className="dossier-toc-role">{nom.designation}</span>
                      {nom.validated && (
                        <span className="dossier-badge-approved">Approved</span>
                      )}
                      {nom.red_flagged && (
                        <span className="dossier-badge-flagged">Flagged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Nominee profiles ── */}
            {nominees.map((nom, i) => {
              const parsed = parseRationale(nom)
              const sources = filterDisplaySources(nom.rationale_data?.source_links || nom.sources || [])

              return (
                <div key={nom.id} className={`dossier-profile ${i > 0 ? 'page-break' : ''}`}>

                  {/* Profile header */}
                  <div className="dossier-profile-header">
                    <div className="dossier-profile-avatar">
                      {nom.photo_url && (
                        <img src={nom.photo_url} alt={nom.name} className="dossier-avatar-img"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                      )}
                      <span className="dossier-avatar-initials" style={{ display: nom.photo_url ? 'none' : 'flex' }}>{getInitials(nom.name)}</span>
                    </div>
                    <div className="dossier-profile-meta">
                      <div className="dossier-profile-badges">
                        <span className="dossier-nominee-num">Nominee {String(i + 1).padStart(2, '0')}</span>
                        {nom.validated && <span className="dossier-badge-approved"><CheckCircle size={11} style={{ marginRight: 3, verticalAlign: -1 }} />Approved</span>}
                        {nom.red_flagged && <span className="dossier-badge-flagged"><AlertTriangle size={11} style={{ marginRight: 3, verticalAlign: -1 }} />Flagged</span>}
                      </div>
                      <h2 className="dossier-profile-name">{nom.name}</h2>
                      <div className="dossier-profile-role">
                        <span>{nom.designation}</span>
                        <span className="dossier-dot">·</span>
                        <span>{nom.organisation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dossier-profile-body">

                    {/* Biography */}
                    {parsed.bio && (
                      <div className="dossier-field">
                        <p className="dossier-field-label">Biography</p>
                        <p className="dossier-field-text">{parsed.bio}</p>
                      </div>
                    )}

                    {/* About the nominee */}
                    {parsed.about.length > 0 && (
                      <div className="dossier-field">
                        <p className="dossier-field-label">About the Nominee</p>
                        <ul className="dossier-list">
                          {parsed.about.map((item, j) => (
                            <li key={j} className="dossier-list-item">
                              <span className="dossier-bullet" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Selection rationale */}
                    {parsed.selectionRationale.length > 0 && (
                      <div className="dossier-field">
                        <p className="dossier-field-label">Nomination Rationale</p>
                        {parsed.selectionRationale.length > 1 ? (
                          <ul className="dossier-list">
                            {parsed.selectionRationale.map((item, j) => (
                              <li key={j} className="dossier-list-item">
                                <span className="dossier-bullet" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="dossier-field-text">{parsed.selectionRationale[0]}</p>
                        )}
                      </div>
                    )}

                    {/* Key achievements */}
                    {parsed.achievements.length > 0 && (
                      <div className="dossier-field">
                        <p className="dossier-field-label">Key Achievements</p>
                        <ul className="dossier-list">
                          {parsed.achievements.map((item, j) => (
                            <li key={j} className="dossier-list-item">
                              <span className="dossier-bullet" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="dossier-two-col">
                      {/* Financial overview */}
                      {Object.values(parsed.financials).some(v => v) && (
                        <div className="dossier-field dossier-highlight-green">
                          <p className="dossier-field-label" style={{ color: '#15803D' }}>Financial Overview</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(parsed.financials).filter(([, v]) => v).map(([k, v]) => (
                              <div key={k}>
                                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4D9B6D' }}>{k.replace(/_/g, ' ')}</p>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#15803D' }}>{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Awards & recognition */}
                      {parsed.awardsRecognition.length > 0 && (
                        <div className="dossier-field">
                          <p className="dossier-field-label">Awards &amp; Recognition</p>
                          <ul className="dossier-list">
                            {parsed.awardsRecognition.map((item, j) => (
                              <li key={j} className="dossier-list-item">
                                <span className="dossier-bullet dossier-bullet-gold" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Points to consider — AI-surfaced from real news search, never invented */}
                    {(nom.rationale_data?.points_of_concern || []).length > 0 && (
                      <div className="dossier-field dossier-highlight-amber">
                        <p className="dossier-field-label" style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <AlertTriangle size={11} />Points to Consider <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#A88332' }}>&nbsp;· from public reporting</span>
                        </p>
                        <ul className="dossier-list">
                          {nom.rationale_data.points_of_concern.map((item, j) => (
                            <li key={j} className="dossier-list-item">
                              <span className="dossier-bullet" style={{ background: '#D97706' }} />
                              <span style={{ color: '#92400E' }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Flag reason */}
                    {nom.red_flagged && nom.red_flag_reason && (
                      <div className="dossier-field dossier-highlight-red">
                        <p className="dossier-field-label" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={11} />Flag Reason</p>
                        <p className="dossier-field-text" style={{ color: '#DC2626' }}>{nom.red_flag_reason}</p>
                        {nom.red_flagged_by && <p style={{ color: '#F87171', fontSize: 11, marginTop: 4 }}>Raised by: {nom.red_flagged_by}</p>}
                      </div>
                    )}

                    {/* Verified sources */}
                    {sources.length > 0 && (
                      <div className="dossier-field">
                        <p className="dossier-field-label">Verified Sources</p>
                        <div className="dossier-source-tags">
                          {sources.map((s, j) => <span key={j} className="dossier-source-tag">{s.label}</span>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer strip */}
                  <div className="dossier-profile-footer">
                    <span>{award.name}</span>
                    <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
                    <span>KPMG NobleCrest.AI</span>
                    <span style={{ opacity: 0.4, margin: '0 8px' }}>·</span>
                    <span>Confidential</span>
                    <span className="dossier-footer-right">{today}</span>
                  </div>
                </div>
              )
            })}

          </div>
        </div>
      </div>

      {/* Scoped styles for dossier */}
      <style>{`
        #dossier-body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          color: #1a1a2e;
          background: white;
        }

        /* Cover */
        .dossier-cover {
          background: linear-gradient(145deg, #00338D 0%, #004ccc 60%, #00338D 100%);
          min-height: 420px;
          padding: 40px 48px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .dossier-cover::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .dossier-cover-header {
          display: flex; align-items: center; gap: 16px; margin-bottom: 48px; position: relative;
        }
        .dossier-logo { height: 40px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .dossier-cover-line { width: 1px; height: 28px; background: rgba(255,255,255,0.3); }
        .dossier-cover-body { flex: 1; position: relative; }
        .dossier-cover-eyebrow {
          color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px;
        }
        .dossier-cover-title {
          font-family: 'Playfair Display', serif;
          color: white; font-size: 36px; font-weight: 600;
          letter-spacing: -0.01em; line-height: 1.15; margin-bottom: 14px; max-width: 600px;
        }
        .dossier-cover-desc {
          color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.7; max-width: 560px; margin-bottom: 36px;
        }
        .dossier-cover-stats {
          display: flex; gap: 24px;
        }
        .dossier-stat-box {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px; padding: 16px 20px; min-width: 100px; text-align: center;
        }
        .dossier-stat-num { display: block; color: white; font-size: 28px; font-weight: 900; line-height: 1; }
        .dossier-stat-label { display: block; color: rgba(255,255,255,0.55); font-size: 11px; font-weight: 600; margin-top: 4px; }
        .dossier-cover-footer {
          margin-top: 32px; color: rgba(255,255,255,0.45); font-size: 11px; position: relative;
        }

        /* Section */
        .dossier-section { padding: 32px 48px; border-bottom: 1px solid #F0F4F8; }
        .dossier-section-eyebrow {
          color: #00338D; font-size: 10px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; margin-bottom: 6px;
        }
        .dossier-section-title {
          font-family: 'Playfair Display', serif;
          color: #0A1628; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 20px;
        }

        /* Table of contents */
        .dossier-toc { display: flex; flex-direction: column; gap: 2px; }
        .dossier-toc-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 0; border-bottom: 1px solid #F7F9FC;
        }
        .dossier-toc-num { color: #9BA8B5; font-size: 11px; font-weight: 700; width: 24px; flex-shrink: 0; }
        .dossier-toc-name { color: #0A1628; font-size: 13px; font-weight: 600; min-width: 160px; }
        .dossier-toc-dots { flex: 1; border-bottom: 1px dotted #D0D8E4; margin: 0 8px; }
        .dossier-toc-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .dossier-toc-role { color: #9BA8B5; font-size: 11px; }

        /* Badges */
        .dossier-badge-approved { padding: 2px 8px; background: #DCFCE7; color: #15803D; font-size: 10px; font-weight: 700; border-radius: 20px; border: 1px solid #BBF7D0; }
        .dossier-badge-flagged  { padding: 2px 8px; background: #FEE2E2; color: #DC2626; font-size: 10px; font-weight: 700; border-radius: 20px; border: 1px solid #FECACA; }
        .dossier-badge-ai       { padding: 2px 8px; background: linear-gradient(90deg,#EDE9FE,#E0F2FE); color: #00338D; font-size: 10px; font-weight: 700; border-radius: 20px; border: 1px solid #C7D2FE; }

        /* Profile page */
        .dossier-profile { background: white; }
        .dossier-profile-header {
          display: flex; align-items: flex-start; gap: 24px;
          padding: 32px 48px 24px;
          background: linear-gradient(135deg, #F7F9FC 0%, #EEF2FA 100%);
          border-bottom: 1px solid #E8ECF0;
        }
        .dossier-profile-avatar {
          width: 80px; height: 80px; border-radius: 14px; overflow: hidden; flex-shrink: 0;
          background: linear-gradient(135deg, #00338D, #00338D);
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(0,51,141,0.15);
        }
        .dossier-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .dossier-avatar-initials { color: white; font-size: 24px; font-weight: 900; }
        .dossier-profile-meta { flex: 1; min-width: 0; }
        .dossier-profile-badges { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
        .dossier-nominee-num { color: #00338D; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .dossier-profile-name { font-family: 'Playfair Display', serif; color: #0A1628; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; margin-bottom: 6px; }
        .dossier-profile-role { color: #6B7A8D; font-size: 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
        .dossier-dot { margin: 0 8px; opacity: 0.4; }
        .dossier-score-row { display: flex; align-items: center; gap: 10px; }
        .dossier-score-label { color: #9BA8B5; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .dossier-score-bar-wrap { flex: 1; max-width: 160px; height: 5px; background: #E8ECF0; border-radius: 3px; overflow: hidden; }
        .dossier-score-bar { height: 100%; background: linear-gradient(90deg, #00338D, #00338D); border-radius: 3px; }
        .dossier-score-pct { color: #00338D; font-size: 11px; font-weight: 700; }

        /* Profile body */
        .dossier-profile-body { padding: 24px 48px 28px; display: flex; flex-direction: column; gap: 20px; }
        .dossier-field {}
        .dossier-field-label {
          color: #00338D; font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #EEF2FF; padding-bottom: 6px;
        }
        .dossier-field-text { color: #3D4F63; font-size: 13px; line-height: 1.75; }
        .dossier-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .dossier-list-item { display: flex; align-items: flex-start; gap: 10px; }
        .dossier-bullet { width: 5px; height: 5px; border-radius: 50%; background: #00338D; margin-top: 6px; flex-shrink: 0; }
        .dossier-bullet-gold { background: #F59E0B; }
        .dossier-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .dossier-highlight-green { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 14px 16px; }
        .dossier-highlight-red { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 14px 16px; }
        .dossier-highlight-amber { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px 16px; }
        .dossier-source-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .dossier-source-tag {
          padding: 3px 10px; background: #EEF2FF; color: #00338D;
          font-size: 11px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(0,51,141,0.12);
        }

        /* Profile footer */
        .dossier-profile-footer {
          padding: 10px 48px; background: #F7F9FC; border-top: 1px solid #E8ECF0;
          font-size: 10px; color: #9BA8B5; font-weight: 500; display: flex; align-items: center;
        }
        .dossier-footer-right { margin-left: auto; }
      `}</style>
    </div>
  )
}

// Print-only styles (injected into print window)
const PRINT_STYLES = `
  .dossier-cover { min-height: 100vh; page-break-after: always; }
  .dossier-section { page-break-after: always; }
  .dossier-profile { page-break-inside: avoid; }
  .page-break { page-break-before: always; }
  .dossier-cover { background: linear-gradient(145deg, #00338D 0%, #004ccc 60%, #00338D 100%) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .dossier-profile-header { background: linear-gradient(135deg, #F7F9FC 0%, #EEF2FA 100%) !important; }
  .dossier-profile-avatar { background: linear-gradient(135deg, #00338D, #00338D) !important; }
  .dossier-score-bar { background: linear-gradient(90deg, #00338D, #00338D) !important; }
  .dossier-cover-title { color: white !important; }
  .dossier-cover-desc { color: rgba(255,255,255,0.65) !important; }
  .dossier-stat-num { color: white !important; }
  .dossier-badge-ai { background: linear-gradient(90deg,#EDE9FE,#E0F2FE) !important; }
`
