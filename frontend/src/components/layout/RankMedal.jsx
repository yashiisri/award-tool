/**
 * RankMedal — a clean, professional rank-1/2/3 indicator: a small solid
 * circle in gold/silver/bronze with the position number, matching the sharp
 * KPMG/AIMA executive design system. Used everywhere a medal emoji (🥇🥈🥉)
 * used to be — those read as decorative/AI-generated on a corporate tool.
 *
 * `rank` is 1-based. Ranks beyond 3 render a plain numbered badge instead.
 */
const TIERS = {
  1: { bg: 'linear-gradient(135deg, #D4AF37, #B8860B)', ring: 'rgba(212,175,55,0.35)' },
  2: { bg: 'linear-gradient(135deg, #B0B7C0, #8A94A0)', ring: 'rgba(176,183,192,0.35)' },
  3: { bg: 'linear-gradient(135deg, #C08552, #9C6B3E)', ring: 'rgba(192,133,82,0.35)' },
}

export default function RankMedal({ rank, size = 26 }) {
  const tier = TIERS[rank]

  if (!tier) {
    return (
      <span style={{
        width: size, height: size, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-2, #F4F5F7)', color: 'var(--text-muted, #8896A7)',
        fontSize: size * 0.42, fontWeight: 700, borderRadius: '50%',
      }}>
        {rank}
      </span>
    )
  }

  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tier.bg, color: '#fff',
      fontSize: size * 0.44, fontWeight: 700, borderRadius: '50%',
      boxShadow: `0 0 0 3px ${tier.ring}`,
    }}>
      {rank}
    </span>
  )
}
