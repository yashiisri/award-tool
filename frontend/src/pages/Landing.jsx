import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles } from 'lucide-react'
import LogoPair from '../components/layout/LogoPair'
import ThemeToggle from '../components/layout/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

function useReveal() {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect() } }, { threshold: 0.1 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return [ref, v]
}

const FEATURES = [
  { icon: Sparkles,    n: '01', title: 'AI Nominee Discovery',        desc: 'Surfaces distinguished leaders and organisations automatically. Every candidate is grounded in verified public data.' },
  { icon: Users,       n: '02', title: 'Multi-Role Governance',       desc: 'Admin, Head Jury and Jury operate in purpose-built workspaces with enforced role permissions and accountability.' },
  { icon: Trophy,      n: '03', title: 'Structured Ranking',          desc: 'Jury members evaluate nominees against defined criteria. Weighted scoring ensures a rigorous, defensible result.' },
  { icon: BarChart3,   n: '04', title: 'Real-Time Consensus',         desc: 'A live leaderboard shows where collective opinion converges — giving the Head Jury full visibility before finalisation.' },
  { icon: CheckCircle, n: '05', title: 'Admin-Controlled Vetting',    desc: 'Nominees are reviewed and approved before jury access. Only verified candidates advance to evaluation.' },
  { icon: Lock,        n: '06', title: 'Complete Audit Trail',        desc: 'Every action logged with timestamp and role. Transparent, credible and fully traceable from nomination to result.' },
]

const STEPS = [
  { n: '01', title: 'Create Award',      desc: 'Configure the award category, evaluation criteria and nominee targets.', icon: Trophy },
  { n: '02', title: 'Discover Nominees', desc: 'AI surfaces high-profile candidates from public sources. Admin reviews and approves.', icon: Sparkles },
  { n: '03', title: 'Jury Evaluation',   desc: 'Jury members score nominees independently. Head Jury consolidates and locks rankings.', icon: Users },
  { n: '04', title: 'Final Result',      desc: 'Head Jury certifies the final result. Audit trail archived for governance.', icon: CheckCircle },
]

function FeatureCard({ icon: Icon, n, title, desc, delay }) {
  const [ref, v] = useReveal()
  const [hov, setHov] = useState(false)
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? 'none' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, border-color 0.15s, box-shadow 0.15s`,
        background: '#fff',
        border: `1px solid ${hov ? '#A8BBDA' : '#E2E8F0'}`,
        borderTop: `3px solid ${hov ? 'var(--kpmg-blue)' : '#E2E8F0'}`,
        padding: '28px 24px',
        boxShadow: hov ? '0 8px 28px rgba(0,51,141,0.09)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, background: hov ? 'var(--kpmg-blue)' : '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <Icon size={18} color={hov ? '#fff' : 'var(--kpmg-blue)'} strokeWidth={1.6} />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#DDE4EF', letterSpacing: '-0.02em' }}>{n}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const { theme } = useTheme()
  const isAima = theme === 'aima'

  // ── Theme-dependent surfaces ── kpmg = dark navy hero (original), aima = light/white, blue text
  const heroBg      = isAima ? '#FFFFFF' : 'var(--kpmg-navy)'
  const heroShape1   = isAima ? 'rgba(0,51,141,0.05)' : 'var(--kpmg-blue)'
  const heroShape2   = isAima ? 'rgba(0,94,184,0.06)' : 'var(--kpmg-mid-blue)'
  const headingColor = isAima ? 'var(--kpmg-navy)' : '#fff'
  const headingSub   = isAima ? 'var(--kpmg-blue)' : 'rgba(255,255,255,0.65)'
  const bodyColor     = isAima ? 'var(--text-secondary)' : 'rgba(255,255,255,0.55)'
  const dividerColor  = isAima ? 'var(--border)' : 'rgba(255,255,255,0.15)'
  const badgeBorder   = isAima ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.35)'
  const badgeBg       = isAima ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.08)'
  const secondaryBtnBorder = isAima ? 'var(--border)' : 'rgba(255,255,255,0.25)'
  const secondaryBtnText   = isAima ? 'var(--kpmg-blue)' : 'rgba(255,255,255,0.75)'
  const logoVariant = isAima ? 'light' : 'dark'
  const navText      = isAima ? 'var(--kpmg-navy)' : 'rgba(255,255,255,0.88)'
  const navSubText   = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.35)'
  const footerBg      = isAima ? '#FAFBFD' : '#000F2B'
  const footerText    = isAima ? 'var(--text-muted)' : 'rgba(255,255,255,0.2)'
  const footerBorder  = isAima ? '1px solid var(--border-light)' : 'none'

  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F7', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* Theme toggle — pinned to the true top-right corner of the viewport */}
      <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 200 }}>
        <ThemeToggle variant={isAima ? 'light' : 'dark'} />
      </div>

      {/* ── Navbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: heroBg, borderBottom: isAima ? '1px solid var(--border-light)' : '1px solid rgba(255,255,255,0.08)', transition: 'background 0.2s' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <LogoPair variant={logoVariant} kpmgHeight={28} aimaHeight={32} gap={12} />
            <div style={{ width: 1, height: 22, background: dividerColor }} />
            <div>
              <div style={{ color: navText, fontSize: 12, fontWeight: 500 }}>Managing India Awards</div>
              <div style={{ color: navSubText, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 1 }}>Award Management Platform</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: heroBg, position: 'relative', overflow: 'hidden', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '38%', background: heroShape1, clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '28%', background: heroShape2, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), transparent 60%)' }} />

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 40px 88px', position: 'relative', zIndex: 2 }}>
          {/* Co-branding strip */}
          <div style={{ marginBottom: 36 }}>
            <LogoPair variant={logoVariant} kpmgHeight={36} aimaHeight={40} gap={16} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '5px 14px', border: `1px solid ${badgeBorder}`, background: badgeBg }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
            <span style={{ color: isAima ? '#9A7B1F' : 'var(--gold)', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Managing India Awards 2026</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 500, color: headingColor, lineHeight: 1.12, letterSpacing: '-0.01em', maxWidth: 640, marginBottom: 24 }}>
            The Platform Behind<br />
            <em style={{ fontStyle: 'italic', color: headingSub }}>India's Most Prestigious</em><br />
            Management Awards
          </h1>

          <p style={{ fontSize: 15, color: bodyColor, lineHeight: 1.75, maxWidth: 500, marginBottom: 40, fontWeight: isAima ? 400 : 300 }}>
            An enterprise-grade system for running structured, auditable award cycles, from AI-powered nominee discovery to the final certified result.
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => nav('/select-role')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--gold)', color: 'var(--kpmg-navy)', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Enter Platform <ArrowRight size={14} />
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${secondaryBtnBorder}`, color: secondaryBtnText, fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.02em', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = isAima ? 'var(--kpmg-blue)' : 'rgba(255,255,255,0.6)'} onMouseLeave={e => e.currentTarget.style.borderColor = secondaryBtnBorder}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 40px', display: 'flex' }}>
          {[
            { value: '67+', label: 'Local Management Associations' },
            { value: '37,000+', label: 'AIMA Members Nationally' },
            { value: '70th', label: 'Edition of Managing India Awards' },
            { value: '600+', label: 'Corporate & Institutional Members' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '28px 24px', borderRight: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 600, color: 'var(--kpmg-blue)', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 40px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--kpmg-blue)' }}>Platform Capabilities</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, maxWidth: 480 }}>
            Every stage of the process,<br />handled with precision.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.n} {...f} delay={i * 60} />)}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 32, height: 2, background: 'var(--gold)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--kpmg-blue)' }}>Process</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 56 }}>
            Four steps to a verified result.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, var(--kpmg-blue), var(--kpmg-blue), transparent)', opacity: 0.2 }} />
            {STEPS.map((s, i) => (
              <div key={i} style={{ paddingRight: 32, paddingBottom: 8 }}>
                <div style={{ width: 40, height: 40, marginBottom: 24, background: i === 3 ? 'var(--kpmg-blue)' : '#fff', border: `2px solid ${i === 3 ? 'var(--kpmg-blue)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i === 3 ? '0 4px 16px rgba(0,51,141,0.25)' : 'none' }}>
                  <s.icon size={16} color={i === 3 ? '#fff' : 'var(--kpmg-blue)'} strokeWidth={1.6} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.01em' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: heroBg, position: 'relative', overflow: 'hidden', borderTop: isAima ? '1px solid var(--border-light)' : 'none', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--gold)' }} />
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '56px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 500, color: headingColor, marginBottom: 8 }}>Ready to manage your awards?</h2>
            <p style={{ color: bodyColor, fontSize: 13, fontWeight: isAima ? 400 : 300 }}>Select your role to access the platform and begin the awards cycle.</p>
          </div>
          <button onClick={() => nav('/select-role')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--gold)', color: 'var(--kpmg-navy)', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Access Platform <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: footerBg, borderTop: footerBorder, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}>
        <LogoPair variant={logoVariant} kpmgHeight={24} aimaHeight={28} gap={16} />
        <span style={{ color: footerText, fontSize: 10 }}>© 2026 KPMG. All rights reserved. Confidential.</span>
      </footer>
    </div>
  )
}
