import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowLeft,
  Check, AlertCircle, CheckCircle2, X,
} from 'lucide-react';
import { auth, googleProvider, isMockMode } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

/* ── Mapeo de errores Firebase Auth ─────────────────────── */
const AUTH_ERRORS = {
  'auth/email-already-in-use':   'Ya existe una cuenta registrada con este correo.',
  'auth/invalid-email':          'El formato del correo electrónico es inválido.',
  'auth/weak-password':          'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'auth/operation-not-allowed':  'El registro por correo no está habilitado.',
  'auth/network-request-failed': 'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.',
  'auth/popup-closed-by-user':   'El inicio de sesión fue cancelado.',
  'auth/popup-blocked':          'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes.',
  'auth/internal-error':         'Error interno del servidor. Inténtalo de nuevo.',
  'auth/too-many-requests':      'Demasiadas solicitudes. Espera unos minutos.',
};

function getAuthErrorMessage(code) {
  return AUTH_ERRORS[code] || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

/* ── Validación de contraseña ────────────────────────────── */
function getPasswordRules(password) {
  return [
    { label: 'Mínimo 8 caracteres',           met: password.length >= 8 },
    { label: 'Al menos una letra mayúscula',   met: /[A-Z]/.test(password) },
    { label: 'Al menos un número',             met: /[0-9]/.test(password) },
    { label: 'Al menos un símbolo (!@#$...)',  met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrength(rules) {
  return rules.filter(r => r.met).length;
}

const STRENGTH_CONFIG = [
  { color: '#f43f5e', label: 'Muy débil',  width: '25%' },
  { color: '#f97316', label: 'Débil',      width: '50%' },
  { color: '#f59e0b', label: 'Regular',    width: '75%' },
  { color: '#22c55e', label: 'Segura',     width: '100%' },
];

/* ── Campo de entrada ───────────────────────────────────── */
function InputField({ icon: Icon, type, placeholder, value, onChange, onFocus, onBlur, focused, fieldKey, rightElement, autoComplete, hasError }) {
  const isFocused = focused === fieldKey;
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        size={15}
        color={hasError ? '#f43f5e' : isFocused ? '#7c5cfc' : '#3a3a52'}
        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', zIndex: 1, pointerEvents: 'none' }}
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
          background: hasError ? 'rgba(244,63,94,0.05)' : isFocused ? 'rgba(124,92,252,0.06)' : '#13131e',
          border: `1px solid ${hasError ? 'rgba(244,63,94,0.4)' : isFocused ? 'rgba(124,92,252,0.55)' : 'rgba(255,255,255,0.065)'}`,
          color: '#ededfc', fontSize: 14.5,
          fontFamily: "'DM Sans', sans-serif",
          paddingLeft: 46,
          paddingRight: rightElement ? 48 : 16,
          outline: 'none',
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          boxShadow: hasError ? '0 0 0 3px rgba(244,63,94,0.08)' : isFocused ? '0 0 0 3px rgba(124,92,252,0.12)' : 'none',
        }}
      />
      {rightElement}
    </div>
  );
}

/* ── Google Icon SVG ───────────────────────────────────── */
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

/* ── SignUp Page ────────────────────────────────────────── */
export default function SignUpPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const { setUser } = useAuthStore();

  const passwordRules = getPasswordRules(form.password);
  const strength = getStrength(passwordRules);
  const strengthCfg = strength > 0 ? STRENGTH_CONFIG[strength - 1] : null;

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    if (error) setError('');
    if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: false }));
    if (field === 'password' && val) setShowRules(true);
    if (field === 'password' && !val) setShowRules(false);
  };

  const triggerShake = useCallback(() => setShakeKey(k => k + 1), []);

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = true;
    if (strength < 2) errors.password = true;
    if (form.password !== form.confirm) errors.confirm = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const msg = errors.name ? 'Ingresa tu nombre completo (mínimo 2 caracteres).'
        : errors.email ? 'El formato del correo electrónico es inválido.'
        : errors.password ? 'La contraseña no cumple con los requisitos mínimos de seguridad.'
        : 'Las contraseñas no coinciden.';
      return msg;
    }
    if (!agreed) return 'Debes aceptar los Términos de Uso para continuar.';
    return null;
  };

  const handleSignUp = async () => {
    if (loading) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      triggerShake();
      return;
    }

    setError('');
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        const mockUser = { uid: 'mock-local', email: form.email, displayName: form.name || 'Demo User' };
        localStorage.setItem('finnix_mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate('/dashboard');
        setLoading(false);
      }, 900);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      if (form.name.trim()) {
        await updateProfile(userCredential.user, { displayName: form.name.trim() });
      }
      setSuccess('¡Cuenta creada exitosamente! Redirigiendo…');
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading) return;
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
      setSuccess('¡Cuenta conectada! Redirigiendo…');
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: 'name', Icon: User, type: 'text', placeholder: 'Nombre completo',
      autoComplete: 'name',
    },
    {
      key: 'email', Icon: Mail, type: 'email', placeholder: 'correo@ejemplo.com',
      autoComplete: 'email',
    },
    {
      key: 'password', Icon: Lock,
      type: showPass ? 'text' : 'password',
      placeholder: 'Contraseña',
      autoComplete: 'new-password',
      rightEl: (
        <button
          onClick={() => setShowPass(v => !v)}
          tabIndex={-1}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#3a3a52' }}
          aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      ),
    },
    {
      key: 'confirm', Icon: Lock,
      type: showConfirm ? 'text' : 'password',
      placeholder: 'Confirmar contraseña',
      autoComplete: 'new-password',
      rightEl: (
        <button
          onClick={() => setShowConfirm(v => !v)}
          tabIndex={-1}
          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#3a3a52' }}
          aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
        >
          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      ),
    },
  ];

  const isReady = agreed && form.name.trim().length >= 2 && form.email && form.password.length >= 6 && form.password === form.confirm;

  return (
    <div
      className="app-shell flex flex-col relative overflow-hidden"
      style={{ height: '100dvh', background: '#07070f', fontFamily: "'DM Sans', sans-serif", overflowY: 'auto' }}
    >
      {/* Arco superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 170,
        background: 'linear-gradient(148deg, #1e1060 0%, #3d2aad 30%, #6b47e8 60%, #8a5cf7 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 170,
        background: 'linear-gradient(to bottom, transparent 50%, #07070f 100%)',
        borderRadius: '0 0 40px 40px', zIndex: 1,
      }} />

      {/* Glow */}
      <div className="absolute pointer-events-none" style={{
        top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,92,252,0.1) 0%, transparent 70%)',
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
        style={{ zIndex: 10, padding: '20px 22px 40px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
      >
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 25,
          color: '#ededfc', margin: '0 0 4px', letterSpacing: -0.7,
        }}>
          Crear cuenta
        </h1>
        <p style={{ fontSize: 13.5, color: '#5e5e7a', margin: '0 0 20px', fontWeight: 400 }}>
          Comienza a gestionar tu patrimonio hoy
        </p>

        {/* Banners */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key={`err-${shakeKey}`}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="error-banner shake"
              style={{ marginBottom: 14 }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="succ"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="success-banner"
              style={{ marginBottom: 14 }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campos */}
        {fields.map(({ key, Icon, type, placeholder, autoComplete, rightEl }, idx) => (
          <motion.div
            key={key}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + idx * 0.06 }}
            style={{ marginBottom: 10 }}
          >
            <InputField
              icon={Icon}
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={handleChange(key)}
              onFocus={setFocused}
              onBlur={setFocused}
              focused={focused}
              fieldKey={key}
              autoComplete={autoComplete}
              hasError={!!fieldErrors[key]}
              rightElement={rightEl}
            />
          </motion.div>
        ))}

        {/* Barra de seguridad de contraseña */}
        <AnimatePresence>
          {showRules && form.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 14, overflow: 'hidden' }}
            >
              {/* Barra visual */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100, marginBottom: 8, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: strengthCfg?.width || '0%' }}
                  transition={{ duration: 0.35 }}
                  style={{ height: '100%', background: strengthCfg?.color || 'transparent', borderRadius: 100 }}
                />
              </div>
              {strengthCfg && (
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: strengthCfg.color, marginBottom: 8, fontWeight: 600 }}>
                  Contraseña {strengthCfg.label}
                </p>
              )}
              {/* Checklist de reglas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {passwordRules.map(rule => (
                  <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {rule.met
                      ? <Check size={11} color="#22c55e" strokeWidth={3} />
                      : <X size={11} color="#3a3a52" strokeWidth={3} />
                    }
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: rule.met ? '#4ade80' : '#3a3a52', fontWeight: 500, transition: 'color 0.2s' }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkbox términos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 20 }}
        >
          <button
            onClick={() => setAgreed(v => !v)}
            style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
              background: agreed ? 'linear-gradient(135deg, #7c5cfc, #4f46e5)' : 'transparent',
              border: `1.5px solid ${agreed ? '#7c5cfc' : 'rgba(255,255,255,0.12)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            aria-label="Aceptar términos"
          >
            {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
          </button>
          <p style={{ fontSize: 12.5, color: '#5e5e7a', margin: 0, lineHeight: 1.55 }}>
            Acepto los{' '}
            <a href="/terms" style={{ color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>Términos de Uso</a>
            {' '}y la{' '}
            <a href="/privacy" style={{ color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>Política de Privacidad</a>
            {' '}de Finnix.
          </p>
        </motion.div>

        {/* Botón crear cuenta */}
        <motion.button
          whileTap={isReady && !loading ? { scale: 0.96 } : {}}
          onClick={handleSignUp}
          disabled={!agreed || loading}
          style={{
            width: '100%', height: 54, borderRadius: 100,
            background: isReady
              ? 'linear-gradient(135deg, #8b6dfd 0%, #5b4ee5 50%, #4338ca 100%)'
              : 'rgba(255,255,255,0.05)',
            border: 'none', color: isReady ? '#fff' : '#3a3a52',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 700, fontSize: 15.5, letterSpacing: -0.2,
            cursor: agreed && !loading ? 'pointer' : 'not-allowed',
            position: 'relative', overflow: 'hidden',
            boxShadow: isReady ? '0 4px 28px rgba(124,92,252,0.42), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
            transition: 'all 0.3s ease', marginBottom: 18,
          }}
        >
          {isReady && !loading && (
            <span style={{ position: 'absolute', inset: '0 0 50% 0', background: 'rgba(255,255,255,0.08)', borderRadius: '100px 100px 0 0' }} />
          )}
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Creando cuenta…
            </span>
          ) : 'Crear cuenta gratuita'}
        </motion.button>

        {/* Divider */}
        <div className="divider" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11.5, color: '#3a3a52' }}>o regístrate con</span>
        </div>

        {/* Social */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{
              flex: 1, height: 50, borderRadius: 13,
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#9090b0', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 600, fontSize: 13.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <GoogleIcon /> Google
          </motion.button>
          <motion.button
            disabled
            style={{
              flex: 1, height: 50, borderRadius: 13,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#3a3a52', cursor: 'not-allowed',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.19 1.28-2.17 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.84M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span style={{ fontSize: 10 }}>Próximamente</span>
          </motion.button>
        </div>

        {/* Link login */}
        <p style={{ textAlign: 'center', fontSize: 13.5, color: '#5e5e7a', margin: 0 }}>
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#7c5cfc', fontWeight: 700, fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
          >
            Inicia sesión
          </button>
        </p>
      </motion.div>
    </div>
  );
}