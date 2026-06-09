import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ShieldCheck, BarChart3, Repeat2, Zap, Globe, Lock,
  ChevronRight, Sparkles, TrendingUp, ArrowRight,
} from 'lucide-react';

/* ── Datos de contenido ─────────────────────────────────── */
const FEATURES = [
  {
    icon: BarChart3,
    color: '#7c5cfc',
    bg: 'rgba(124,92,252,0.12)',
    border: 'rgba(124,92,252,0.22)',
    title: 'Visibilidad Total',
    desc: 'Patrimonio consolidado en tiempo real. Cada cuenta, cada movimiento, todo en un solo lugar.',
  },
  {
    icon: Globe,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.22)',
    title: 'Multi-divisa Inteligente',
    desc: 'Conversión automática entre Bs., USD, EUR y USDT con tasas BCV y Binance actualizadas.',
  },
  {
    icon: Zap,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.22)',
    title: 'Decisiones con Certeza',
    desc: 'Análisis de flujo, estadísticas mensuales y alertas inteligentes para cada movimiento.',
  },
  {
    icon: ShieldCheck,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.22)',
    title: 'Seguridad Bancaria',
    desc: 'Cifrado extremo a extremo. Tus datos financieros nunca han estado tan protegidos.',
  },
];

const STATS = [
  { value: 'Acceso', label: 'Anticipado', dot: '#7c5cfc' },
  { value: '4.9★', label: 'Calificación Beta', dot: '#f59e0b' },
];

/* ── Partículas flotantes ─────────────────────────────────── */
function Particles() {
  const particles = useMemo(() =>
    [...Array(8)].map((_, i) => ({
      left: `${[8, 75, 20, 60, 42, 88, 30, 65][i]}%`,
      top: `${[15, 25, 55, 10, 75, 45, 85, 65][i]}%`,
      delay: [0, 0.9, 1.6, 2.2, 0.5, 1.3, 0.2, 1.8][i],
      duration: [4.2, 3.8, 5.1, 4.5, 3.5, 4.8, 5.5, 4.0][i],
      color: ['#7c5cfc','#4f46e5','#3b82f6','#a855f7','#06b6d4','#7c5cfc','#a78bfa','#60a5fa'][i],
      size: [4, 3, 5, 3, 4, 5, 3, 4][i],
    })), []
  );

  return (
    <>
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 10px 3px ${p.color}55`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            opacity: 0.5,
          }}
        />
      ))}
    </>
  );
}

/* ── Mock mini-dashboard flotante ────────────────────────── */
function MiniDashboard() {
  return (
    <motion.div
      className="float-subtle"
      initial={{ opacity: 0, scale: 0.88, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.55, type: 'spring', stiffness: 180, damping: 18 }}
      style={{
        width: '88%',
        maxWidth: 320,
        background: 'rgba(18, 18, 32, 0.88)',
        border: '1px solid rgba(124, 92, 252, 0.22)',
        borderRadius: 20,
        padding: '16px 18px',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Header mini */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
            Patrimonio Total
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            $12,480<span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>.00</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 100, padding: '4px 10px' }}>
          <TrendingUp size={10} color="#4ade80" />
          <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 11, color: '#4ade80' }}>+$340 mes</span>
        </div>
      </div>
      {/* Barras de cuentas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Cuenta Principal', pct: 70, color: '#7c5cfc', amount: '$8,736' },
          { label: 'USDT Reserve', pct: 22, color: '#06b6d4', amount: '$2,746' },
          { label: 'Bolívares', pct: 8, color: '#f59e0b', amount: '$998' },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{item.amount}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: item.color, borderRadius: 100 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Landing Page Principal ────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <div
      className="landing-shell"
      style={{ fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' }}
    >
      {/* ── Glow de fondo ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(124,92,252,0.22) 0%, rgba(79,70,229,0.1) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '15%', right: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(6,182,212,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Partículas */}
      <Particles />

      {/* ── Hero Section ── */}
      <div className="flex flex-col items-center justify-start text-center z-10 px-6 pt-14 pb-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="badge badge-violet mb-6"
        >
          <Sparkles size={10} />
          Acceso Anticipado · Beta
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.12 }}
          className="relative flex items-center justify-center mb-8"
          style={{
            width: 84, height: 84, borderRadius: 28,
            background: 'linear-gradient(148deg, #3d2aad 0%, #6b47e8 45%, #9d7ffe 75%, #c084fc 100%)',
            boxShadow: '0 0 40px rgba(124,92,252,0.55), 0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          <div className="pulse-ring" style={{ borderRadius: 28 }} />
          <span
            style={{
              position: 'absolute', inset: 0, borderRadius: 28,
              background: 'linear-gradient(148deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)',
            }}
          />
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800, fontSize: 38, color: '#fff',
              lineHeight: 1, letterSpacing: -1.5, position: 'relative',
            }}
          >
            F
          </span>
        </motion.div>

        {/* Tagline principal */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.55, delay: 0.22 }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: 31,
            lineHeight: 1.18, letterSpacing: -0.9,
            color: '#ededfc', margin: '0 0 10px',
          }}
        >
          El sistema nervioso<br />
          <span
            style={{
              background: 'linear-gradient(92deg, #8b6dfd 0%, #c084fc 45%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            de tus finanzas.
          </span>
        </motion.h1>

        {/* Sub-tagline */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.32 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14.5, color: '#6b6b8a',
            lineHeight: 1.7, maxWidth: 268,
            margin: '0 auto 8px',
          }}
        >
          Registra. Analiza. Decide con certeza.
        </motion.p>

        {/* Tagline secundaria */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.38 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: '#4e4e6a',
            lineHeight: 1.65, maxWidth: 290,
            margin: '0 auto',
          }}
        >
          Control total de tu patrimonio en múltiples divisas,
          en tiempo real, desde cualquier lugar.
        </motion.p>

        {/* Social proof */}
        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: 'easeOut', duration: 0.5, delay: 0.44 }}
          className="flex gap-3 mt-6 flex-wrap justify-center"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 100, padding: '5px 14px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', boxShadow: `0 0 6px ${s.dot}88` }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 12, color: '#ededfc' }}>
                {s.value}
              </span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#6b6b8a' }}>
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Mini Dashboard Preview ── */}
      <div className="flex justify-center w-full px-6 mb-8 z-10 relative">
        <MiniDashboard />
      </div>

      {/* ── Feature Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="px-5 mb-8 z-10 relative"
      >
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: '#4e4e6a', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', marginBottom: 14 }}>
          Por qué Finnix es diferente
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="feature-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ cursor: 'default' }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 11,
                    background: f.bg, border: `1px solid ${f.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Icon size={17} color={f.color} strokeWidth={2} />
                </div>
                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 12, color: '#ededfc', margin: '0 0 5px', letterSpacing: -0.2 }}>
                  {f.title}
                </p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#5e5e7a', lineHeight: 1.55, margin: 0 }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── CTA Section ── */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5, delay: 0.8 }}
        className="w-full flex flex-col gap-3 px-6 pb-10 z-10 relative"
      >
        {/* Separador visual */}
        <div className="divider mb-1" style={{ marginBottom: 18 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#3a3a52', fontWeight: 500 }}>
            Comienza ahora · Es gratuito
          </span>
        </div>

        {/* Botón principal */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/signup')}
          className="btn-premium"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          Crear mi cuenta gratuita
          <ArrowRight size={16} strokeWidth={2.5} />
        </motion.button>

        {/* Botón secundario */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ background: 'rgba(255,255,255,0.07)' }}
          onClick={() => navigate('/login')}
          style={{
            height: 52, borderRadius: 100,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#a0a0c0',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600, fontSize: 15, letterSpacing: -0.2,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          Ya tengo una cuenta
          <ChevronRight size={15} color="currentColor" />
        </motion.button>

        {/* Disclaimer legal */}
        <p style={{ fontSize: 10.5, color: 'rgba(78,78,106,0.7)', textAlign: 'center', marginTop: 4, lineHeight: 1.6 }}>
          Al continuar aceptas los{' '}
          <a href="/terms" style={{ color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>Términos de Uso</a>
          {' '}y la{' '}
          <a href="/privacy" style={{ color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>Política de Privacidad</a>
          .<br />Sin tarjeta de crédito requerida.
        </p>
      </motion.div>
    </div>
  );
}