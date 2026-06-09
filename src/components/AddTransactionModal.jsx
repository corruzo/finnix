import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronDown, Loader2,
  UtensilsCrossed, Fuel, ShoppingBag, Smile,
  Briefcase, Gift, Wallet, TrendingUp,
  Home, Zap, Heart, Plane, Plus, Trash2, Edit3
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { createTransaction } from '../services/financeService';
import { cn } from '../lib/utils';
import { useBottomSheet, BACKDROP_VARIANTS, SHEET_VARIANTS } from '../hooks/useBottomSheet';

/* ─── Categorías predeterminadas ─────────────────────────── */
const CATS_DEFAULT = {
  egreso: [
    { id: 'comida',     label: 'Comida',           icon: UtensilsCrossed },
    { id: 'gasolina',   label: 'Gasolina',          icon: Fuel            },
    { id: 'snacks',     label: 'Snacks',            icon: Smile           },
    { id: 'personal',   label: 'Gastos personales', icon: ShoppingBag     },
    { id: 'hogar',      label: 'Hogar',             icon: Home            },
    { id: 'salud',      label: 'Salud',             icon: Heart           },
    { id: 'viajes',     label: 'Viajes',            icon: Plane           },
    { id: 'servicios',  label: 'Servicios',         icon: Zap             },
  ],
  ingreso: [
    { id: 'sueldo',     label: 'Sueldo',            icon: Briefcase       },
    { id: 'cesta',      label: 'Cesta Ticket',      icon: Gift            },
    { id: 'abono',      label: 'Abono',             icon: Wallet          },
    { id: 'extras',     label: 'Extras',            icon: TrendingUp      },
    { id: 'regalo',     label: 'Regalo',            icon: Gift            },
  ],
};


/* ─── Componente Principal ─────────────────────────────────── */
export default function AddTransactionModal({ onClose, initialType = 'egreso' }) {
  const { accounts, CURRENCIES } = useFinanceStore();
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  const { handleProps, sheetProps } = useBottomSheet(onClose);

  // Estado del formulario
  const [tipo,        setTipo]        = useState(initialType);
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria,   setCategoria]   = useState('');
  const [accountId,   setAccountId]   = useState(accounts[0]?.id || '');
  const [moneda,      setMoneda]      = useState('USD');
  const [loading,     setLoading]     = useState(false);

  // Categorías editables (en estado local por sesión; para persistencia futura → Firestore)
  const [categorias, setCategorias] = useState({ ...CATS_DEFAULT });
  const [editMode,   setEditMode]   = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');

  const montoRef = useRef(null);

  // Focus retardado solo en desktop para evitar redimensionamiento y jank de animación con el teclado nativo en móviles
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);
    if (isMobile) return;

    const timer = setTimeout(() => {
      if (montoRef.current) {
        montoRef.current.focus();
      }
    }, 500); // Dar tiempo a que el bottom sheet termine de subir
    return () => clearTimeout(timer);
  }, []);

  // Sincronizar moneda con la cuenta seleccionada para mantener consistencia monetaria
  useEffect(() => {
    const selectedAcc = accounts.find(acc => acc.id === accountId);
    if (selectedAcc) {
      setMoneda(selectedAcc.currency);
    }
  }, [accountId, accounts]);
  /* ── Cambiar tipo (Ingreso ↔ Egreso) ─── */
  const handleTipo = (val) => {
    setTipo(val);
    setCategoria('');
  };

  /* ── Agregar categoría ─── */
  const addCategoria = () => {
    const label = newCatLabel.trim();
    if (!label) return;
    const newCat = { id: label.toLowerCase().replace(/\s+/g, '_'), label, icon: ShoppingBag };
    setCategorias(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], newCat],
    }));
    setNewCatLabel('');
  };

  /* ── Eliminar categoría ─── */
  const deleteCategoria = (id) => {
    setCategorias(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter(c => c.id !== id),
    }));
    if (categoria === id) setCategoria('');
  };

  /* ── Guardar transacción ─── */
  const handleSubmit = async () => {
    if (!monto || !accountId) return;
    if (!user?.uid) {
      showNotification('Error', 'Debes iniciar sesión.', 'error');
      return;
    }
    setLoading(true);

    const catObj = categorias[tipo].find(c => c.id === categoria);
    const newTx = {
      type:        tipo,
      amount:      parseFloat(monto),
      description: descripcion.trim() || catObj?.label || 'Sin descripción',
      category:    catObj?.label || 'Otro',
      accountId,
      currency:    moneda,
    };
    
    // Creamos y disparamos la petición a Firebase sin bloquear (fire-and-forget)
    createTransaction(user.uid, newTx).catch(err => {
      console.error(err);
      showNotification('Error', 'No se pudo guardar la transacción', 'error');
    });

    showNotification('Transacción registrada', 'El balance ha sido actualizado', 'success');
    
    // Cierre inmediato
    setLoading(false);
    onClose();
  };

  const isIncome   = tipo === 'ingreso';
  const amountColor = isIncome ? 'text-positive' : 'text-[#f43f5e]';
  const simbolo    = CURRENCIES[moneda]?.symbol || '';
  const canSubmit  = !loading && !!monto && !!accountId;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={BACKDROP_VARIANTS} initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-[200]"
      />

      {/* Sheet */}
      <motion.div
        {...sheetProps}
        variants={SHEET_VARIANTS} initial="hidden" animate="visible" exit="exit"
        className="absolute bottom-0 left-0 w-full z-[200] flex flex-col"
        style={{ maxHeight: '94dvh' }}
      >
        {/* Contenedor principal */}
        <div className="bg-bg-elevated rounded-t-[32px] border-t border-x border-glass-border flex flex-col overflow-hidden"
          style={{ maxHeight: '94dvh' }}>

          {/* ── Drag Handle (área arrastradora) ─────────────── */}
          <div {...handleProps}>
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* ── Header con tabs deslizables ─────────────────── */}
          <div className="px-5 mb-4 flex justify-between items-center">
            {/* Tipo Selector (Egreso / Ingreso) */}
            <div className="flex bg-bg-card rounded-2xl p-1 gap-1">
              {(['egreso', 'ingreso']).map((t) => (
                <motion.button
                  key={t}
                  onClick={() => handleTipo(t)}
                  className={cn(
                    'relative px-5 py-2 rounded-xl font-jakarta font-bold text-[14px] transition-colors z-10',
                    tipo === t ? 'text-white' : 'text-text-secondary'
                  )}
                  whileTap={{ scale: 0.96 }}
                >
                  {tipo === t && (
                    <motion.div
                      layoutId="tab-indicator"
                      className={cn(
                        'absolute inset-0 rounded-xl',
                        t === 'egreso' ? 'bg-[#f43f5e]/20 border border-[#f43f5e]/30'
                                       : 'bg-positive/20 border border-positive/30'
                      )}
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'egreso' ? 'Egreso' : 'Ingreso'}
                  </span>
                </motion.button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-glass-bg flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body scrollable ─────────────────────────────── */}
          <div className="px-5 overflow-y-auto no-scrollbar flex-1 pb-6">

            {/* Monto (grande y centrado) */}
            <div className="flex flex-col items-center py-5 mb-6">
              <span className="font-dm text-[11px] text-text-secondary uppercase tracking-widest mb-3">
                {isIncome ? '¿Cuánto recibiste?' : '¿Cuánto gastaste?'}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn('font-jakarta font-bold text-[18px] opacity-50', amountColor)}>
                  {simbolo}
                </span>
                <input
                  ref={montoRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.,]*"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                    setMonto(val);
                  }}
                  className={cn(
                    'bg-transparent border-none outline-none font-jakarta font-bold text-[52px] tabular-nums text-center w-full',
                    monto ? amountColor : 'text-text-secondary'
                  )}
                  style={{ caretColor: isIncome ? 'var(--positive)' : '#f43f5e' }}
                />
              </div>
              {/* Indicador de tipo con pill */}
              <motion.div
                key={tipo}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'mt-2 px-3 py-1 rounded-full text-[12px] font-dm font-bold',
                  isIncome
                    ? 'bg-positive/15 text-positive'
                    : 'bg-[#f43f5e]/15 text-[#f43f5e]'
                )}
              >
                {isIncome ? '+ Ingreso' : '– Egreso'}
              </motion.div>
            </div>

            {/* Descripción */}
            <div className="mb-5">
              <input
                type="text"
                className="input-base"
                placeholder="Descripción (opcional)..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ paddingLeft: '16px' }}
              />
            </div>

            {/* Moneda y Cuenta */}
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <select
                  value={moneda}
                  disabled
                  className="input-base appearance-none bg-bg-card font-bold pr-10 opacity-65 cursor-not-allowed select-none"
                  style={{ paddingLeft: '14px' }}
                >
                  {Object.keys(CURRENCIES).map(c => (
                    <option key={c} value={c}>{CURRENCIES[c].symbol} {c}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/40 pointer-events-none" />
              </div>
              <div className="relative flex-[2]">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-base appearance-none bg-bg-card pr-10"
                  style={{ paddingLeft: '14px' }}
                >
                  {accounts.length === 0
                    ? <option value="">— Sin cuentas —</option>
                    : accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
                  }
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>
            {/* Leyenda explicativa de consistencia monetaria */}
            <div className="text-[11px] text-text-secondary/75 mb-6 px-1 flex items-center gap-1.5 leading-snug">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet shrink-0 animate-pulse" />
              La divisa coincide automáticamente con la cuenta seleccionada.
            </div>

            {/* Categorías */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="section-label">Categoría</span>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={cn(
                    'flex items-center gap-1 text-[12px] font-dm font-bold px-2 py-1 rounded-lg transition-colors',
                    editMode
                      ? 'text-accent-violet bg-accent-violet/10'
                      : 'text-text-secondary hover:text-white'
                  )}
                >
                  <Edit3 size={12} />
                  {editMode ? 'Listo' : 'Editar'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {categorias[tipo].map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = categoria === cat.id;
                    return (
                      <motion.div
                        key={cat.id}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="relative"
                      >
                        <button
                          onClick={() => !editMode && setCategoria(cat.id)}
                          className={cn(
                            'flex items-center gap-1.5 py-2 px-4 rounded-full font-dm text-[13px] font-medium transition-all duration-200 border',
                            isSelected && !editMode
                              ? isIncome
                                ? 'bg-positive/20 text-positive border-positive/40'
                                : 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/40'
                              : 'bg-bg-card text-text-secondary border-border',
                            editMode && 'opacity-70 cursor-default pr-8'
                          )}
                        >
                          <CatIcon size={13} />
                          {cat.label}
                        </button>
                        {editMode && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => deleteCategoria(cat.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#f43f5e] flex items-center justify-center"
                          >
                            <Trash2 size={9} color="white" />
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Agregar categoría */}
                {editMode ? (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="flex items-center gap-1.5 border border-dashed border-border rounded-full px-3 py-2"
                  >
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategoria()}
                      placeholder="Nueva..."
                      className="bg-transparent outline-none font-dm text-[13px] text-white w-20 placeholder:text-text-secondary"
                    />
                    <button onClick={addCategoria} className="text-accent-violet">
                      <Plus size={14} />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1 py-2 px-3 rounded-full border border-dashed border-border text-text-secondary hover:text-white transition-colors font-dm text-[13px]"
                  >
                    <Plus size={13} /> Agregar
                  </button>
                )}
              </div>
            </div>

            {/* Botón registrar */}
            <motion.button
              onClick={handleSubmit}
              disabled={!canSubmit}
              whileTap={{ scale: canSubmit ? 0.97 : 1 }}
              className={cn(
                'w-full h-[56px] rounded-2xl font-jakarta font-bold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300',
                canSubmit
                  ? isIncome
                    ? 'bg-positive text-bg shadow-[0_8px_24px_rgba(34,197,94,0.35)]'
                    : 'bg-[#f43f5e] text-white shadow-[0_8px_24px_rgba(244,63,94,0.35)]'
                  : 'bg-glass-bg text-text-secondary cursor-not-allowed'
              )}
            >
              {loading
                ? <Loader2 size={20} className="animate-spin" />
                : <Check size={20} strokeWidth={2.5} />
              }
              {loading ? 'Registrando...' : isIncome ? 'Registrar Ingreso' : 'Registrar Egreso'}
            </motion.button>

          </div>
        </div>
      </motion.div>
    </>
  );
}
