import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles, ChevronRight } from 'lucide-react'
import kpmgLogo from '../kpmg-logo.png'

function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible]
}

const FEATURES = [
  { icon: Sparkles, title: 'AI Nominee Discovery', desc: 'Surfaces distinguished business leaders automatically so your shortlist starts with the right names.' },
  { icon: Users, title: 'Multi-Role Governance', desc: 'Admin, Head Jury, and Jury each operate in purpose-built workspaces with enforced permissions and clear accountability.' },
  { icon: Trophy, title: 'Structured Ranking', desc: 'Jury members rank nominees on an intuitive board. Every position carries weighted points, ensuring a rigorous and defensible outcome.' },
  { icon: BarChart3, title: 'Real-Time Consensus', desc: 'A live leaderboard shows where collective opinion converges, giving the Head Jury full visibility before the final decision.' },
  { icon: CheckCircle, title: 'Admin-Controlled Vetting', desc: 'Nominees are reviewed and approved by the administrator before jury access. Credentials verified, standards upheld.' },
  { icon: Lock, title: 'Complete Audit Trail', desc: 'Every action logged. Every role enforced. Access granted only by admins — transparent, credible, and beyond reproach.' },
]

const HOW_IT_WORKS = [
  { step: '01', label: 'Create Award', desc: 'Admin configures the award, sets criteria and nominee targets.', icon: Trophy },
  { step: '02', label: 'Discover Nominees', desc: 'AI surfaces high-profile candidates. Admin reviews and finalises.', icon: Sparkles },
  { step: '03', label: 'Jury Evaluation', desc: 'Jury reviews approved nominees and submits their ranked order.', icon: Users },
  { step: '04', label: 'Final Result', desc: 'Head Jury locks the final ranking as the official result.', icon: CheckCircle },
]

function FeatureCard({ icon: Icon, title, desc, index }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
        padding: 28,
        background: '#FFFFFF',
        border: '1px solid #E8ECF0',
        borderRadius: 14,
      }}
      className="feature-card"
    >
      <div className="feature-icon" style={{
        width: 42, height: 42, borderRadius: 10,
        background: '#EEF2FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease',
      }}>
        <Icon size={19} color="#00338D" strokeWidth={1.7} />
      </div>
      <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ color: '#6B7A8D', fontSize: 14, lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

function TimelineStep({ icon: Icon, step, label, desc, index, isLast }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className="timeline-step"
      style={{
        padding: isLast ? 0 : '0 24px 0 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
      }}
    >
      <div className="timeline-icon" style={{
        width: 44, height: 44, borderRadius: '50%',
        background: isLast ? '#00338D' : 'white',
        border: `2px solid ${isLast ? '#00338D' : '#E0E6EE'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: isLast ? '0 6px 16px rgba(0,51,141,0.22)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease',
      }}>
        <Icon size={18} color={isLast ? 'white' : '#00338D'} strokeWidth={1.8} />
      </div>
      <div style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8, opacity: 0.55 }}>{step}</div>
      <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{label}</div>
      <div style={{ color: '#8A95A3', fontSize: 13.5, lineHeight: 1.65 }}>{desc}</div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [isNavSticky, setIsNavSticky] = useState(false)
  const [heroRef, heroVisible] = useReveal(0)

  useEffect(() => {
    const handleScroll = () => setIsNavSticky(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F9FC',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#0A1628',
    }}>
      <style>{`
        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(24px, -20px) scale(1.05); }
        }
        @keyframes dotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
          70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes ctaShift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        .feature-card { transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
        .feature-card:hover {
          border-color: rgba(0,51,141,0.25);
          box-shadow: 0 10px 28px rgba(0,51,141,0.08);
          transform: translateY(-3px);
        }
        .feature-card:hover .feature-icon {
          background: #00338D;
          transform: scale(1.08) rotate(-4deg);
        }
        .feature-card:hover .feature-icon svg { color: white; stroke: white; }

        .timeline-step:hover .timeline-icon { transform: translateY(-4px) scale(1.06); }
        .timeline-step:not(:last-child):hover .timeline-icon { border-color: #00338D; }

        .hero-badge-dot { animation: dotPulse 2.2s ease-out infinite; }

        .cta-arrow { transition: transform 0.2s ease; }
        .cta-btn:hover .cta-arrow { animation: ctaShift 0.9s ease-in-out infinite; }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: isNavSticky ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: isNavSticky ? '1px solid #E8ECF0' : '1px solid transparent',
        padding: '0 48px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={kpmgLogo} alt="KPMG" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: '#E0E5EC' }} />
          <span style={{ color: '#00338D', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
            NobleCrest<span style={{ color: '#0091DA' }}>.AI</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/select-role')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: '#00338D', color: 'white', border: 'none',
            borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '-0.01em', transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
          onMouseLeave={e => e.currentTarget.style.background = '#00338D'}
        >
          Sign In <ChevronRight size={14} />
        </button>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        style={{
          minHeight: 'calc(100vh - 68px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '80px 48px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div aria-hidden style={{
          position: 'absolute', top: '-10%', right: '-6%', width: 460, height: 460,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,51,141,0.07), transparent 70%)',
          animation: 'floatBlob 16s ease-in-out infinite',
          pointerEvents: 'none', zIndex: -1,
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: '-14%', left: '-6%', width: 380, height: 380,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,145,218,0.06), transparent 70%)',
          animation: 'floatBlob 20s ease-in-out infinite reverse',
          pointerEvents: 'none', zIndex: -1,
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 32, padding: '6px 16px',
          background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s ease',
        }}>
          <div className="hero-badge-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ color: '#00338D', fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.01em' }}>Platform live · Powered by KPMG</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(44px, 6.5vw, 78px)',
          fontWeight: 800,
          lineHeight: 1.03,
          letterSpacing: '-0.04em',
          marginBottom: 22,
          color: '#00338D',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease 0.08s',
        }}>
          Awards management,<br />built for precision.
        </h1>

        <p style={{
          color: '#5D6C7D', fontSize: 17, lineHeight: 1.8, maxWidth: 560,
          margin: '0 auto 40px', fontWeight: 400,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease 0.16s',
        }}>
          An enterprise-grade platform for running structured, auditable award cycles — from AI-powered nominee discovery to the final verified result.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease 0.24s',
        }}>
          <button
            className="cta-btn"
            onClick={() => navigate('/select-role')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: '#00338D', color: 'white',
              border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(0,51,141,0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#002a73'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00338D'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Access Platform <ArrowRight size={16} className="cta-arrow" />
          </button>
          <button
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '14px 24px', background: 'transparent', color: '#00338D',
              border: '1px solid #D0D8E4', borderRadius: 9, fontSize: 14.5, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00338D'; e.currentTarget.style.background = '#F0F4FF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#D0D8E4'; e.currentTarget.style.background = 'transparent' }}
          >
            Learn more
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 48px 100px' }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 24, height: 2.5, background: '#00338D', borderRadius: 2 }} />
            <span style={{ color: '#00338D', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Platform Capabilities</span>
          </div>
          <h2 style={{ color: '#0A1628', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, maxWidth: 480 }}>
            Every stage of the process, handled with precision.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'white', borderTop: '1px solid #E8ECF0', borderBottom: '1px solid #E8ECF0', padding: '88px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 24, height: 2.5, background: '#00338D', borderRadius: 2 }} />
            <span style={{ color: '#00338D', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>How It Works</span>
          </div>
          <h2 style={{ color: '#0A1628', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 56 }}>
            Four steps to a verified result.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 22, left: '12.5%', right: '12.5%', height: 1, background: '#E8ECF0', zIndex: 0 }} />
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ position: 'relative', zIndex: 1 }}>
                <TimelineStep {...item} index={i} isLast={i === HOW_IT_WORKS.length - 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#00338D', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>Ready to run your awards?</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Select your role and access the platform instantly.</p>
          </div>
          <button
            className="cta-btn"
            onClick={() => navigate('/select-role')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '15px 30px', background: 'white', color: '#00338D',
              border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              letterSpacing: '-0.01em', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Enter NobleCrest <ArrowRight size={15} className="cta-arrow" />
          </button>
        </div>
      </section>
    </div>
  )
}
