import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles, ChevronRight } from 'lucide-react'
import kpmgLogo from '../kpmg-logo.png'

function useReveal(threshold = 0.12) {
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

const FEATURES = [
  { icon: Sparkles,    number: '01', title: 'AI Nominee Discovery',  desc: "Surfaces distinguished business leaders automatically so your shortlist starts with the right names." },
  { icon: Users,       number: '02', title: 'Multi-Role Governance', desc: "Admin, Head Jury, and Jury each operate in purpose-built workspaces with enforced permissions and clear accountability." },
  { icon: Trophy,      number: '03', title: 'Structured Ranking',    desc: "Jury members rank nominees on an intuitive drag-and-drop board. Every position carries weighted points, ensuring a rigorous and defensible outcome." },
  { icon: BarChart3,   number: '04', title: 'Real-Time Consensus',   desc: "A live leaderboard shows where collective opinion converges, giving the Head Jury full visibility before the final decision." },
  { icon: CheckCircle, number: '05', title: 'Admin-Controlled Vetting', desc: "Nominees are reviewed and approved by the administrator before jury access. Credentials verified, standards upheld, only the best advance." },
  { icon: Lock,        number: '06', title: 'Complete Audit Trail',  desc: "Every action logged. Every role enforced. Access granted only by admins — transparent, credible, and beyond reproach." },
]

function FeatureCard({ icon: Icon, number, title, desc, index }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
        padding: '28px',
        background: 'white',
        border: '1px solid #E8ECF0',
        borderRadius: 12,
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,51,141,0.2)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,51,141,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#00338D" strokeWidth={1.8} />
        </div>
        <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.5 }}>{number}</span>
      </div>
      <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>{title}</div>
      <div style={{ color: '#6B7A8D', fontSize: 13, lineHeight: 1.75 }}>{desc}</div>
    </div>
  )
}

const HOW_IT_WORKS = [
  { step: '01', label: 'Create Award',      desc: 'Admin configures the award, sets criteria and nominee targets.', icon: Trophy },
  { step: '02', label: 'Discover Nominees', desc: 'AI surfaces high-profile candidates. Admin reviews and finalises.', icon: Sparkles },
  { step: '03', label: 'Jury Evaluation',   desc: 'Jury reviews approved nominees and submits their ranked order. Head Jury consolidates and locks the result.', icon: Users },
  { step: '04', label: 'Final Result',      desc: 'Head Jury locks the final ranking as the official result.', icon: CheckCircle },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8ECF0',
        padding: '0 48px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={kpmgLogo} alt="KPMG" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: '#E0E5EC' }} />
          <span style={{ color: '#00338D', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>
            NobleCrest<span style={{ color: '#0091DA' }}>.AI</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/select-role')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#00338D', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
          onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
          onMouseLeave={e => e.currentTarget.style.background = '#00338D'}
        >
          Sign In <ChevronRight size={14} />
        </button>
      </nav>

      {/* Hero — full viewport, nothing below the fold */}
      <section style={{
        height: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 48px',
        position: 'relative',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 36, padding: '5px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>Platform live · Powered by KPMG</span>
        </div>

        <h1 style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 900, color: '#00338D', lineHeight: 0.92, letterSpacing: '-0.05em', marginBottom: 28 }}>
          NobleCrest<span style={{ color: '#0091DA' }}>.AI</span>
        </h1>

        <p style={{ fontSize: 20, fontWeight: 500, color: '#3D4F63', marginBottom: 14, letterSpacing: '-0.01em', lineHeight: 1.5 }}>
          Awards management, built for precision.
        </p>
        <p style={{ color: '#9BA8B5', fontSize: 15, lineHeight: 1.8, maxWidth: 460, margin: '0 auto 40px', fontWeight: 400 }}>
          An enterprise-grade platform for running structured, auditable award cycles — from AI-powered nominee discovery to the final verified result.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/select-role')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: '#00338D', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#002a73'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,51,141,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00338D'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Access Platform <ArrowRight size={15} />
          </button>
          <button
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 22px', background: 'transparent', color: '#00338D', border: '1px solid #D0D8E4', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#00338D'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#D0D8E4'}
          >
            Learn more
          </button>
        </div>

      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 72px' }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 20, height: 2, background: '#00338D', borderRadius: 2 }} />
            <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Platform Capabilities</span>
          </div>
          <h2 style={{ color: '#0A1628', fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, maxWidth: 440 }}>
            Every stage of the process,<br />handled with precision.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.number} {...f} index={i} />)}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'white', borderTop: '1px solid #E8ECF0', borderBottom: '1px solid #E8ECF0', padding: '72px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 20, height: 2, background: '#00338D', borderRadius: 2 }} />
            <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>How It Works</span>
          </div>
          <h2 style={{ color: '#0A1628', fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 48 }}>
            Four steps to a verified result.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, #E8ECF0, #00338D22, #E8ECF0)', zIndex: 0 }} />

            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ padding: '0 24px 0 0', position: 'relative', zIndex: 1 }}>
                {/* Step circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: i === 3 ? '#00338D' : 'white',
                  border: `2px solid ${i === 3 ? '#00338D' : '#E8ECF0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  boxShadow: i === 3 ? '0 4px 16px rgba(0,51,141,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <item.icon size={16} color={i === 3 ? 'white' : '#00338D'} strokeWidth={2} />
                </div>
                <div style={{ color: '#00338D', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8, opacity: 0.5 }}>{item.step}</div>
                <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 8, letterSpacing: '-0.01em' }}>{item.label}</div>
                <div style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#00338D', padding: '72px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Ready to run your awards?</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Select your role and access the platform instantly.</p>
          </div>
          <button
            onClick={() => navigate('/select-role')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'white', color: '#00338D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '-0.01em' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Enter NobleCrest <ArrowRight size={15} />
          </button>
        </div>
      </section>

    </div>
  )
}
