import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, isMockMode } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

/* ── Mapeo de errores Firebase Auth ─────────────────────── */
const AUTH_ERRORS = {
  'auth/user-not-found':            'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password':            'Contraseña incorrecta. Verifica e inténtalo de nuevo.',
  'auth/invalid-credential':        'Credenciales inválidas. Verifica tu correo y contraseña.',
  'auth/invalid-email':             'El formato del correo electrónico es inválido.',
  'auth/user-disabled':             'Esta cuenta ha sido deshabilitada. Contacta soporte.',
  'auth/too-many-requests':         'Demasiados intentos fallidos. Espera unos minutos antes de reintentar.',
  'auth/network-request-failed':    'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.',
  'auth/popup-closed-by-user':      'El inicio de sesión fue cancelado.',
  'auth/cancelled-popup-request':   'El inicio de sesión fue cancelado.',
  'auth/popup-blocked':             'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e inténtalo de nuevo.',
  'auth/operation-not-allowed':     'Este método de inicio de sesión no está habilitado.',
  'auth/internal-error':            'Error interno del servidor. Inténtalo de nuevo.',
};

function getAuthErrorMessage(code) {
  return AUTH_ERRORS[code] || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

/* ── Campo de entrada con icono ─────────────────────────── */
function InputField({ icon: Icon, type, placeholder, value, onChange, onFocus, onBlur, focused, fieldKey, rightElement, autoComplete }) {
  const isFocused = focused === fieldKey;
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        size={15}
        color={isFocused ? '#7c5cfc' : '#3a3a52'}
        style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          transition: 'color 0.2s', zIndex: 1, pointerEvents: 'none',
        }}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => onFocus(fieldKey)}
        onBlur={() => onBlur('')}
        autoComplete={autoComplete}
        style={{
          width: '100%', height: 52, borderRadius: 15,
          background: isFocused ? 'rgba(124,92,252,0.06)' : '#13131e',
          border: `1px solid ${isFocused ? 'rgba(124,92,252,0.55)' : 'rgba(255,255,255,0.065)'}`,
          color: '#ededfc', fontSize: 14.5,
          fontFamily: "'DM Sans', sans-serif",
          paddingLeft: 46,
          paddingRight: rightElement ? 48 : 16,
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
          boxShadow: isFocused ? '0 0 0 3px rgba(124,92,252,0.12)' : 'none',
        }}
      />
      {rightElement}
    </div>
  );
}

/* ── Botón Google ───────────────────────────────────────── */
function SocialBtn({ onClick, disabled, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, height: 50, borderRadius: 13,
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#9090b0', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        fontWeight: 600, fontSize: 13.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ── Icono Google SVG ───────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ── Login Page ─────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const blockTimerRef = useRef(null);
  const { setUser } = useAuthStore();

  const triggerShake = useCallback(() => setShakeKey(k => k + 1), []);

  /* Limpiar error al escribir */
  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (error) setError('');
  };

  /* Rate limiting local: bloquear 30s tras 4 fallos */
  const handleFail = useCallback((msg) => {
    setError(msg);
    triggerShake();
    const newCount = failCount + 1;
    setFailCount(newCount);
    if (newCount >= 4) {
      setBlocked(true);
      setError('Demasiados intentos. Espera 30 segundos antes de reintentar.');
      blockTimerRef.current = setTimeout(() => {
        setBlocked(false);
        setFailCount(0);
        setError('');
      }, 30000);
    }
  }, [failCount, triggerShake]);

  const validate = () => {
    if (!form.email.trim()) return 'El correo electrónico es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'El formato del correo es inválido.';
    if (!form.password) return 'La contraseña es obligatoria.';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  };

  const handleLogin = async () => {
    if (blocked || loading) return;
    const validationError = validate();
    if (validationError) { handleFail(validationError); return; }

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
      await signInWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      setSuccess('¡Acceso verificado! Redirigiendo…');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      handleFail(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (blocked || loading) return;
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
      setSuccess('¡Acceso verificado! Redirigiendo…');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      handleFail(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div
      className="app-shell flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: '#07070f', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Fondo: arco superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 190,
        background: 'linear-gradient(148deg, #1e1060 0%, #3d2aad 30%, #6b47e8 60%, #8a5cf7 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 190,
        background: 'linear-gradient(to bottom, transparent 55%, #07070f 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 1,
      }} />

      {/* Glow central */}
      <div className="absolute pointer-events-none" style={{
        top: '28%', left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,92,252,0.1) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Botón volver */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 52, left: 20, zIndex: 10,
          width: 40, height: 40, borderRadius: 13,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
        aria-label="Volver"
      >
        <ArrowLeft size={17} color="#fff" />
      </motion.button>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
        style={{
          zIndex: 10, alignSelf: 'center', marginTop: 44,
          width: 58, height: 58, borderRadius: 20,
          background: 'linear-gradient(148deg, #3d2aad 0%, #6b47e8 45%, #9d7ffe 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 28px rgba(124,92,252,0.55)', position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(148deg, rgba(255,255,255,0.2) 0%, transparent 55%)' }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 25, color: '#fff', position: 'relative' }}>F</span>
      </motion.div>

      {/* Formulario */}
      <motion.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeOut', duration: 0.5, delay: 0.25 }}
        style={{ zIndex: 10, padding: '22px 22px 0', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        onKeyDown={handleKeyDown}
      >
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 25,
          color: '#ededfc', margin: '0 0 5px', letterSpacing: -0.7,
        }}>
          Bienvenido de vuelta
        </h1>
        <p style={{ fontSize: 13.5, color: '#5e5e7a', margin: '0 0 24px', fontWeight: 400 }}>
          Ingresa a tu cuenta para continuar
        </p>

        {/* Banner de error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key={`error-${shakeKey}`}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`error-banner shake`}
              style={{ marginBottom: 16 }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="success-banner"
              style={{ marginBottom: 16 }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correo */}
        <div style={{ marginBottom: 12 }}>
          <InputField
            icon={Mail}
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={handleChange('email')}
            onFocus={setFocused}
            onBlur={setFocused}
            focused={focused}
            fieldKey="email"
            autoComplete="email"
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: 8 }}>
          <InputField
            icon={Lock}
            type={showPass ? 'text' : 'password'}
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange('password')}
            onFocus={setFocused}
            onBlur={setFocused}
            focused={focused}
            fieldKey="password"
            autoComplete="current-password"
            rightElement={
              <button
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#3a3a52' }}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
        </div>

        {/* Olvidé contraseña */}
        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <button
            onClick={() => navigate('/forgot')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontSize: 12.5, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', fontWeight: 600 }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Botón ingresar */}
        <motion.button
          whileTap={!loading && !blocked ? { scale: 0.96 } : {}}
          onClick={handleLogin}
          disabled={loading || blocked}
          style={{
            width: '100%', height: 54, borderRadius: 100,
            background: blocked
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #8b6dfd 0%, #5b4ee5 50%, #4338ca 100%)',
            border: 'none', color: blocked ? '#3a3a52' : '#fff',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 700, fontSize: 15.5, letterSpacing: -0.2,
            cursor: loading || blocked ? 'not-allowed' : 'pointer',
            position: 'relative', overflow: 'hidden',
            boxShadow: blocked ? 'none' : '0 4px 28px rgba(124,92,252,0.42), inset 0 1px 0 rgba(255,255,255,0.15)',
            marginBottom: 18, transition: 'all 0.3s',
          }}
        >
          {!blocked && !loading && <span style={{ position: 'absolute', inset: '0 0 50% 0', background: 'rgba(255,255,255,0.08)', borderRadius: '100px 100px 0 0' }} />}
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Verificando…
            </span>
          ) : blocked ? 'Espera 30 segundos…' : 'Ingresar a Finnix'}
        </motion.button>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11.5, color: '#3a3a52', fontFamily: "'DM Sans',sans-serif" }}>o continúa con</span>
        </div>

        {/* Social buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <SocialBtn onClick={handleGoogleAuth} disabled={loading || blocked}>
            <GoogleIcon /> Google
          </SocialBtn>
          <SocialBtn disabled={true}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.19 1.28-2.17 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.84M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span style={{ fontSize: 10, opacity: 0.5 }}>Próximamente</span>
          </SocialBtn>
        </div>

        {/* Link registro */}
        <p style={{ textAlign: 'center', fontSize: 13.5, color: '#5e5e7a', margin: '0 0 20px' }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontWeight: 700, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            Regístrate gratis
          </button>
        </p>
      </motion.div>
    </div>
  );
}