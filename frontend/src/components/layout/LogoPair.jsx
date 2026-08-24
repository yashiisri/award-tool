/**
 * LogoPair — shows KPMG + AIMA logos correctly on any background.
 *
 * KPMG is a true vector (solid blue fill, transparent elsewhere) — on a dark
 * background it's shown as a clean reversed-white mark via filter, no box,
 * matching how KPMG's own brand guidelines display the reversed logo.
 *
 * AIMA is the official badge artwork — a bordered mark with its own light
 * background baked in, not a silhouette — so on a dark background it sits in
 * a small light card instead of being colour-filtered (which would just
 * flatten it to a white rectangle).
 *
 * variant="dark"  → navy/dark bg
 * variant="light" → white/light bg: both logos shown as-is (natural colours)
 */
import kpmgLogo from '../../kpmg-logo.svg'
import aimaLogo from '../../aima-logo.png'

export default function LogoPair({
  variant = 'dark',   // 'dark' | 'light'
  kpmgHeight = 28,
  aimaHeight = 32,
  gap = 14,
  showDivider = true,
}) {
  const isDark = variant === 'dark'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {/* KPMG — vector mark, reversed to white via filter on dark bg */}
      <img
        src={kpmgLogo}
        alt="KPMG"
        style={{
          height: kpmgHeight,
          objectFit: 'contain',
          filter: isDark ? 'brightness(0) invert(1)' : 'none',
          display: 'block',
        }}
      />

      {showDivider && (
        <div style={{ width: 1, height: Math.max(kpmgHeight, aimaHeight), background: isDark ? 'rgba(255,255,255,0.2)' : '#DDE1E7', flexShrink: 0 }} />
      )}

      {/* AIMA — official badge artwork with its own light background; wrap in a
          light card on dark backgrounds so the badge reads cleanly */}
      {isDark ? (
        <div style={{
          background: '#fff',
          padding: '3px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={aimaLogo} alt="AIMA" style={{ height: aimaHeight - 6, objectFit: 'contain', display: 'block' }} />
        </div>
      ) : (
        <img src={aimaLogo} alt="AIMA" style={{ height: aimaHeight, objectFit: 'contain', display: 'block' }} />
      )}
    </div>
  )
}
