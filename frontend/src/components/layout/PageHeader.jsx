export default function PageHeader({ icon: Icon, title, subtitle, action, accent = '#00338D', light = '#EEF2FA' }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: light }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#1a1a2e]">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
