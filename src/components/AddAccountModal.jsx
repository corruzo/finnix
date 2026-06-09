import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Wallet as WalletIcon, Building2, CreditCard, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { SiTether, SiPaypal } from 'react-icons/si';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore }    from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { createAccount, updateAccountData } from '../services/financeService';
import { cn } from '../lib/utils';
import { useBottomSheet, BACKDROP_VARIANTS, SHEET_VARIANTS } from '../hooks/useBottomSheet';

const PRESETS = [
  { type: 'bank_ves', label: 'Banco',   icon: Building2,  currency: 'VES',  color: 'bg-icon-violet' },
  { type: 'cash_usd', label: 'Efectivo', icon: WalletIcon, currency: 'USD',  color: 'bg-icon-green'  },
  { type: 'binance',  label: 'Binance',  icon: SiTether,   currency: 'USDT', color: 'bg-icon-amber'  },
  { type: 'paypal',   label: 'PayPal',   icon: SiPaypal,   currency: 'USD',  color: 'bg-icon-blue'   },
  { type: 'card',     label: 'Tarjeta',  icon: CreditCard, currency: 'VES',  color: 'bg-icon-red'    },
];

const COLORS = ['bg-icon-violet', 'bg-icon-blue', 'bg-icon-green', 'bg-icon-amber', 'bg-icon-red'];

export default function AddAccountModal({ onClose, accountToEdit = null }) {
  const { CURRENCIES } = useFinanceStore();
  const { user }       = useAuthStore();
  const { showNotification } = useNotificationStore();
  const { handleProps, sheetProps } = useBottomSheet(onClose);

  const [selected,      setSelected]      = useState(() => accountToEdit ? PRESETS.find(p => p.type === accountToEdit.type) || PRESETS[0] : PRESETS[0]);
  const [nombre,        setNombre]        = useState(accountToEdit?.name || '');
  const [numeroCuenta,  setNumeroCuenta]  = useState(accountToEdit?.numeroCuenta || '');
  const [saldo,         setSaldo]         = useState(accountToEdit?.balance !== undefined ? String(accountToEdit.balance) : '');
  const [moneda,        setMoneda]        = useState(accountToEdit?.currency || PRESETS[0].currency);
  const [color,         setColor]         = useState(accountToEdit?.color || PRESETS[0].color);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  const handlePreset = (p) => {
    setSelected(p);
    setColor(p.color);
    setMoneda(p.currency);
    setNumeroCuenta('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) return setError('Ingresa un nombre para la cuenta.');
    if (!saldo || isNaN(saldo)) return setError('Ingresa un saldo inicial válido.');
    if (!user?.uid) return setError('Error de autenticación.');

    setLoading(true);

    if (accountToEdit) {
      updateAccountData(user.uid, accountToEdit.id, {
        name:         nombre.trim(),
        numeroCuenta: numeroCuenta.trim() || null,
        type:         selected.type,
        currency:     moneda,
        balance:      parseFloat(saldo),
        color,
      }).catch(err => {
        console.error(err);
        showNotification('Error', 'No se pudo actualizar la cuenta en la nube', 'error');
      });
      showNotification('Cuenta actualizada', 'Los datos se guardaron correctamente', 'success');
    } else {
      createAccount(user.uid, {
        name:         nombre.trim(),
        numeroCuenta: numeroCuenta.trim() || null,
        type:         selected.type,
        currency:     moneda,
        balance:      parseFloat(saldo),
        color,
        icon:         '💼',
      }).catch(err => {
        console.error(err);
        showNotification('Error', 'No se pudo guardar la cuenta en la nube', 'error');
      });
      showNotification('Cuenta creada', 'La nueva cuenta ya está lista', 'success');
    }
    
    // Cierre inmediato, Firebase sincroniza en background
    setLoading(false);
    onClose();
  };

  const simbolo = CURRENCIES[moneda]?.symbol || '';

  return (
    <>
      <motion.div
        variants={BACKDROP_VARIANTS} initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />

      <motion.div
        {...sheetProps}
        variants={SHEET_VARIANTS} initial="hidden" animate="visible" exit="exit"
        className="absolute bottom-0 left-0 w-full bg-bg-elevated rounded-t-[32px] border border-glass-border border-b-0 z-[200] flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Handle arrastrarable */}
        <div {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="flex justify-between items-center px-5 mb-4">
          <h2 className="font-jakarta font-bold text-[18px]">
            {accountToEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-glass-bg text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 overflow-y-auto no-scrollbar flex-1 pb-safe">
          
          {/* Tipo de cuenta */}
          <div className="mb-6">
            <label className="section-label block mb-3">Tipo de Cuenta</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {PRESETS.map((p, i) => {
                const isSelected = selected.type === p.type;
                const PIcon = p.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className={cn(
                      "py-2 px-4 rounded-full font-dm text-[13px] font-medium transition-all duration-200 border flex items-center shrink-0",
                      isSelected
                        ? "bg-accent-violet text-white border-transparent"
                        : "bg-bg-card text-text-secondary border-border hover:bg-glass-bg"
                    )}
                  >
                    <PIcon size={14} className="mr-1.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6">
            
            {/* Moneda y Saldo Inicial */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="section-label block mb-2">Moneda</label>
                <div className="relative">
                  <select
                    value={moneda}
                    onChange={e => setMoneda(e.target.value)}
                    className="input-base appearance-none bg-bg-card font-bold"
                    style={{ paddingLeft: '16px' }}
                  >
                    {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
              </div>
              <div className="flex-[2]">
                <label className="section-label block mb-2">Saldo Inicial</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-jakarta font-bold text-text-secondary">{simbolo}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    className="input-base font-jakarta font-bold tabular-nums"
                    style={{ paddingLeft: '32px' }}
                    value={saldo}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setSaldo(val);
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Nombre y Número */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="section-label block mb-2">Nombre de la Cuenta</label>
                <input
                  type="text"
                  className="input-base"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Banco Mercantil, Efectivo..."
                  required
                />
              </div>

              <div>
                <label className="section-label block mb-2">Número o Referencia <span className="font-normal text-[10px] lowercase">(Opcional)</span></label>
                <input
                  type="text"
                  className="input-base font-mono text-[14px]"
                  value={numeroCuenta}
                  onChange={e => setNumeroCuenta(e.target.value)}
                  placeholder={
                    selected.type === 'bank_ves' ? '0105-0000...' :
                    selected.type === 'card'     ? 'Últimos 4 dígitos' :
                    'Opcional'
                  }
                  maxLength={30}
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="section-label block mb-2">Color identificador</label>
              <div className="flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all duration-200",
                      c,
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-elevated scale-110' : 'opacity-50 hover:opacity-100'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Error Limpio */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-negative bg-negative/10 border border-negative/20 p-3 rounded-xl mt-1">
                    <AlertCircle size={16} />
                    <span className="font-dm text-[13px] font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
