import { X, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function ScoreBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#0091DA' : '#f59e0b'
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Match Score
        </span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{pct}% relevance</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function BulletSection({ title, bullets, accentColor = '#00338D' }) {
  if (!bullets || bullets.length === 0) return null
  return (
    <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
      <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{title}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: accentColor,
              marginTop: 6, flexShrink: 0,
            }} />
            <span style={{ color: '#4A5568', fontSize: 13, lineHeight: 1.7 }}>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function NomineeProfileCard({ nominee, onClose }) {
  const initials  = getInitials(nominee.name)
  const rd        = nominee.rationale_data || {}
  const score     = rd.confidence_score ?? 0
  const wikiUrl   = rd.wikipedia_url || nominee.wikipedia_url || ''

  // Structured rationale from new engine
  const aboutBullets      = rd.about_nominee      || []
  const rationBullets     = rd.selection_rationale || []
  const achievements      = rd.key_achievements    || []
  const awardsRec         = rd.awards_recognitions || []
  const financials        = rd.financials          || {}
  const bio               = rd.bio || nominee.rationale || ''

  // Fallback: parse bio into bullets if structured data is missing
  const hasStructured = aboutBullets.length > 0 || rationBullets.length > 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,22,40,0.65)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 20, width: '100%', maxWidth: 660,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Hero header ── */}
        <div style={{
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          background: 'linear-gradient(135deg, #00338D 0%, #0055B3 50%, #0091DA 100%)',
          padding: '32px 28px 24px', position: 'relative',
        }}>
          {/* Dot pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.07,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />

          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', zIndex: 2,
            }}
          >
            <X size={15} />
          </button>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            {/* Photo */}
            <div style={{
              width: 88, height: 88, borderRadius: 14,
              border: '3px solid rgba(255,255,255,0.3)',
              overflow: 'hidden', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {nominee.photo_url ? (
                <>
                  <img
                    src={nominee.photo_url}
                    alt={nominee.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                  />
                  <span style={{ color: 'white', fontSize: 28, fontWeight: 900, display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    {initials}
                  </span>
                </>
              ) : (
                <span style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>{initials}</span>
              )}
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                  {nominee.name}
                </h2>
                {nominee.red_flagged && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                    <AlertTriangle size={10} /> Flagged
                  </span>
                )}
              </div>
              {nominee.designation && (
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, margin: '0 0 3px' }}>
                  {nominee.designation}
                </p>
              )}
              {nominee.organisation && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 8px' }}>
                  {nominee.organisation}
                </p>
              )}
              {wikiUrl && (
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', background: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600,
                    borderRadius: 7, textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  Wikipedia <ExternalLink size={9} />
                </a>
              )}
            </div>
          </div>

          {score > 0 && <ScoreBar score={score} />}
        </div>

        {/* ── Body ── */}

        {/* Bio (intro paragraph) */}
        {bio && !hasStructured && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
            <p style={{ color: '#4A5568', fontSize: 13, lineHeight: 1.8, margin: 0 }}>{bio}</p>
          </div>
        )}

        {/* About the nominee — bullet points */}
        {aboutBullets.length > 0 && (
          <BulletSection title="About the Nominee" bullets={aboutBullets} accentColor="#00338D" />
        )}

        {/* Selection rationale — bullet points */}
        {rationBullets.length > 0 && (
          <BulletSection title="Selection Rationale" bullets={rationBullets} accentColor="#0091DA" />
        )}

        {/* Key achievements — fallback if no structured data */}
        {achievements.length > 0 && (
          <BulletSection title="Key Achievements" bullets={achievements} accentColor="#7F3F98" />
        )}

        {/* Financials */}
        {Object.values(financials).some(v => v) && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
            <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Financials</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(financials).map(([k, v]) => v ? (
                <div key={k} style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 8, padding: '10px 14px', flex: '1 1 180px',
                }}>
                  <p style={{ color: '#6B7A8D', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {k.replace(/_/g, ' ')}
                  </p>
                  <p style={{ color: '#15803D', fontWeight: 700, fontSize: 13, margin: 0 }}>{v}</p>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {/* Awards & Recognition */}
        {awardsRec.length > 0 && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
            <p style={{ color: '#0A1628', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Awards & Recognition</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {awardsRec.map((a, i) => (
                <span key={i} style={{
                  padding: '5px 12px', background: '#FFFBEB',
                  border: '1px solid #FDE68A', borderRadius: 8,
                  color: '#92400E', fontSize: 12, fontWeight: 600,
                }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Validated by */}
        {nominee.validated_by?.length > 0 && (
          <div style={{ padding: '16px 28px', borderBottom: '1px solid #F0F4F8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color="#22c55e" />
              <span style={{ color: '#9BA8B5', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Validated By
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {nominee.validated_by.map((v, i) => (
                <span key={i} style={{ padding: '4px 10px', background: '#F0FDF4', color: '#15803D', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #BBF7D0' }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Red flag */}
        {nominee.red_flagged && nominee.red_flag_reason && (
          <div style={{ padding: '16px 28px' }}>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ color: '#DC2626', fontWeight: 700, fontSize: 13 }}>Flagged</span>
              </div>
              <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{nominee.red_flag_reason}</p>
              {nominee.red_flagged_by && (
                <p style={{ color: '#F87171', fontSize: 11, marginTop: 4 }}>By: {nominee.red_flagged_by}</p>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </div>
  )
}
