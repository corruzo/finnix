import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();

  const particles = useMemo(() =>
    [...Array(6)].map((_, i) => ({
      left: `${[12, 78, 22, 65, 48, 88][i]}%`,
      bottom: `${[42, 55, 68, 35, 75, 62][i]}%`,
      delay: `${[0, 0.8, 1.5, 2, 0.4, 1.2][i]}s`,
      duration: `${[4, 3.5, 5, 4.2, 3.8, 4.5][i]}s`,
      color: ['#7c5cfc','#4f46e5','#3b82f6','#7c5cfc','#a855f7','#60a5fa'][i],
      size: [5, 5, 4, 3, 5, 4][i],
    })), []
  );

  return (
    <div
      className="app-shell flex flex-col justify-between items-center px-6 pb-10 relative overflow-hidden"
      style={{ height: '100dvh', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Radial glows ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '18%', left: '50%', transform: 'translateX(-50%)',
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,92,252,0.28) 0%, rgba(79,70,229,0.12) 50%, transparent 72%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '10%', right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }}
      />

      {/* ── Floating particles ── */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px 2px ${p.color}66`,
            animation: `finFloatUp ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      {/* ── Keyframes injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes finFloatUp {
          0%   { transform: translateY(0px)   scale(1);   opacity: .6; }
          50%  { transform: translateY(-18px) scale(1.2); opacity: 1;  }
          100% { transform: translateY(0px)   scale(1);   opacity: .6; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full mt-4">

        {/* Logo box */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
          className="relative flex items-center justify-center mb-7"
          style={{
            width: 80, height: 80,
            borderRadius: 26,
            background: 'linear-gradient(135deg, #4c3bc4 0%, #7c5cfc 55%, #a855f7 100%)',
            boxShadow: '0 0 32px rgba(124,92,252,0.5), 0 12px 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* inner glass highlight */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: 26,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)',
            }}
          />
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: 36, color: '#fff',
              lineHeight: 1, letterSpacing: -1, position: 'relative',
            }}
          >
            F
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.25 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: 32,
            lineHeight: 1.15, letterSpacing: -0.8,
            color: '#f1f0ff', margin: '0 0 14px',
          }}
        >
          Tus Finanzas,<br />
          <span
            style={{
              background: 'linear-gradient(90deg, #7c5cfc 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Sin Límites.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.35 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, color: '#8b8ba7',
            lineHeight: 1.65, maxWidth: 272, margin: '0 auto',
          }}
        >
          Controla gastos, ingresos y presupuestos en tiempo real. Simple, seguro y siempre contigo.
        </motion.p>

        {/* Social proof pills */}
        <motion.div
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.42 }}
          className="flex gap-3 mt-7"
        >
          {[
            { dot: '#22c55e', value: '12k+', label: 'usuarios' },
            { dot: '#3b82f6', value: '4.9★', label: 'valoración' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100, padding: '6px 14px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 12, color: '#f1f0ff' }}>
                {s.value}
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 500, fontSize: 12, color: '#8b8ba7' }}>
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── CTAs ── */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5, delay: 0.5 }}
        className="w-full flex flex-col gap-3 z-10"
      >
        {/* Primary */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ filter: 'brightness(1.12)', y: -1 }}
          onClick={() => navigate('/signup')}
          className="w-full relative overflow-hidden"
          style={{
            height: 56, borderRadius: 100, border: 'none',
            background: 'linear-gradient(135deg, #7c5cfc 0%, #4f46e5 100%)',
            color: '#fff',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(124,92,252,0.4)',
          }}
        >
          {/* Glass top sheen */}
          <span
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '50%',
              background: 'rgba(255,255,255,0.10)',
              borderRadius: '100px 100px 0 0',
            }}
          />
          Comenzar ahora
        </motion.button>

        {/* Ghost */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ background: 'rgba(255,255,255,0.08)', y: -1 }}
          onClick={() => navigate('/login')}
          className="w-full"
          style={{
            height: 56, borderRadius: 100,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#c4c4e0',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600, fontSize: 16, letterSpacing: -0.2,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          Iniciar sesión
        </motion.button>

        {/* Terms */}
        <p style={{ fontSize: 11, color: 'rgba(139,139,167,0.55)', textAlign: 'center', margin: '6px 0 0' }}>
          Al continuar aceptas los{' '}
          <a href="/terms" style={{ color: '#7c5cfc', textDecoration: 'none' }}>Términos de uso</a>
          {' '}y{' '}
          <a href="/privacy" style={{ color: '#7c5cfc', textDecoration: 'none' }}>Privacidad</a>
        </p>
      </motion.div>
    </div>
  );
}