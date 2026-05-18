import { useEffect, useRef, useState } from 'react'

// Sparkle particle
function Sparkle({ x, y, delay, size }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      animation: `sparkle 2.4s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
    }}>
      <svg viewBox="0 0 20 20" width={size} height={size}>
        <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z"
          fill="#FFD700" opacity="0.9"/>
      </svg>
    </div>
  )
}

export default function CrownScene() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const onMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -12, y: dx * 14 })
  }
  const onMouseLeave = () => setTilt({ x: 0, y: 0 })

  const sparkles = [
    { x: '18%', y: '12%', delay: 0,    size: 14 },
    { x: '78%', y: '8%',  delay: 0.6,  size: 10 },
    { x: '88%', y: '38%', delay: 1.1,  size: 8  },
    { x: '8%',  y: '42%', delay: 0.3,  size: 12 },
    { x: '50%', y: '5%',  delay: 0.9,  size: 9  },
    { x: '65%', y: '72%', delay: 1.5,  size: 7  },
    { x: '22%', y: '68%', delay: 0.7,  size: 11 },
  ]

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'crosshair',
      }}
    >
      {/* Sparkles */}
      {sparkles.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Glow behind crown */}
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
        animation: 'glowPulse 3s ease-in-out infinite',
      }}/>

      {/* Crown SVG with 3D tilt */}
      <div style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
        animation: 'floatCrown 4s ease-in-out infinite',
        transformStyle: 'preserve-3d',
      }}>
        <svg
          viewBox="0 0 340 300"
          width="340" height="300"
          style={{ filter: 'drop-shadow(0 12px 40px rgba(212,175,55,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))' }}
        >
          <defs>
            {/* Main gold gradient */}
            <linearGradient id="goldMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#FFFDE7"/>
              <stop offset="20%"  stopColor="#FFD700"/>
              <stop offset="55%"  stopColor="#C8960C"/>
              <stop offset="100%" stopColor="#7A5C00"/>
            </linearGradient>
            {/* Side/shadow gold */}
            <linearGradient id="goldDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#D4AF37"/>
              <stop offset="100%" stopColor="#5C4400"/>
            </linearGradient>
            {/* Rim gradient */}
            <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#8B6914"/>
              <stop offset="30%"  stopColor="#FFE082"/>
              <stop offset="60%"  stopColor="#D4AF37"/>
              <stop offset="100%" stopColor="#8B6914"/>
            </linearGradient>
            {/* Orb radial */}
            <radialGradient id="orbGold" cx="32%" cy="28%" r="65%">
              <stop offset="0%"   stopColor="#FFFDE7"/>
              <stop offset="40%"  stopColor="#FFD700"/>
              <stop offset="100%" stopColor="#7A5C00"/>
            </radialGradient>
            {/* Ruby */}
            <radialGradient id="ruby" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stopColor="#FF8A80"/>
              <stop offset="100%" stopColor="#B71C1C"/>
            </radialGradient>
            {/* Sapphire */}
            <radialGradient id="sapphire" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stopColor="#82B1FF"/>
              <stop offset="100%" stopColor="#1565C0"/>
            </radialGradient>
            {/* Shine sweep */}
            <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.35)"/>
              <stop offset="50%"  stopColor="rgba(255,255,255,0)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </linearGradient>
          </defs>

          {/* ── Drop shadow ellipse ── */}
          <ellipse cx="170" cy="288" rx="110" ry="12"
            fill="rgba(0,0,0,0.25)"/>

          {/* ── Base platform — isometric top face ── */}
          <ellipse cx="170" cy="248" rx="108" ry="22" fill="url(#goldRim)"/>
          {/* Base front face */}
          <path d="M62 248 L62 264 Q170 278 278 264 L278 248 Q170 262 62 248Z"
            fill="url(#goldDark)"/>
          {/* Base top shine */}
          <ellipse cx="170" cy="248" rx="108" ry="22" fill="url(#shine)" opacity="0.5"/>

          {/* ── Stem ── */}
          <path d="M148 220 L148 248 Q170 254 192 248 L192 220 Q170 226 148 220Z"
            fill="url(#goldDark)"/>
          <path d="M148 220 Q170 226 192 220 Q170 214 148 220Z"
            fill="url(#goldMain)"/>

          {/* ── Cup body — front face ── */}
          {/* Main cup shape */}
          <path d="
            M 60 200
            Q 58 160 80 130
            Q 100 105 130 100
            Q 150 96 170 95
            Q 190 96 210 100
            Q 240 105 260 130
            Q 282 160 280 200
            Q 225 215 170 218
            Q 115 215 60 200 Z
          " fill="url(#goldMain)"/>

          {/* Cup inner shadow */}
          <path d="
            M 80 200
            Q 78 165 96 140
            Q 115 118 145 112
            Q 158 109 170 108
            Q 182 109 195 112
            Q 225 118 244 140
            Q 262 165 260 200
            Q 215 212 170 214
            Q 125 212 80 200 Z
          " fill="rgba(0,0,0,0.12)"/>

          {/* Cup shine */}
          <path d="
            M 90 185
            Q 92 155 108 135
            Q 122 118 145 112
            Q 158 109 170 108
            L 170 214
            Q 125 212 90 185 Z
          " fill="url(#shine)" opacity="0.4"/>

          {/* ── Top rim of cup ── */}
          <ellipse cx="170" cy="100" rx="110" ry="20" fill="url(#goldRim)"/>
          <ellipse cx="170" cy="100" rx="110" ry="20" fill="url(#shine)" opacity="0.5"/>

          {/* ── Bottom rim of cup ── */}
          <ellipse cx="170" cy="218" rx="108" ry="18" fill="url(#goldRim)"/>

          {/* ── Handles ── */}
          {/* Left handle */}
          <path d="M 62 140 Q 20 140 18 170 Q 16 200 60 200"
            fill="none" stroke="url(#goldRim)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 62 140 Q 20 140 18 170 Q 16 200 60 200"
            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round"/>
          {/* Right handle */}
          <path d="M 278 140 Q 320 140 322 170 Q 324 200 280 200"
            fill="none" stroke="url(#goldRim)" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 278 140 Q 320 140 322 170 Q 324 200 280 200"
            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round"/>

          {/* ── Centre ruby gem ── */}
          <ellipse cx="170" cy="158" rx="18" ry="18" fill="url(#ruby)"/>
          <ellipse cx="165" cy="153" rx="7" ry="4.5" fill="rgba(255,255,255,0.5)"/>
          <ellipse cx="170" cy="158" rx="18" ry="18" fill="none"
            stroke="#8B0000" strokeWidth="1"/>

          {/* ── Left sapphire ── */}
          <ellipse cx="108" cy="162" rx="12" ry="12" fill="url(#sapphire)"/>
          <ellipse cx="104" cy="158" rx="4.5" ry="3" fill="rgba(255,255,255,0.5)"/>

          {/* ── Right sapphire ── */}
          <ellipse cx="232" cy="162" rx="12" ry="12" fill="url(#sapphire)"/>
          <ellipse cx="228" cy="158" rx="4.5" ry="3" fill="rgba(255,255,255,0.5)"/>

          {/* ── Orb on top rim ── */}
          <circle cx="170" cy="82" r="16" fill="url(#orbGold)"/>
          <circle cx="165" cy="77" r="5.5" fill="rgba(255,255,255,0.55)"/>
          <circle cx="170" cy="82" r="16" fill="none" stroke="#A07820" strokeWidth="1"/>

          {/* Left rim orb */}
          <circle cx="90"  cy="92" r="11" fill="url(#orbGold)"/>
          <circle cx="87"  cy="89" r="3.5" fill="rgba(255,255,255,0.5)"/>

          {/* Right rim orb */}
          <circle cx="250" cy="92" r="11" fill="url(#orbGold)"/>
          <circle cx="247" cy="89" r="3.5" fill="rgba(255,255,255,0.5)"/>

          {/* Far left orb */}
          <circle cx="42"  cy="108" r="9" fill="url(#orbGold)"/>
          <circle cx="40"  cy="106" r="3" fill="rgba(255,255,255,0.5)"/>

          {/* Far right orb */}
          <circle cx="298" cy="108" r="9" fill="url(#orbGold)"/>
          <circle cx="296" cy="106" r="3" fill="rgba(255,255,255,0.5)"/>

          {/* ── Arch lines connecting orbs ── */}
          <path d="M 42 108 Q 116 72 170 68 Q 224 72 298 108"
            fill="none" stroke="url(#goldRim)" strokeWidth="5" strokeLinecap="round"/>
          <path d="M 42 108 Q 116 72 170 68 Q 224 72 298 108"
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <style>{`
        @keyframes floatCrown {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
