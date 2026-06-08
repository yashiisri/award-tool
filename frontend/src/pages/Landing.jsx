// // import { useNavigate } from 'react-router-dom'
// // import { useEffect, useRef, useState } from 'react'
// // import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles, ChevronRight } from 'lucide-react'
// // import kpmgLogo from '../kpmg-logo.png'

// // function useReveal(threshold = 0.12) {
// //   const ref = useRef(null)
// //   const [visible, setVisible] = useState(false)
// //   useEffect(() => {
// //     const obs = new IntersectionObserver(
// //       ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
// //       { threshold }
// //     )
// //     if (ref.current) obs.observe(ref.current)
// //     return () => obs.disconnect()
// //   }, [])
// //   return [ref, visible]
// // }

// // const FEATURES = [
// //   { icon: Sparkles,    number: '01', title: 'AI Nominee Discovery',  desc: "Surfaces distinguished business leaders automatically so your shortlist starts with the right names." },
// //   { icon: Users,       number: '02', title: 'Multi-Role Governance', desc: "Admin, Head Jury, and Jury each operate in purpose-built workspaces with enforced permissions and clear accountability." },
// //   { icon: Trophy,      number: '03', title: 'Structured Ranking',    desc: "Jury members rank nominees on an intuitive drag-and-drop board. Every position carries weighted points, ensuring a rigorous and defensible outcome." },
// //   { icon: BarChart3,   number: '04', title: 'Real-Time Consensus',   desc: "A live leaderboard shows where collective opinion converges, giving the Head Jury full visibility before the final decision." },
// //   { icon: CheckCircle, number: '05', title: 'Admin-Controlled Vetting', desc: "Nominees are reviewed and approved by the administrator before jury access. Credentials verified, standards upheld, only the best advance." },
// //   { icon: Lock,        number: '06', title: 'Complete Audit Trail',  desc: "Every action logged. Every role enforced. Access granted only by admins — transparent, credible, and beyond reproach." },
// // ]

// // function FeatureCard({ icon: Icon, number, title, desc, index }) {
// //   const [ref, visible] = useReveal()
// //   return (
// //     <div
// //       ref={ref}
// //       style={{
// //         opacity: visible ? 1 : 0,
// //         transform: visible ? 'translateY(0)' : 'translateY(20px)',
// //         transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
// //         padding: '28px',
// //         background: 'white',
// //         border: '1px solid #E8ECF0',
// //         borderRadius: 12,
// //         cursor: 'default',
// //       }}
// //       onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,51,141,0.2)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,51,141,0.07)' }}
// //       onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF0'; e.currentTarget.style.boxShadow = 'none' }}
// //     >
// //       <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
// //         <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// //           <Icon size={16} color="#00338D" strokeWidth={1.8} />
// //         </div>
// //         <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.5 }}>{number}</span>
// //       </div>
// //       <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 8, lineHeight: 1.4 }}>{title}</div>
// //       <div style={{ color: '#6B7A8D', fontSize: 13, lineHeight: 1.75 }}>{desc}</div>
// //     </div>
// //   )
// // }

// // const HOW_IT_WORKS = [
// //   { step: '01', label: 'Create Award',      desc: 'Admin configures the award, sets criteria and nominee targets.', icon: Trophy },
// //   { step: '02', label: 'Discover Nominees', desc: 'AI surfaces high-profile candidates. Admin reviews and finalises.', icon: Sparkles },
// //   { step: '03', label: 'Jury Evaluation',   desc: 'Jury reviews approved nominees and submits their ranked order. Head Jury consolidates and locks the result.', icon: Users },
// //   { step: '04', label: 'Final Result',      desc: 'Head Jury locks the final ranking as the official result.', icon: CheckCircle },
// // ]

// // export default function Landing() {
// //   const navigate = useNavigate()

// //   return (
// //     <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflowX: 'hidden' }}>

// //       {/* Nav */}
// //       <nav style={{
// //         position: 'sticky', top: 0, zIndex: 50,
// //         background: 'rgba(255,255,255,0.96)',
// //         backdropFilter: 'blur(12px)',
// //         borderBottom: '1px solid #E8ECF0',
// //         padding: '0 48px',
// //         height: 64,
// //         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
// //       }}>
// //         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
// //           <img src={kpmgLogo} alt="KPMG" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
// //           <div style={{ width: 1, height: 22, background: '#E0E5EC' }} />
// //           <span style={{ color: '#00338D', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>
// //             NobleCrest<span style={{ color: '#0091DA' }}>.AI</span>
// //           </span>
// //         </div>
// //         <button
// //           onClick={() => navigate('/select-role')}
// //           style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#00338D', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
// //           onMouseEnter={e => e.currentTarget.style.background = '#002a73'}
// //           onMouseLeave={e => e.currentTarget.style.background = '#00338D'}
// //         >
// //           Sign In <ChevronRight size={14} />
// //         </button>
// //       </nav>

// //       {/* Hero — full viewport, nothing below the fold */}
// //       <section style={{
// //         height: 'calc(100vh - 64px)',
// //         display: 'flex', flexDirection: 'column',
// //         alignItems: 'center', justifyContent: 'center',
// //         textAlign: 'center', padding: '0 48px',
// //         position: 'relative',
// //       }}>
// //         <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 36, padding: '5px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20 }}>
// //           <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
// //           <span style={{ color: '#00338D', fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em' }}>Platform live · Powered by KPMG</span>
// //         </div>

// //         <h1 style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 900, color: '#00338D', lineHeight: 0.92, letterSpacing: '-0.05em', marginBottom: 28 }}>
// //           NobleCrest<span style={{ color: '#0091DA' }}>.AI</span>
// //         </h1>

// //         <p style={{ fontSize: 20, fontWeight: 500, color: '#3D4F63', marginBottom: 14, letterSpacing: '-0.01em', lineHeight: 1.5 }}>
// //           Awards management, built for precision.
// //         </p>
// //         <p style={{ color: '#9BA8B5', fontSize: 15, lineHeight: 1.8, maxWidth: 460, margin: '0 auto 40px', fontWeight: 400 }}>
// //           An enterprise-grade platform for running structured, auditable award cycles — from AI-powered nominee discovery to the final verified result.
// //         </p>

// //         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
// //           <button
// //             onClick={() => navigate('/select-role')}
// //             style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', background: '#00338D', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
// //             onMouseEnter={e => { e.currentTarget.style.background = '#002a73'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,51,141,0.22)' }}
// //             onMouseLeave={e => { e.currentTarget.style.background = '#00338D'; e.currentTarget.style.boxShadow = 'none' }}
// //           >
// //             Access Platform <ArrowRight size={15} />
// //           </button>
// //           <button
// //             onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
// //             style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 22px', background: 'transparent', color: '#00338D', border: '1px solid #D0D8E4', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
// //             onMouseEnter={e => e.currentTarget.style.borderColor = '#00338D'}
// //             onMouseLeave={e => e.currentTarget.style.borderColor = '#D0D8E4'}
// //           >
// //             Learn more
// //           </button>
// //         </div>

// //       </section>

// //       {/* Features */}
// //       <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 72px' }}>
// //         <div style={{ marginBottom: 44 }}>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
// //             <div style={{ width: 20, height: 2, background: '#00338D', borderRadius: 2 }} />
// //             <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Platform Capabilities</span>
// //           </div>
// //           <h2 style={{ color: '#0A1628', fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, maxWidth: 440 }}>
// //             Every stage of the process,<br />handled with precision.
// //           </h2>
// //         </div>
// //         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
// //           {FEATURES.map((f, i) => <FeatureCard key={f.number} {...f} index={i} />)}
// //         </div>
// //       </section>

// //       {/* How it works */}
// //       <section style={{ background: 'white', borderTop: '1px solid #E8ECF0', borderBottom: '1px solid #E8ECF0', padding: '72px 0' }}>
// //         <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
// //             <div style={{ width: 20, height: 2, background: '#00338D', borderRadius: 2 }} />
// //             <span style={{ color: '#00338D', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>How It Works</span>
// //           </div>
// //           <h2 style={{ color: '#0A1628', fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 48 }}>
// //             Four steps to a verified result.
// //           </h2>

// //           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
// //             {/* Connector line */}
// //             <div style={{ position: 'absolute', top: 20, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, #E8ECF0, #00338D22, #E8ECF0)', zIndex: 0 }} />

// //             {HOW_IT_WORKS.map((item, i) => (
// //               <div key={i} style={{ padding: '0 24px 0 0', position: 'relative', zIndex: 1 }}>
// //                 {/* Step circle */}
// //                 <div style={{
// //                   width: 40, height: 40, borderRadius: '50%',
// //                   background: i === 3 ? '#00338D' : 'white',
// //                   border: `2px solid ${i === 3 ? '#00338D' : '#E8ECF0'}`,
// //                   display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                   marginBottom: 20,
// //                   boxShadow: i === 3 ? '0 4px 16px rgba(0,51,141,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
// //                 }}>
// //                   <item.icon size={16} color={i === 3 ? 'white' : '#00338D'} strokeWidth={2} />
// //                 </div>
// //                 <div style={{ color: '#00338D', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8, opacity: 0.5 }}>{item.step}</div>
// //                 <div style={{ color: '#0A1628', fontWeight: 700, fontSize: 15, marginBottom: 8, letterSpacing: '-0.01em' }}>{item.label}</div>
// //                 <div style={{ color: '#9BA8B5', fontSize: 13, lineHeight: 1.65 }}>{item.desc}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>

// //       {/* CTA */}
// //       <section style={{ background: '#00338D', padding: '72px 48px' }}>
// //         <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
// //           <div>
// //             <h2 style={{ color: 'white', fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Ready to run your awards?</h2>
// //             <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Select your role and access the platform instantly.</p>
// //           </div>
// //           <button
// //             onClick={() => navigate('/select-role')}
// //             style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', background: 'white', color: '#00338D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '-0.01em' }}
// //             onMouseEnter={e => { e.currentTarget.style.background = '#F0F4FF'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
// //             onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = 'none' }}
// //           >
// //             Enter NobleCrest <ArrowRight size={15} />
// //           </button>
// //         </div>
// //       </section>

// //     </div>
// //   )
// // }



import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Users, BarChart3, Trophy, CheckCircle, Lock, Sparkles, ChevronRight, ArrowUpRight } from 'lucide-react'
import kpmgLogo from '../kpmg-logo.png'

// Advanced parallax hook
function useParallax(speed = 0.5) {
  const ref = useRef(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const elementTop = ref.current.getBoundingClientRect().top
        const windowHeight = window.innerHeight
        if (elementTop < windowHeight) {
          setOffset(window.scrollY * speed)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return [ref, offset]
}

// Enhanced reveal hook with stagger
function useReveal(threshold = 0.15, delay = 0) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          obs.disconnect()
        }
      },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold, delay])

  return [ref, visible]
}

// Animated number counter
function CounterNumber({ end = 100, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !isVisible) {
        setIsVisible(true)
        obs.disconnect()
      }
    }, { threshold: 0.5 })

    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, end, duration])

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  )
}

const FEATURES = [
  { icon: Sparkles, number: '01', title: 'AI Nominee Discovery', desc: "Surfaces distinguished business leaders automatically so your shortlist starts with the right names." },
  { icon: Users, number: '02', title: 'Multi-Role Governance', desc: "Admin, Head Jury, and Jury each operate in purpose-built workspaces with enforced permissions and clear accountability." },
  { icon: Trophy, number: '03', title: 'Structured Ranking', desc: "Jury members rank nominees on an intuitive drag-and-drop board. Every position carries weighted points, ensuring a rigorous and defensible outcome." },
  { icon: BarChart3, number: '04', title: 'Real-Time Consensus', desc: "A live leaderboard shows where collective opinion converges, giving the Head Jury full visibility before the final decision." },
  { icon: CheckCircle, number: '05', title: 'Admin-Controlled Vetting', desc: "Nominees are reviewed and approved by the administrator before jury access. Credentials verified, standards upheld, only the best advance." },
  { icon: Lock, number: '06', title: 'Complete Audit Trail', desc: "Every action logged. Every role enforced. Access granted only by admins — transparent, credible, and beyond reproach." },
]

const HOW_IT_WORKS = [
  { step: '01', label: 'Create Award', desc: 'Admin configures the award, sets criteria and nominee targets.', icon: Trophy },
  { step: '02', label: 'Discover Nominees', desc: 'AI surfaces high-profile candidates. Admin reviews and finalises.', icon: Sparkles },
  { step: '03', label: 'Jury Evaluation', desc: 'Jury reviews approved nominees and submits their ranked order. Head Jury consolidates and locks the result.', icon: Users },
  { step: '04', label: 'Final Result', desc: 'Head Jury locks the final ranking as the official result.', icon: CheckCircle },
]

// Premium Feature Card with advanced interactions
function FeatureCard({ icon: Icon, number, title, desc, index }) {
  const [ref, visible] = useReveal(0.15, index * 40)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePos({ x, y })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible 
          ? `translateY(0) perspective(1000px) rotateX(0) rotateY(0)` 
          : `translateY(60px) perspective(1000px) rotateX(15deg)`,
        transition: `all 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${index * 80}ms`,
        padding: '36px',
        background: isHovered
          ? `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,244,255,0.95))`
          : `linear-gradient(135deg, #FFFFFF, #FAFBFD)`,
        border: `1.5px solid ${isHovered ? 'rgba(0,51,141,0.25)' : '#E8ECF0'}`,
        borderRadius: 20,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHovered
          ? '0 30px 60px rgba(0,51,141,0.15), 0 0 1px rgba(0,51,141,0.1)'
          : '0 8px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
        transform: isHovered
          ? `translateY(-8px) perspective(1000px) rotateX(${(mousePos.y - 0.5) * 5}deg) rotateY(${(mousePos.x - 0.5) * -5}deg)`
          : `translateY(0) perspective(1000px) rotateX(0) rotateY(0)`,
        transition: isHovered
          ? 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
          : `all 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${index * 80}ms`,
        ref: cardRef,
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: isHovered
            ? `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(0,145,218,0.15), transparent)`
            : 'radial-gradient(circle at 50% 50%, rgba(0,51,141,0.05), transparent)',
          transition: 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Glossy shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: isHovered
            ? `linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent)`
            : 'linear-gradient(45deg, transparent, transparent)',
          animation: isHovered ? 'shimmer 0.8s infinite' : 'none',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Icon Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
        }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: isHovered
              ? `linear-gradient(135deg, #00338D, #0091DA)`
              : `linear-gradient(135deg, #EEF2FF, #F3F6FB)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all 0.4s cubic-bezier(0.23, 1, 0.32, 1)`,
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            boxShadow: isHovered
              ? '0 8px 20px rgba(0,51,141,0.25)'
              : '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <Icon
              size={24}
              color={isHovered ? 'white' : '#00338D'}
              strokeWidth={1.5}
              style={{ transition: 'all 0.3s ease' }}
            />
          </div>

          <span style={{
            color: '#00338D',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: isHovered ? 1 : 0.5,
            transition: 'all 0.3s ease',
          }}>
            {number}
          </span>
        </div>

        {/* Title */}
        <div style={{
          color: '#0A1628',
          fontWeight: 800,
          fontSize: 17,
          marginBottom: 12,
          lineHeight: 1.35,
          transition: 'color 0.3s ease',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        {/* Description */}
        <div style={{
          color: '#6B7A8D',
          fontSize: 14,
          lineHeight: 1.8,
          transition: `color 0.3s ease, transform 0.3s ease`,
          color: isHovered ? '#4A5A6D' : '#6B7A8D',
          transform: isHovered ? 'translateY(2px)' : 'translateY(0)',
        }}>
          {desc}
        </div>
      </div>
    </div>
  )
}

// Enhanced Timeline Step
function TimelineStep({ icon: Icon, step, label, desc, index, isLast }) {
  const [ref, visible] = useReveal(0.15, index * 100)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '0 24px 0 0',
        position: 'relative',
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(50px)',
        transition: `all 0.7s cubic-bezier(0.23, 1, 0.32, 1) ${index * 100}ms`,
      }}
    >
      {/* Step Circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: index === 3
            ? 'linear-gradient(135deg, #00338D, #0091DA)'
            : isHovered
            ? 'linear-gradient(135deg, #F0F4FF, #EEF2FF)'
            : 'white',
          border: `2.5px solid ${index === 3 ? '#00338D' : isHovered ? '#00338D' : '#E8ECF0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          boxShadow: index === 3
            ? '0 16px 40px rgba(0,51,141,0.3)'
            : isHovered
            ? '0 16px 40px rgba(0,51,141,0.2)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: `all 0.4s cubic-bezier(0.23, 1, 0.32, 1)`,
          transform: isHovered ? 'scale(1.2) translateY(-8px)' : 'scale(1) translateY(0)',
          position: 'relative',
        }}
      >
        {/* Pulse ring on hover */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px solid ${index === 3 ? 'rgba(255,255,255,0.5)' : 'rgba(0,51,141,0.3)'}`,
              animation: 'pulse-ring 1.5s ease-out infinite',
            }}
          />
        )}

        <Icon
          size={28}
          color={index === 3 || isHovered ? (index === 3 ? 'white' : '#00338D') : '#00338D'}
          strokeWidth={1.5}
          style={{
            transition: `all 0.3s ease`,
            filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
          }}
        />
      </div>

      {/* Step Label */}
      <div style={{
        color: '#00338D',
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.18em',
        marginBottom: 10,
        opacity: isHovered ? 1 : 0.5,
        transition: `all 0.3s ease`,
        textTransform: 'uppercase',
      }}>
        {step}
      </div>

      {/* Step Title */}
      <div style={{
        color: '#0A1628',
        fontWeight: 800,
        fontSize: 17,
        marginBottom: 10,
        letterSpacing: '-0.01em',
        transition: `all 0.3s ease`,
        transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
      }}>
        {label}
      </div>

      {/* Step Description */}
      <div style={{
        color: '#9BA8B5',
        fontSize: 14,
        lineHeight: 1.75,
        transition: `all 0.3s ease`,
        color: isHovered ? '#6B7A8D' : '#9BA8B5',
      }}>
        {desc}
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [isNavSticky, setIsNavSticky] = useState(false)
  const [heroRef, heroOffset] = useParallax(0.4)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setIsNavSticky(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F7F9FC 0%, #FFFFFF 40%, #F9FAFB 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: 'hidden',
      color: '#0A1628',
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(40px) rotate(1deg); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(60px); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0,51,141,0.4); 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 50px rgba(0,51,141,0.7); 
            transform: scale(1.05);
          }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @keyframes glow-border {
          0%, 100% { box-shadow: inset 0 0 20px rgba(0,51,141,0.1); }
          50% { box-shadow: inset 0 0 40px rgba(0,51,141,0.2); }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes bounce-small {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .gradient-text {
          background: linear-gradient(135deg, #00338D 0%, #0091DA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
      `}</style>

      {/* Animated background grid */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(rgba(0,51,141,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,51,141,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.8,
        }}
      />

      {/* Animated gradient orbs */}
      <div
        style={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0,51,141,0.12), transparent)',
          borderRadius: '50%',
          animation: 'float 12s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0,145,218,0.1), transparent)',
          borderRadius: '50%',
          animation: 'float 15s ease-in-out infinite reverse',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(40px)',
        }}
      />

      {/* Navigation */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: isNavSticky
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.4)',
          backdropFilter: isNavSticky ? 'blur(20px)' : 'blur(8px)',
          borderBottom: isNavSticky ? '1px solid rgba(0,51,141,0.08)' : 'none',
          padding: '0 48px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: isNavSticky ? '0 8px 32px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 10 }}>
          <img
            src={kpmgLogo}
            alt="KPMG"
            style={{
              height: 48,
              width: 'auto',
              objectFit: 'contain',
              opacity: 0.85,
              transition: 'opacity 0.3s ease',
            }}
          />
          <div style={{
            width: 1.5,
            height: 26,
            background: 'linear-gradient(180deg, transparent, #D0D8E4, transparent)',
          }} />
          <span className="gradient-text" style={{
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: '-0.02em',
          }}>
            NobleCrest.AI
          </span>
        </div>

        <button
          onClick={() => navigate('/select-role')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 24px',
            background: 'linear-gradient(135deg, #00338D, #0055A8)',
            color: 'white',
            border: 'none',
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
            boxShadow: '0 6px 20px rgba(0,51,141,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,51,141,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,51,141,0.2)'
          }}
        >
          Sign In <ChevronRight size={14} />
        </button>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        style={{
          height: 'calc(100vh - 72px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 48px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          transform: `translateY(${heroOffset * 0.3}px)`,
        }}
      >
        {/* Large background elements */}
        <div
          style={{
            position: 'absolute',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(0,51,141,0.08), transparent)',
            borderRadius: '50%',
            top: '-300px',
            left: '-300px',
            animation: 'float 10s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(0,145,218,0.06), transparent)',
            borderRadius: '50%',
            bottom: '-200px',
            right: '-200px',
            animation: 'float 14s ease-in-out infinite reverse',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 48,
            padding: '10px 22px',
            background: 'linear-gradient(135deg, rgba(238,242,255,0.8), rgba(243,246,251,0.8))',
            border: '1.5px solid rgba(0,51,141,0.15)',
            borderRadius: 28,
            animation: 'slideInDown 1s cubic-bezier(0.23, 1, 0.32, 1)',
            position: 'relative',
            zIndex: 2,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }} />
          <span style={{
            color: '#00338D',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}>
            Platform live · Powered by KPMG
          </span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 'clamp(54px, 9vw, 110px)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            marginBottom: 20,
            animation: 'slideInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.1s backwards',
            position: 'relative',
            zIndex: 2,
            background: 'linear-gradient(180deg, #00338D 0%, #0055A8 50%, #0091DA 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 6s ease infinite, slideInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.1s backwards',
          }}
        >
          NobleCrest.AI
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#00338D',
            marginBottom: 18,
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            animation: 'slideInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.2s backwards',
            position: 'relative',
            zIndex: 2,
          }}
        >
          Awards management, built for precision.
        </p>

        {/* Description */}
        <p
          style={{
            color: '#6B7A8D',
            fontSize: 17,
            lineHeight: 1.85,
            maxWidth: 560,
            margin: '0 auto 56px',
            fontWeight: 400,
            animation: 'slideInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.3s backwards',
            position: 'relative',
            zIndex: 2,
            letterSpacing: '-0.005em',
          }}
        >
          An enterprise-grade platform for running structured, auditable award cycles — from AI-powered nominee discovery to the final verified result.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            animation: 'slideInUp 1s cubic-bezier(0.23, 1, 0.32, 1) 0.4s backwards',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            onClick={() => navigate('/select-role')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 36px',
              background: 'linear-gradient(135deg, #00338D, #0055A8)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 15.5,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 16px 40px rgba(0,51,141,0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 24px 56px rgba(0,51,141,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,51,141,0.25)'
            }}
          >
            Access Platform <ArrowRight size={17} />
          </button>

          <button
            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              background: 'transparent',
              color: '#00338D',
              border: '1.5px solid #D0D8E4',
              borderRadius: 12,
              fontSize: 15.5,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00338D'
              e.currentTarget.style.background = '#F0F4FF'
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,51,141,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#D0D8E4'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Learn more <ArrowUpRight size={16} />
          </button>
        </div>


      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '120px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 28,
              height: 3,
              background: 'linear-gradient(90deg, #00338D, #0091DA)',
              borderRadius: 2,
            }} />
            <span style={{
              color: '#00338D',
              fontSize: 11.5,
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              Platform Capabilities
            </span>
          </div>

          <h2 style={{
            color: '#0A1628',
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            maxWidth: 560,
          }}>
            Every stage of the process,<br />handled with precision.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 28,
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.number} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderTop: '1px solid #E8ECF0',
          padding: '120px 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 28,
              height: 3,
              background: 'linear-gradient(90deg, #00338D, #0091DA)',
              borderRadius: 2,
            }} />
            <span style={{
              color: '#00338D',
              fontSize: 11.5,
              fontWeight: 900,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              How It Works
            </span>
          </div>

          <h2 style={{
            color: '#0A1628',
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: 72,
          }}>
            Four steps to a verified result.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
            position: 'relative',
          }}>
            {/* Animated connector line */}
            <div style={{
              position: 'absolute',
              top: 32,
              left: '16%',
              right: '16%',
              height: 2.5,
              background: 'linear-gradient(90deg, #E8ECF0, #00338D, #0091DA, #00338D, #E8ECF0)',
              zIndex: 0,
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,51,141,0.15)',
            }} />

            {HOW_IT_WORKS.map((item, i) => (
              <TimelineStep
                key={i}
                {...item}
                index={i}
                isLast={i === HOW_IT_WORKS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #00338D 0%, #0055A8 50%, #0091DA 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 8s ease infinite',
          padding: '96px 48px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Background elements */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
            borderRadius: '50%',
            top: '-200px',
            right: '-150px',
            animation: 'float 15s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 56,
          position: 'relative',
          zIndex: 1,
        }}>
          <div>
            <h2 style={{
              color: 'white',
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 16,
              lineHeight: 1.2,
            }}>
              Ready to run your awards?
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 17,
              lineHeight: 1.7,
              maxWidth: 400,
              fontWeight: 400,
            }}>
              Select your role and access the platform instantly.
            </p>
          </div>

          <button
            onClick={() => navigate('/select-role')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '18px 40px',
              background: 'white',
              color: '#00338D',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: '-0.01em',
              transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'
            }}
          >
            Enter NobleCrest <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  )
}