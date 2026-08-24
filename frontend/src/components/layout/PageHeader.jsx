/**
 * PageHeader — the standard section header used across every dashboard screen.
 *
 * `accent` optionally overrides the icon box + title colour for role-specific
 * pages (jury = kpmg-light-blue, head jury = kpmg-purple) while keeping the
 * same sharp-cornered, serif-headline executive treatment everywhere. Omit it
 * to get the default navy/blue admin treatment.
 */
export default function PageHeader({ icon: Icon, title, subtitle, action, accent }) {
  const iconColor = accent || 'var(--kpmg-blue)'
  const titleColor = accent || 'var(--kpmg-navy)'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: 28,
      paddingBottom: 20,
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div style={{
            width: 38, height: 38,
            background: iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={16} color="#fff" strokeWidth={1.6} />
          </div>
        )}
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 600,
            color: titleColor,
            letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3, fontWeight: 400 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
