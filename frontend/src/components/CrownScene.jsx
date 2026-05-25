import { useRef, useState } from 'react'

function Particle({ x, y, delay, size, color }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      animation: `particleDrift 4s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
      opacity: 0,
    }} />
  )
}

export default function CrownScene() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const containerRef = useRef(null)

  const onMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -10, y: dx * 12 })
  }
  const onMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false) }
  const onMouseEnter = () => setHovered(true)

  const particles = [
    { x: '12%', y: '18%', delay: 0,   size: 4, color: '#0091DA' },
    { x: '82%', y: '14%', delay: 0.8, size: 3, color: '#00A3A1' },
    { x: '88%', y: '58%', delay: 1.4, size: 5, color: '#0091DA' },
    { x: '8%',  y: '62%', delay: 0.4, size: 3, color: '#4DB8FF' },
    { x: '50%', y: '6%',  delay: 1.0, size: 4, color: '#00A3A1' },
    { x: '72%', y: '82%', delay: 1.8, size: 3, color: '#0091DA' },
    { x: '22%', y: '80%', delay: 0.6, size: 4, color: '#4DB8FF' },
    { x: '94%', y: '32%', delay: 1.2, size: 3, color: '#00A3A1' },
  ]

  const css = `
    @keyframes floatTrophy {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-16px); }
    }
    @keyframes glowPulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%       { opacity: 1; transform: scale(1.2); }
    }
    @keyframes ringExpand {
      0%        { opacity: 0.6; transform: scale(0.95); }
      50%       { opacity: 0.2; transform: scale(1.05); }
      100%      { opacity: 0.6; transform: scale(0.95); }
    }
    @keyframes particleDrift {
      0%   { opacity: 0; transform: translateY(0px) scale(0.5); }
      30%  { opacity: 0.8; }
      70%  { opacity: 0.6; }
      100% { opacity: 0; transform: translateY(-28px) scale(1); }
    }
    @keyframes scanLine {
      0%   { transform: translateY(-160px); }
      100% { transform: translateY(160px); }
    }
  `

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', cursor: 'crosshair',
      }}
    >
      <style>{css}</style>

      {/* Ambient glow rings */}
      <div style={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        border: '1px solid rgba(0,145,218,0.12)',
        animation: 'ringExpand 4s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        border: '1px solid rgba(0,163,161,0.15)',
        animation: 'ringExpand 4s ease-in-out 1s infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,145,218,0.08) 0%, transparent 70%)',
        animation: 'glowPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      {/* Floating particles */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Trophy SVG */}
      <div style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.18s ease-out',
        animation: 'floatTrophy 4s ease-in-out infinite',
        transformStyle: 'preserve-3d',
        position: 'relative', zIndex: 2,
      }}>
        <svg viewBox="0 0 320 340" width="300" height="340"
          style={{
            filter: hovered
              ? 'drop-shadow(0 0 32px rgba(0,145,218,0.7)) drop-shadow(0 16px 40px rgba(0,51,141,0.5))'
              : 'drop-shadow(0 0 18px rgba(0,145,218,0.35)) drop-shadow(0 12px 28px rgba(0,51,141,0.3))',
            transition: 'filter 0.4s ease',
          }}
        >
          <defs>
            <linearGradient id="kpmgMain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4DB8FF"/>
              <stop offset="30%"  stopColor="#0091DA"/>
              <stop offset="70%"  stopColor="#00338D"/>
              <stop offset="100%" stopColor="#001F5C"/>
            </linearGradient>
            <linearGradient id="kpmgRim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#001F5C"/>
              <stop offset="35%"  stopColor="#4DB8FF"/>
              <stop offset="65%"  stopColor="#0091DA"/>
              <stop offset="100%" stopColor="#001F5C"/>
            </linearGradient>
            <linearGradient id="shine" x1="0" y1="0" x2="0.6" y2="1">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.28)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
            </linearGradient>
            <radialGradient id="orbBlue" cx="30%" cy="28%" r="65%">
              <stop offset="0%"   stopColor="#B3E5FC"/>
              <stop offset="45%"  stopColor="#0091DA"/>
              <stop offset="100%" stopColor="#001F5C"/>
            </radialGradient>
            <radialGradient id="gemTeal" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stopColor="#80DEEA"/>
              <stop offset="100%" stopColor="#00838F"/>
            </radialGradient>
            <radialGradient id="gemBlue" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stopColor="#82B1FF"/>
              <stop offset="100%" stopColor="#1565C0"/>
            </radialGradient>
            <radialGradient id="innerGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%"   stopColor="rgba(0,145,218,0.25)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>

          {/* Drop shadow */}
          <ellipse cx="160" cy="326" rx="90" ry="10" fill="rgba(0,0,0,0.3)"/>

          {/* Base platform */}
          <ellipse cx="160" cy="286" rx="100" ry="20" fill="url(#kpmgRim)"/>
          <path d="M60 286 L60 300 Q160 314 260 300 L260 286 Q160 300 60 286Z" fill="url(#kpmgMain)"/>
          <ellipse cx="160" cy="286" rx="100" ry="20" fill="url(#shine)" opacity="0.4"/>

          {/* Stem */}
          <path d="M142 260 L142 286 Q160 292 178 286 L178 260 Q160 266 142 260Z" fill="url(#kpmgMain)"/>
          <path d="M142 260 Q160 266 178 260 Q160 254 142 260Z" fill="url(#kpmgRim)"/>

          {/* Cup body */}
          <path d="M55 238 Q53 196 74 164 Q94 138 124 132 Q142 128 160 127 Q178 128 196 132 Q226 138 246 164 Q267 196 265 238 Q213 254 160 256 Q107 254 55 238Z" fill="url(#kpmgMain)"/>
          <path d="M55 238 Q53 196 74 164 Q94 138 124 132 Q142 128 160 127 Q178 128 196 132 Q226 138 246 164 Q267 196 265 238 Q213 254 160 256 Q107 254 55 238Z" fill="url(#innerGlow)"/>
          <path d="M75 236 Q73 200 90 176 Q108 152 136 146 Q148 143 160 142 Q172 143 184 146 Q212 152 230 176 Q247 200 245 236 Q203 248 160 250 Q117 248 75 236Z" fill="rgba(0,0,0,0.15)"/>
          <path d="M80 230 Q82 196 98 172 Q114 150 138 144 Q150 141 160 140 L160 250 Q117 248 80 230Z" fill="url(#shine)" opacity="0.35"/>

          {/* Top rim */}
          <ellipse cx="160" cy="132" rx="105" ry="19" fill="url(#kpmgRim)"/>
          <ellipse cx="160" cy="132" rx="105" ry="19" fill="url(#shine)" opacity="0.45"/>

          {/* Bottom rim */}
          <ellipse cx="160" cy="256" rx="103" ry="17" fill="url(#kpmgRim)"/>

          {/* Left handle */}
          <path d="M57 172 Q14 172 12 204 Q10 236 55 238" fill="none" stroke="url(#kpmgRim)" strokeWidth="13" strokeLinecap="round"/>
          <path d="M57 172 Q14 172 12 204 Q10 236 55 238" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round"/>

          {/* Right handle */}
          <path d="M263 172 Q306 172 308 204 Q310 236 265 238" fill="none" stroke="url(#kpmgRim)" strokeWidth="13" strokeLinecap="round"/>
          <path d="M263 172 Q306 172 308 204 Q310 236 265 238" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round"/>

          {/* Centre teal gem */}
          <ellipse cx="160" cy="194" rx="17" ry="17" fill="url(#gemTeal)"/>
          <ellipse cx="155" cy="189" rx="6" ry="4" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="160" cy="194" rx="17" ry="17" fill="none" stroke="rgba(0,163,161,0.6)" strokeWidth="1"/>

          {/* Left blue gem */}
          <ellipse cx="100" cy="198" rx="11" ry="11" fill="url(#gemBlue)"/>
          <ellipse cx="96" cy="194" rx="4" ry="2.5" fill="rgba(255,255,255,0.5)"/>

          {/* Right blue gem */}
          <ellipse cx="220" cy="198" rx="11" ry="11" fill="url(#gemBlue)"/>
          <ellipse cx="216" cy="194" rx="4" ry="2.5" fill="rgba(255,255,255,0.5)"/>

          {/* Top orb */}
          <circle cx="160" cy="114" r="15" fill="url(#orbBlue)"/>
          <circle cx="155" cy="109" r="5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="160" cy="114" r="15" fill="none" stroke="rgba(0,145,218,0.5)" strokeWidth="1"/>

          {/* Left rim orb */}
          <circle cx="82" cy="124" r="10" fill="url(#orbBlue)"/>
          <circle cx="79" cy="121" r="3.5" fill="rgba(255,255,255,0.5)"/>

          {/* Right rim orb */}
          <circle cx="238" cy="124" r="10" fill="url(#orbBlue)"/>
          <circle cx="235" cy="121" r="3.5" fill="rgba(255,255,255,0.5)"/>

          {/* Far left orb */}
          <circle cx="36" cy="140" r="8" fill="url(#orbBlue)"/>
          <circle cx="34" cy="138" r="2.5" fill="rgba(255,255,255,0.5)"/>

          {/* Far right orb */}
          <circle cx="284" cy="140" r="8" fill="url(#orbBlue)"/>
          <circle cx="282" cy="138" r="2.5" fill="rgba(255,255,255,0.5)"/>

          {/* Crown arch */}
          <path d="M36 140 Q98 100 160 96 Q222 100 284 140" fill="none" stroke="url(#kpmgRim)" strokeWidth="5" strokeLinecap="round"/>
          <path d="M36 140 Q98 100 160 96 Q222 100 284 140" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"/>

          {/* Engraved lines */}
          <path d="M80 180 Q160 188 240 180" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <path d="M72 210 Q160 220 248 210" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        </svg>
      </div>

      {/* Scan line on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', width: 280, height: 320,
          background: 'linear-gradient(to bottom, transparent 45%, rgba(0,145,218,0.06) 50%, transparent 55%)',
          animation: 'scanLine 2s linear infinite',
          pointerEvents: 'none', zIndex: 3,
        }}/>
      )}
    </div>
  )
}
