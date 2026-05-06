import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#00338D]">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 30%, #0055b3 0%, #00338D 55%, #001a4d 100%)'
      }} />
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
        backgroundSize: '36px 36px'
      }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #0091DA, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #7F3F98, transparent 70%)' }} />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm mb-10">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs font-semibold tracking-wide">Powered by KPMG</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.0] tracking-tight mb-6">
          Award<br />
          <span className="text-transparent bg-clip-text" style={{
            backgroundImage: 'linear-gradient(90deg, #60C6FF 0%, #B794F4 50%, #60C6FF 100%)'
          }}>
            Management
          </span><br />
          Platform
        </h1>

        <p className="text-white/55 text-lg leading-relaxed mb-12 max-w-md mx-auto">
          A secure, transparent platform for managing the Award Management process end-to-end.
        </p>

        <button
          onClick={() => navigate('/select-role')}
          className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white text-[#00338D] rounded-2xl font-bold text-base hover:bg-gray-50 transition-all shadow-2xl hover:-translate-y-0.5">
          Access Platform
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  )
}
