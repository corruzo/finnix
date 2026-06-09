import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Edit3, Check, X, Lock, Mail,
  ChevronRight, Eye, EyeOff, AlertCircle, Loader2,
  Shield, UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { auth } from '../../services/firebase';
import {
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { cn } from '../../lib/utils';

/* ─── Small helper: labeled input field ─── */
function SettingsInput({ label, icon: Icon, value, onChange, type = 'text', placeholder, disabled, rightElement }) {
  return (
    <div>
      <label className="block font-dm text-[11px] text-text-secondary uppercase tracking-widest mb-2 px-1">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-violet transition-colors pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-[52px] bg-bg-card border border-glass-border rounded-2xl font-dm text-[15px] text-white outline-none transition-all',
            Icon ? 'pl-11 pr-4' : 'pl-4 pr-4',
            rightElement && 'pr-12',
            'focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,92,252,0.15)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Error banner ─── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-2.5 p-3.5 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-xl mt-1">
        <AlertCircle size={15} className="text-[#f43f5e] shrink-0 mt-0.5" />
        <p className="font-dm text-[12.5px] text-[#f43f5e] leading-snug">{message}</p>
      </div>
    </motion.div>
  );
}

/* ─── Save button ─── */
function SaveButton({ loading, onClick, label = 'Guardar cambios', disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'w-full h-[52px] rounded-2xl font-jakarta font-bold text-[15px] flex items-center justify-center gap-2 transition-all',
        loading || disabled
          ? 'bg-glass-bg text-text-secondary cursor-not-allowed'
          : 'bg-gradient-to-r from-accent-violet to-accent-indigo text-white shadow-[0_4px_20px_rgba(124,92,252,0.35)] hover:brightness-110'
      )}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
      {loading ? 'Guardando...' : label}
    </motion.button>
  );
}

/* ─── Main Component ─── */
export default function VistaAjustes() {
  const { user, setUser, clearAuth } = useAuthStore();
  const { showNotification } = useNotificationStore();

  // ── Section visibility
  const [activeSection, setActiveSection] = useState(null); // 'profile' | 'password' | null

  // ── Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail]             = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]     = useState('');

  // ── Password form state
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdError,   setPwdError]     = useState('');

  /* ── LOGOUT ── */
  const handleLogout = async () => {
    try { await signOut(auth); } catch { clearAuth(); }
  };

  /* ── SAVE PROFILE (name + email) ── */
  const handleSaveProfile = async () => {
    setProfileError('');
    const trimName  = displayName.trim();
    const trimEmail = email.trim();

    if (!trimName) { setProfileError('El nombre no puede estar vacío.'); return; }
    if (!trimEmail || !/\S+@\S+\.\S+/.test(trimEmail)) {
      setProfileError('Ingresa un correo electrónico válido.');
      return;
    }

    setProfileLoading(true);
    try {
      // Update display name
      if (trimName !== user?.displayName) {
        await updateProfile(auth.currentUser, { displayName: trimName });
      }
      // Update email (may require recent login)
      if (trimEmail !== user?.email) {
        await updateEmail(auth.currentUser, trimEmail);
      }
      // Refresh auth store
      setUser({ ...auth.currentUser });
      showNotification('Perfil actualizado', 'Tus datos se guardaron correctamente.', 'success');
      setActiveSection(null);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setProfileError('Por seguridad, debes cerrar sesión e iniciar de nuevo antes de cambiar el correo.');
      } else if (err.code === 'auth/email-already-in-use') {
        setProfileError('Ese correo ya está registrado en otra cuenta.');
      } else if (err.code === 'auth/invalid-email') {
        setProfileError('El formato del correo no es válido.');
      } else {
        setProfileError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  /* ── CHANGE PASSWORD ── */
  const handleChangePassword = async () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Ingresa tu contraseña actual.'); return; }
    if (newPwd.length < 6) { setPwdError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Las contraseñas no coinciden.'); return; }
    if (newPwd === currentPwd) { setPwdError('La nueva contraseña debe ser diferente a la actual.'); return; }

    setPwdLoading(true);
    try {
      // Reauthenticate first for security-sensitive operation
      const credential = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);

      showNotification('Contraseña actualizada', 'Tu contraseña fue cambiada exitosamente.', 'success');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setActiveSection(null);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwdError('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/weak-password') {
        setPwdError('La nueva contraseña es muy débil. Usa al menos 6 caracteres.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPwdError('Por seguridad, cierra sesión e inicia de nuevo antes de cambiar la contraseña.');
      } else {
        setPwdError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  /* ── Toggle section (accordion) ── */
  const toggleSection = (section) => {
    setProfileError('');
    setPwdError('');
    setActiveSection(prev => prev === section ? null : section);
  };

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="px-5 pt-safe mt-6 pb-8 flex flex-col">
      <h1 className="font-jakarta font-bold text-[28px] tracking-tight mb-8">Ajustes</h1>

      {/* ── Avatar + Name ── */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#4f46e5] flex items-center justify-center mb-4 font-jakarta font-bold text-[26px] text-white select-none"
          style={{ boxShadow: '0 0 28px rgba(124,92,252,0.45)' }}
        >
          {initials}
        </div>
        <h2 className="font-jakarta font-bold text-[20px] text-white leading-tight">
          {user?.displayName || 'Usuario'}
        </h2>
        <p className="font-dm text-[13px] text-text-secondary mt-1">{user?.email}</p>
      </div>

      {/* ── Settings Sections ── */}
      <div className="flex flex-col gap-3 mb-6">

        {/* ── PROFILE SECTION ── */}
        <div className="bg-bg-card border border-glass-border rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('profile')}
            className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet shrink-0">
              <UserCircle size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-jakarta font-bold text-[14px] text-white">Información de Perfil</p>
              <p className="font-dm text-[12px] text-text-secondary">Nombre y correo electrónico</p>
            </div>
            <motion.div
              animate={{ rotate: activeSection === 'profile' ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={18} className="text-text-secondary" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {activeSection === 'profile' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-4 border-t border-border">
                  <SettingsInput
                    label="Nombre completo"
                    icon={User}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                  <SettingsInput
                    label="Correo electrónico"
                    icon={Mail}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="correo@ejemplo.com"
                  />
                  <AnimatePresence>
                    <ErrorBanner message={profileError} />
                  </AnimatePresence>
                  <SaveButton
                    loading={profileLoading}
                    onClick={handleSaveProfile}
                    disabled={displayName.trim() === user?.displayName && email.trim() === user?.email}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PASSWORD SECTION ── */}
        <div className="bg-bg-card border border-glass-border rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('password')}
            className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] shrink-0">
              <Shield size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-jakarta font-bold text-[14px] text-white">Seguridad</p>
              <p className="font-dm text-[12px] text-text-secondary">Cambiar contraseña</p>
            </div>
            <motion.div
              animate={{ rotate: activeSection === 'password' ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={18} className="text-text-secondary" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {activeSection === 'password' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-4 border-t border-border">
                  <SettingsInput
                    label="Contraseña actual"
                    icon={Lock}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="••••••••"
                    rightElement={
                      <button onClick={() => setShowCurrent(v => !v)} className="text-text-secondary hover:text-white transition-colors p-1">
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <SettingsInput
                    label="Nueva contraseña"
                    icon={Lock}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    type={showNew ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    rightElement={
                      <button onClick={() => setShowNew(v => !v)} className="text-text-secondary hover:text-white transition-colors p-1">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <SettingsInput
                    label="Confirmar nueva contraseña"
                    icon={Lock}
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    rightElement={
                      <button onClick={() => setShowConfirm(v => !v)} className="text-text-secondary hover:text-white transition-colors p-1">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {/* Password strength indicator */}
                  {newPwd.length > 0 && (
                    <div className="px-1">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(lvl => {
                          const strength =
                            newPwd.length >= 12 && /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) && /[^a-zA-Z0-9]/.test(newPwd) ? 4
                            : newPwd.length >= 8 && /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) ? 3
                            : newPwd.length >= 6 ? 2
                            : 1;
                          return (
                            <div
                              key={lvl}
                              className={cn(
                                'h-1 flex-1 rounded-full transition-all duration-300',
                                lvl <= strength
                                  ? strength <= 1 ? 'bg-[#f43f5e]'
                                    : strength <= 2 ? 'bg-[#f59e0b]'
                                    : strength <= 3 ? 'bg-[#22c55e]'
                                    : 'bg-accent-violet'
                                  : 'bg-border'
                              )}
                            />
                          );
                        })}
                      </div>
                      <p className="font-dm text-[11px] text-text-secondary">
                        {newPwd.length < 6 ? 'Muy corta' :
                          newPwd.length >= 12 && /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) ? 'Muy segura' :
                          newPwd.length >= 8 && /[0-9]/.test(newPwd) ? 'Buena' : 'Aceptable'}
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    <ErrorBanner message={pwdError} />
                  </AnimatePresence>
                  <SaveButton
                    loading={pwdLoading}
                    onClick={handleChangePassword}
                    label="Cambiar contraseña"
                    disabled={!currentPwd || !newPwd || !confirmPwd}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Logout ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="w-full h-[52px] rounded-2xl font-jakarta font-bold text-[15px] flex items-center justify-center gap-2.5 bg-[#f43f5e]/8 border border-[#f43f5e]/20 text-[#f43f5e] hover:bg-[#f43f5e]/15 transition-colors cursor-pointer mt-auto"
      >
        <LogOut size={18} />
        Cerrar Sesión
      </motion.button>
    </div>
  );
}
