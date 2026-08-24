import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

/**
 * ThemeToggle — a compact capsule switch, blue-toned, icon-only (no text).
 * Off/left = kpmg (dark navy treatment, moon icon), On/right = aima (light
 * background, sun icon) — the standard dark/light-mode toggle pattern, which
 * maps cleanly onto the two brand presentations without needing labels.
 *
 * `variant` controls track colour so it reads correctly on its background —
 * pass "dark" on a navy surface, "light" on a white one. `size` scales the
 * whole control ("sm" default, "xs" for tighter spots like Role Select).
 */
export default function ThemeToggle({ variant = 'dark', size = 'sm' }) {
  const { theme, setTheme } = useTheme()
  const isAima = theme === 'aima'
  const dark = variant === 'dark'

  const dims = size === 'xs'
    ? { w: 40, h: 20, thumb: 16, icon: 10 }
    : { w: 46, h: 23, thumb: 19, icon: 11 }

  return (
    <button
      type="button"
      onClick={() => setTheme(isAima ? 'kpmg' : 'aima')}
      aria-label="Toggle KPMG / AIMA theme"
      style={{
        position: 'relative',
        width: dims.w, height: dims.h,
        background: isAima
          ? 'linear-gradient(90deg, var(--kpmg-light-blue), var(--kpmg-blue))'
          : dark ? 'rgba(255,255,255,0.18)' : 'var(--border)',
        border: 'none',
        borderRadius: dims.h,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.25s ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: (dims.h - dims.thumb) / 2,
        left: isAima ? dims.w - dims.thumb - (dims.h - dims.thumb) / 2 : (dims.h - dims.thumb) / 2,
        width: dims.thumb, height: dims.thumb,
        borderRadius: '50%',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,20,60,0.35)',
        transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {isAima
          ? <Sun size={dims.icon} color="var(--kpmg-blue)" strokeWidth={2.2} />
          : <Moon size={dims.icon} color="var(--kpmg-navy)" strokeWidth={2.2} />
        }
      </span>
    </button>
  )
}
