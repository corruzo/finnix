import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { auth, googleProvider, isMockMode } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!form.email || !form.password) return setError('Llena todos los campos');
    
    setError('');
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        const mockUser = { uid: 'mock-local', email: form.email, displayName: 'Demo User' };
        localStorage.setItem('finnix_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate('/dashboard');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas o correo no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        const mockUser = { uid: 'mock-google', email: 'google@demo.com', displayName: 'Google User' };
        localStorage.setItem('finnix_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate('/dashboard');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    height: 52,
    borderRadius: 16,
    background: '#1e1e2e',
    border: `1px solid ${focused === field ? '#7c5cfc' : 'rgba(255,255,255,0.07)'}`,
    color: '#f1f0ff',
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    paddingLeft: 48,
    paddingRight: field === 'password' ? 48 : 16,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    boxShadow: focused === field ? '0 0 0 3px rgba(124,92,252,0.15)' : 'none',
  });

  return (
    <div
      className="app-shell flex flex-col relative overflow-hidden pb-safe"
      style={{ height: '100dvh', background: '#0d0d14', fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        ::placeholder { color: #4a4a6a; }
      `}</style>

      {/* Header arc gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(135deg, #4c3bc4 0%, #7c5cfc 55%, #a855f7 100%)',
        borderRadius: '0 0 40px 40px',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180,
        background: 'linear-gradient(to bottom, transparent 60%, #0d0d14 100%)',
        borderRadius: '0 0 40px 40px',
        zIndex: 1,
      }} />

      {/* Glow */}
      <div className="absolute pointer-events-none" style={{
        top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,92,252,0.12) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 52, left: 20, zIndex: 10,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <ArrowLeft size={18} color="#fff" />
      </motion.button>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
        style={{
          zIndex: 10, alignSelf: 'center', marginTop: 44,
          width: 60, height: 60, borderRadius: 20,
          background: 'linear-gradient(135deg, #4c3bc4 0%, #7c5cfc 55%, #a855f7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(124,92,252,0.5)',
          position: 'relative',
        }}
      >
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)',
        }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26, color: '#fff' }}>F</span>
      </motion.div>

      {/* Form area */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5, delay: 0.25 }}
        style={{ zIndex: 10, padding: '24px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26,
          color: '#f1f0ff', margin: '0 0 6px', letterSpacing: -0.6,
        }}>
          Bienvenido de vuelta
        </h1>
        <p style={{ fontSize: 14, color: '#8b8ba7', margin: '0 0 28px' }}>
          Ingresa a tu cuenta para continuar
        </p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e',
            padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20
          }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {/* Email */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Mail size={16} color={focused === 'email' ? '#7c5cfc' : '#4a4a6a'}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', zIndex: 1 }} />
          <input
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused('')}
            style={inputStyle('email')}
          />
        </div>

        {/* Password */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Lock size={16} color={focused === 'password' ? '#7c5cfc' : '#4a4a6a'}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', zIndex: 1 }} />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused('')}
            style={inputStyle('password')}
          />
          <button
            onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {showPass ? <EyeOff size={16} color="#4a4a6a" /> : <Eye size={16} color="#4a4a6a" />}
          </button>
        </div>

        {/* Forgot */}
        <div style={{ textAlign: 'right', marginBottom: 28 }}>
          <button
            onClick={() => navigate('/forgot')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Login button */}
        <motion.button
          whileTap={!loading ? { scale: 0.95 } : {}}
          whileHover={!loading ? { filter: 'brightness(1.1)' } : {}}
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', height: 56, borderRadius: 100,
            background: 'linear-gradient(135deg, #7c5cfc 0%, #4f46e5 100%)',
            border: 'none', color: '#fff',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
            cursor: loading ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(124,92,252,0.4)',
            marginBottom: 20,
          }}
        >
          <span style={{ position: 'absolute', inset: '0 0 50% 0', background: 'rgba(255,255,255,0.09)', borderRadius: '100px 100px 0 0' }} />
          {loading ? 'Iniciando...' : 'Ingresar'}
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 12, color: '#4a4a6a' }}>o continúa con</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{
              flex: 1, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#c4c4e0', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>G</span> Google
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            style={{
              flex: 1, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#c4c4e0', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Apple
          </motion.button>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#8b8ba7', margin: 0 }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            Regístrate
          </button>
        </p>
      </motion.div>

      <div style={{ height: 32 }} />
    </div>
  );
}