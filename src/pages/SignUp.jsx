import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { auth, googleProvider, isMockMode } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSignUp = async () => {
    if (!agreed) return;
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    
    setError('');
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        const mockUser = { uid: 'mock-local', email: form.email, displayName: form.name || 'Demo User' };
        localStorage.setItem('finnix_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate('/dashboard');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      if (form.name) {
        await updateProfile(userCredential.user, { displayName: form.name });
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.code === 'auth/email-already-in-use' ? 'El correo ya está registrado' : 'Error al crear cuenta');
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

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColors = ['#f43f5e', '#f59e0b', '#22c55e', '#22c55e'];
  const strengthLabels = ['Débil', 'Regular', 'Fuerte', 'Muy fuerte'];

  const inputStyle = (field) => ({
    width: '100%', height: 52, borderRadius: 16,
    background: '#1e1e2e',
    border: `1px solid ${focused === field ? '#7c5cfc' : 'rgba(255,255,255,0.07)'}`,
    color: '#f1f0ff', fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    paddingLeft: 48,
    paddingRight: ['password','confirm'].includes(field) ? 48 : 16,
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    boxShadow: focused === field ? '0 0 0 3px rgba(124,92,252,0.15)' : 'none',
  });

  const fields = [
    { key: 'name',     Icon: User,  type: 'text',     placeholder: 'Nombre completo' },
    { key: 'email',    Icon: Mail,  type: 'email',    placeholder: 'tu@correo.com' },
    { key: 'password', Icon: Lock,  type: 'password', placeholder: 'Contraseña', toggle: true, toggleState: showPass, onToggle: () => setShowPass(v => !v) },
    { key: 'confirm',  Icon: Lock,  type: 'password', placeholder: 'Confirmar contraseña', toggle: true, toggleState: showConfirm, onToggle: () => setShowConfirm(v => !v) },
  ];

  return (
    <div
      className="app-shell flex flex-col relative overflow-hidden pb-safe"
      style={{ height: '100dvh', background: '#0d0d14', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        ::placeholder { color: #4a4a6a; }
      `}</style>

      {/* Header arc */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(135deg, #4c3bc4 0%, #7c5cfc 55%, #a855f7 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, transparent 50%, #0d0d14 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 1,
      }} />

      {/* Glow */}
      <div className="absolute pointer-events-none" style={{
        top: '25%', left: '50%', transform: 'translateX(-50%)',
        width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,92,252,0.10) 0%, transparent 70%)',
      }} />

      {/* Back */}
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
          boxShadow: '0 0 24px rgba(124,92,252,0.5)', position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)' }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26, color: '#fff' }}>F</span>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5, delay: 0.25 }}
        style={{ zIndex: 10, padding: '22px 24px 40px', display: 'flex', flexDirection: 'column' }}
      >
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 26,
          color: '#f1f0ff', margin: '0 0 6px', letterSpacing: -0.6,
        }}>
          Crear cuenta
        </h1>
        <p style={{ fontSize: 14, color: '#8b8ba7', margin: '0 0 24px' }}>
          Empieza a controlar tus finanzas hoy
        </p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e',
            padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20
          }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {/* Fields */}
        {fields.map(({ key, Icon, type, placeholder, toggle, toggleState, onToggle }, idx) => (
          <motion.div
            key={key}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + idx * 0.07 }}
            style={{ position: 'relative', marginBottom: key === 'password' && form.password ? 8 : 14 }}
          >
            <Icon
              size={16}
              color={focused === key ? '#7c5cfc' : '#4a4a6a'}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', zIndex: 1 }}
            />
            <input
              type={toggle ? (toggleState ? 'text' : 'password') : type}
              placeholder={placeholder}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused('')}
              style={inputStyle(key)}
            />
            {toggle && (
              <button
                onClick={onToggle}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {toggleState ? <EyeOff size={16} color="#4a4a6a" /> : <Eye size={16} color="#4a4a6a" />}
              </button>
            )}
          </motion.div>
        ))}

        {/* Password strength */}
        {form.password && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 14 }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 100,
                  background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: strength > 0 ? strengthColors[strength - 1] : '#4a4a6a' }}>
              {strength > 0 ? strengthLabels[strength - 1] : ''}
            </span>
          </motion.div>
        )}

        {/* Terms checkbox */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}
        >
          <button
            onClick={() => setAgreed(v => !v)}
            style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
              background: agreed ? 'linear-gradient(135deg, #7c5cfc, #4f46e5)' : 'transparent',
              border: `1.5px solid ${agreed ? '#7c5cfc' : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
          </button>
          <p style={{ fontSize: 13, color: '#8b8ba7', margin: 0, lineHeight: 1.5 }}>
            Acepto los{' '}
            <a href="/terms" style={{ color: '#7c5cfc', textDecoration: 'none' }}>Términos de uso</a>
            {' '}y la{' '}
            <a href="/privacy" style={{ color: '#7c5cfc', textDecoration: 'none' }}>Política de privacidad</a>
          </p>
        </motion.div>

        {/* Submit */}
        <motion.button
          whileTap={!loading && agreed ? { scale: 0.95 } : {}}
          whileHover={!loading && agreed ? { filter: 'brightness(1.1)' } : {}}
          onClick={handleSignUp}
          disabled={!agreed || loading}
          style={{
            width: '100%', height: 56, borderRadius: 100,
            background: agreed
              ? 'linear-gradient(135deg, #7c5cfc 0%, #4f46e5 100%)'
              : 'rgba(255,255,255,0.06)',
            border: 'none', color: agreed ? '#fff' : '#4a4a6a',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 700, fontSize: 16, letterSpacing: -0.2,
            cursor: agreed && !loading ? 'pointer' : 'not-allowed',
            position: 'relative', overflow: 'hidden',
            boxShadow: agreed ? '0 4px 24px rgba(124,92,252,0.4)' : 'none',
            transition: 'all 0.3s ease', marginBottom: 20,
          }}
        >
          {agreed && <span style={{ position: 'absolute', inset: '0 0 50% 0', background: 'rgba(255,255,255,0.09)', borderRadius: '100px 100px 0 0' }} />}
          {loading ? 'Procesando...' : 'Crear cuenta'}
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 12, color: '#4a4a6a' }}>o regístrate con</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Social */}
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

        <p style={{ textAlign: 'center', fontSize: 14, color: '#8b8ba7', margin: 0 }}>
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            Inicia sesión
          </button>
        </p>
      </motion.div>
    </div>
  );
}