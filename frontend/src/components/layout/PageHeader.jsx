export default function PageHeader({ icon: Icon, title, subtitle, action, accent = '#00338D', light = '#EEF2FF' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
      paddingBottom: 20,
      borderBottom: '1px solid #F0F4F8',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={18} color={accent} strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0A1628',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            margin: 0,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              color: '#9BA8B5',
              fontSize: 13,
              fontWeight: 400,
              marginTop: 3,
              lineHeight: 1.5,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
