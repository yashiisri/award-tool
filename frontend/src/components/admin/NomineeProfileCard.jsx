import { X, AlertTriangle, CheckCircle, Trophy, TrendingUp, User, Star, Building2, Briefcase } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function ScoreRing({ score }) {
  const pct = Math.round((score || 0) * 100)
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#0091DA' : '#f59e0b'

  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{pct}</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontWeight: 600 }}>%</span>
      </div>
    </div>
  )
}

function parseRationale(nominee) {
  const raw = nominee.rationale || ''
  if (nominee.biography || nominee.achievements || nominee.financial_impact) {
    return {
      biography: nominee.biography || '',
      achievements: nominee.achievements || [],
      financial_impact: nominee.financial_impact || '',
      awards_recognition: nominee.awards_recognition || [],
      selection_rationale: nominee.selection_rationale || raw,
    }
  }
  const sentences = raw.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10)
  const financialRe = /INR|USD|crore|billion|revenue|market cap|profit|turnover/i
  const achievementRe = /launched|led|founded|built|pioneered|transformed|expanded|achieved|won|ranked|awarded/i
  const awardRe = /award|honour|honor|recognition|ranked|conferred|prize|medal/i

  return {
    biography: sentences.filter(s => !financialRe.test(s) && !achievementRe.test(s)).slice(0, 2).join(' '),
    achievements: sentences.filter(s => achievementRe.test(s) && !financialRe.test(s)).slice(0, 4),
    financial_impact: sentences.filter(s => financialRe.test(s))[0] || '',
    awards_recognition: sentences.filter(s => awardRe.test(s)).slice(0, 3),
    selection_rationale: raw,
  }
}

export default function NomineeProfileCard({ nominee, onClose }) {
  const initials = getInitials(nominee.name)
  const parsed = parseRationale(nominee)
  const score = nominee.rationale_data?.confidence_score ?? 0
  const pct = Math.round(score * 100)
  const scoreColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#0091DA' : '#f59e0b'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', fontFamily: "'Inter', system-ui, sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero header */}
        <div style={{ position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden', background: 'linear-gradient(135deg, #00338D 0%, #0055B3 50%, #0091DA 100%)', padding: '32px 28px 28px' }}>
          {/* Subtle pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 2 }}>
            <X size={16} />
          </button>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Photo */}
            <div style={{ width: 88, height: 88, borderRadius: 16, border: '3px solid rgba(255,255,255,0.3)', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {nominee.photo_url ? (
                <img src={nominee.photo_url} alt={nominee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              ) : null}
              <span style={{ color: 'white', fontSize: 28, fontWeight: 900, display: nominee.photo_url ? 'none' : 'flex' }}>{initials}</span>
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>{nominee.name}</h2>
                {nominee.red_flagged && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20 }}>
                    <AlertTriangle size={10} /> Flagged
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 3 }}>
                <Briefcase size={12} />
                <span>{nominee.designation}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                <Building2 size={12} />
                <span>{nominee.organisation}</span>
              </div>
            </div>

            {/* Score ring */}
            {score > 0 && <ScoreRing score={score} />}
          </div>

          {/* Score bar */}
          {score > 0 && (
            <div style={{ position: 'relative', zIndex: 1, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Match Score</span>
                <span style={{ color: scoreColor, fontSize: 12, fontWeight: 700 }}>{pct}% relevance</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '0' }}>

          {/* Selection rationale */}
          {parsed.selection_rationale && (
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Star size={14} color="#00338D" />
                <span style={{ color: '#0A1628', fontWeight: 700, fontSize: 13 }}>Why This Nominee</span>
              </div>
              <p style={{ color: '#4A5568', fontSize: 13, lineHeight: 1.75, margin: 0 }}>{parsed.selection_rationale}</p>
            </div>
          )}

          {/* Key achievements */}
          {parsed.achievements.length > 0 && (
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={14} color="#00338D" />
                <span style={{ color: '#0A1628', fontWeight: 700, fontSize: 13 }}>Key Achievements</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsed.achievements.map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0091DA', marginTop: 6, flexShrink: 0 }} />
                    <span style={{ color: '#4A5568', fontSize: 13, lineHeight: 1.65 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Financial impact */}
          {parsed.financial_impact && (
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ color: '#6B7A8D', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Financial Impact</p>
                <p style={{ color: '#15803D', fontWeight: 700, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{parsed.financial_impact}</p>
              </div>
            </div>
          )}

          {/* Awards & recognition */}
          {parsed.awards_recognition.length > 0 && (
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Trophy size={14} color="#00338D" />
                <span style={{ color: '#0A1628', fontWeight: 700, fontSize: 13 }}>Awards & Recognition</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {parsed.awards_recognition.map((item, i) => (
                  <div key={i} style={{ background: '#F7F9FC', border: '1px solid #E8ECF0', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ color: '#4A5568', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {nominee.sources?.length > 0 && (
            <div style={{ padding: '16px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <p style={{ color: '#9BA8B5', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Verified Sources</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nominee.sources.map((s, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#EEF2FF', color: '#00338D', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(0,51,141,0.12)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Validated by */}
          {nominee.validated_by?.length > 0 && (
            <div style={{ padding: '16px 28px', borderBottom: '1px solid #F0F4F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={13} color="#22c55e" />
                <span style={{ color: '#9BA8B5', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Validated By</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nominee.validated_by.map((v, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#F0FDF4', color: '#15803D', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #BBF7D0' }}>{v}</span>
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
                {nominee.red_flagged_by && <p style={{ color: '#F87171', fontSize: 11, marginTop: 4 }}>By: {nominee.red_flagged_by}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
