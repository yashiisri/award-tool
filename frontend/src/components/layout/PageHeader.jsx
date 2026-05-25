export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.02em', marginBottom: 2 }}>{title}</h1>
        {subtitle && <p style={{ color: '#9BA8B5', fontSize: 13, fontWeight: 400 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
