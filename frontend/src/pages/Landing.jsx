import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles } from 'lucide-react'
import trophyImg from '../trophy.png'

// ── KPMG Logo ─────────────────────────────────────────────────────────────────
function KPMGLogo({ scale = 0.5 }) {
  return (
    <svg width={260 * scale} height={106 * scale} viewBox="0 0 260 106" fill="none">
      <rect x="4"   y="2" width="44" height="62" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="56"  y="2" width="44" height="62" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="108" y="2" width="44" height="62" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="160" y="2" width="44" height="62" stroke="white" strokeWidth="2.5" fill="none"/>
      <text x="2" y="82" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="58" fill="white" letterSpacing="2">KPMG</text>
    </svg>
  )
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Sparkles,     number: '01', title: 'Intelligent Nominee Discovery',      desc: "Noble Crest surfaces India's most distinguished business leaders as potential nominees — chairpersons, founders, and industry icons — so your shortlist begins with the right names." },
  { icon: Users,        number: '02', title: 'Structured Multi-Role Governance',   desc: 'Administrators orchestrate the process. The Head Jury holds final authority. Jury members evaluate with clarity. Each stakeholder operates within a purpose-built workspace.' },
  { icon: Trophy,       number: '03', title: 'Deliberate, Considered Ranking',     desc: 'Jury members arrange nominees in their preferred order on a clean, intuitive board. An intelligent suggestion provides a starting point — human judgment shapes the final outcome.' },
  { icon: BarChart3,    number: '04', title: 'Live Consensus Visibility',          desc: "As rankings are submitted, a real-time leaderboard emerges — giving the Head Jury a clear view of where collective opinion is converging before the final decision is made." },
  { icon: CheckCircle,  number: '05', title: 'Rigorous Nominee Vetting',           desc: 'Before voting opens, every jury member reviews each nominee — validating credentials, raising concerns, and ensuring only the most deserving candidates advance.' },
  { icon: Lock,         number: '06', title: 'Controlled Access, Complete Integrity', desc: 'Every action is recorded. Every role is enforced. Access is granted only by administrators — keeping the process transparent, credible, and beyond reproach.' },
]

function FeatureCard({ icon: Icon, number, title, desc, index }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className="border-t border-[#00338D]/12 pt-8 transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${(index % 3) * 80}ms` }}>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 bg-[#00338D] rounded flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" strokeWidth={1.8} />
        </div>
        <span className="text-[#0091DA] text-xs font-bold tracking-widest uppercase mt-3">{number}</span>
      </div>
      <h3 className="text-[#00338D] font-bold text-lg mb-3 leading-snug">{title}</h3>
      <p className="text-[#1a1a2e]/55 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ── Floating Trophy ───────────────────────────────────────────────────────────
function FloatingTrophy() {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="flex-1 flex items-center justify-center"
      style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute',
        width: hovered ? 340 : 240, height: hovered ? 340 : 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)',
        transition: 'all 0.4s ease',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }}/>

      {/* Rays */}
      {hovered && [0,45,90,135,180,225,270,315].map((deg, i) => (
        <div key={i} style={{
          position: 'absolute', width: 2, height: 34,
          background: 'linear-gradient(to top, #FFD700, transparent)',
          top: '50%', left: '50%',
          transformOrigin: '50% 100%',
          transform: `translate(-50%,-100%) rotate(${deg}deg) translateY(-120px)`,
          animation: `rayPop 0.5s ease-out ${i * 0.04}s both`,
          borderRadius: 2, pointerEvents: 'none',
        }}/>
      ))}

      {/* Trophy image — mix-blend-mode:screen removes white background */}
      <img
        src={trophyImg}
        alt="Award Trophy"
        style={{
          width: 200, height: 400,
          mixBlendMode: 'screen',
          filter: hovered
            ? 'brightness(1.2) drop-shadow(0 0 36px rgba(255,215,0,1)) drop-shadow(0 12px 30px rgba(180,130,0,0.6))'
            : 'brightness(1.05) drop-shadow(0 0 16px rgba(255,215,0,0.45)) drop-shadow(0 10px 24px rgba(120,80,0,0.35))',
          animation: hovered
            ? 'trophySpin 0.65s ease-in-out, trophyFloat 3s ease-in-out infinite'
            : 'trophyFloat 3s ease-in-out infinite',
          transition: 'filter 0.3s ease',
        }}
      />

      <style>{`
        @keyframes trophyFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes trophySpin {
          0%  { transform: translateY(-9px) scale(1) rotate(0deg); }
          25% { transform: translateY(-24px) scale(1.1) rotate(-6deg); }
          75% { transform: translateY(-24px) scale(1.1) rotate(6deg); }
          100%{ transform: translateY(-9px) scale(1) rotate(0deg); }
        }
        @keyframes rayPop {
          0%  { opacity:0; height:0; }
          60% { opacity:1; height:34px; }
          100%{ opacity:0.5; }
        }
      `}</style>
    </div>
  )
}

// ── Landing ───────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute top-6 left-8 z-20"><KPMGLogo scale={0.38} /></div>
        <div className="absolute inset-0 bg-[#00338D]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}/>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-16 flex items-center gap-8 min-h-screen">
          {/* Text */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-16 h-0.5 bg-[#0091DA]" />
              <span className="text-[#0091DA] text-xs font-bold tracking-[0.2em] uppercase">Awards Management Platform</span>
            </div>
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="px-3 py-1 border border-white/20 text-white/70 text-xs font-semibold tracking-widest uppercase rounded-sm">AIMA</span>
              <span className="text-white/40 text-xs">All India Management Association</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[1.0] tracking-tight mb-6">NobleCrest.AI</h1>
            <p className="text-white/70 text-2xl font-light leading-relaxed mb-3 max-w-lg">Where Intelligence Meets Recognition</p>
            <p className="text-white/35 text-base mb-14 max-w-md leading-relaxed">End-to-end awards management — from nominee discovery to the final result.</p>
            <button onClick={() => navigate('/select-role')}
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#0091DA] text-white font-semibold text-sm rounded hover:bg-[#007ab8] transition-colors">
              Access Platform <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Trophy */}
          <FloatingTrophy />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-[#F4F5F7] py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16 max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-[#0091DA]" />
              <span className="text-[#0091DA] text-xs font-bold tracking-[0.2em] uppercase">Platform Capabilities</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#00338D] leading-tight tracking-tight">
              Every stage of the awards<br />process, handled with precision
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-12">
            {FEATURES.map((f, i) => <FeatureCard key={f.number} {...f} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#00338D] py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-0.5 bg-[#0091DA]" />
            <span className="text-[#0091DA] text-xs font-bold tracking-[0.2em] uppercase">How It Works</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: '01', label: 'Create Award',      desc: 'Admin sets up the award with criteria and nominee targets' },
              { step: '02', label: 'Discover Nominees', desc: 'AI surfaces high-profile candidates; admin reviews and adds' },
              { step: '03', label: 'Jury Evaluation',   desc: 'Jury validates nominees and submits their ranked order' },
              { step: '04', label: 'Final Result',      desc: "Head Jury's ranking becomes the official result" },
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 3 && <div className="hidden md:block absolute top-4 left-full w-full h-px bg-white/10 -translate-x-4" />}
                <div className="text-[#0091DA] text-xs font-black tracking-widest mb-3">{item.step}</div>
                <div className="text-white font-bold text-base mb-2">{item.label}</div>
                <div className="text-white/40 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-black text-[#00338D] mb-2 tracking-tight">Ready to run your awards?</h2>
            <p className="text-[#1a1a2e]/45 text-sm">Select your role and access the platform.</p>
          </div>
          <button onClick={() => navigate('/select-role')}
            className="group flex items-center gap-2.5 px-8 py-4 bg-[#00338D] text-white font-semibold text-sm rounded hover:bg-[#002a73] transition-colors flex-shrink-0">
            Enter Noble Crest <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#00338D] py-6">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
              <span className="text-white text-xs font-black">NC</span>
            </div>
            <span className="text-white/50 text-xs">Noble Crest · Awards Management Platform</span>
            <div className="w-px h-4 bg-white/15" />
            <span className="text-white/35 text-xs font-semibold tracking-widest uppercase">AIMA</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs">Powered by</span>
            <KPMGLogo scale={0.36} />
          </div>
        </div>
      </footer>
    </div>
  )
}
