import { useState } from 'react'
import { Info } from 'lucide-react'

// "You are here" strip shown at the top of every main portal page — first-time
// users have only ever done this process offline, so a breadcrumb plus a
// one-line "what do I do here" answer on hover replaces the guesswork.
export default function PageContextBar({ breadcrumb, helpText }) {
  const [hov, setHov] = useState(false)

  return (
    <div style={{
      background: '#EEF3FF', borderBottom: '1px solid var(--border-light)',
      padding: '9px 32px', minHeight: 38, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0, overflow: 'hidden' }}>
        {breadcrumb.map((part, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {i > 0 && <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: 11 }}>›</span>}
            <span style={{
              color: i === breadcrumb.length - 1 ? 'var(--kpmg-navy)' : 'var(--kpmg-blue)',
              fontWeight: i === breadcrumb.length - 1 ? 600 : 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {part}
            </span>
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <Info size={13} color="var(--kpmg-blue)" />
          <span style={{ fontSize: 11, color: 'var(--kpmg-blue)', fontWeight: 600, letterSpacing: '0.01em' }}>What do I do here?</span>
        </div>
        {hov && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 10, zIndex: 50,
            width: 300, boxSizing: 'border-box',
            background: '#fff', border: '1px solid var(--border-light)', borderTop: '2px solid var(--gold)',
            borderRadius: 8, padding: '14px 18px',
            boxShadow: '0 12px 32px rgba(0,20,60,0.14)',
          }}>
            <p style={{
              margin: '0 0 6px', fontFamily: "'Playfair Display', serif", fontSize: 12.5, fontWeight: 700,
              color: 'var(--kpmg-navy)', letterSpacing: '-0.005em',
            }}>
              On this page
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {helpText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
