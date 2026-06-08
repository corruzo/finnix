import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, ChevronDown, Check, 
  ShoppingCart, Car, Pill, GraduationCap, Film, Shirt, 
  Lightbulb, Home, Laptop, Briefcase, Monitor, BarChart, 
  TrendingUp, Gift, ArrowLeftRight, Paperclip 
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import NumberPad from './NumberPad';
import TabSwitcher from './TabSwitcher';
import { cn } from '../lib/utils';

// ── Categorías en español ────────────────────────────────────
const CATEGORIAS = {
  egreso:  ['Alimentación', 'Transporte', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Hogar', 'Tecnología', 'Otro'],
  ingreso: ['Sueldo', 'Freelance', 'Negocio', 'Inversión', 'Regalo', 'Transferencia', 'Otro'],
};

const ICONOS = {
  'Alimentación':  ShoppingCart,
  'Transporte':    Car,
  'Salud':         Pill,
  'Educación':     GraduationCap,
  'Entretenimiento':Film,
  'Ropa':          Shirt,
  'Servicios':     Lightbulb,
  'Hogar':         Home,
  'Tecnología':    Laptop,
  'Sueldo':        Briefcase,
  'Freelance':     Monitor,
  'Negocio':       BarChart,
  'Inversión':     TrendingUp,
  'Regalo':        Gift,
  'Transferencia': ArrowLeftRight,
  'Otro':          Paperclip,
};

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const sheetVariants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 400, damping: 38 } },
  exit:    { y: '100%', transition: { duration: 0.22 } },
};

export default function AddTransactionModal({ onClose }) {
  const { accounts, CURRENCIES, addTransaction } = useFinanceStore();
  const [tipo,        setTipo]        = useState('egreso');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria,   setCategoria]   = useState('');
  const [accountId,   setAccountId]   = useState(accounts[0]?.id || '');
  const [moneda,      setMoneda]      = useState('USD');

  const handleSubmit = () => {
    if (!monto || !descripcion || !accountId) return;
    addTransaction({
      type:       tipo,        // 'ingreso' | 'egreso'
      amount:     parseFloat(monto),
      description: descripcion,
      category:   categoria || 'Otro',
      accountId,
      currency:   moneda,
    });
    onClose();
  };

  const simboloMoneda = CURRENCIES[moneda]?.symbol || '';

  return (
    <>
      <motion.div
        variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />

      <motion.div
        variants={sheetVariants} initial="hidden" animate="visible" exit="exit"
        className="absolute bottom-0 left-0 w-full bg-bg-elevated rounded-t-[32px] border border-glass-border border-b-0 z-[200] flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 rounded-full bg-border mx-auto mt-3 mb-2" />

        <div className="flex justify-between items-center px-5 mb-4">
          <h2 className="font-jakarta font-bold text-[18px]">Nuevo Movimiento</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-glass-bg text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 overflow-y-auto no-scrollbar flex-1 pb-safe">

          {/* Selector de tipo */}
          <TabSwitcher
            tabs={[{ id: 'egreso', label: 'Egreso' }, { id: 'ingreso', label: 'Ingreso' }]}
            active={tipo}
            onChange={(val) => { setTipo(val); setCategoria(''); }}
            className="mb-6"
          />

          {/* Monto */}
          <div className="flex flex-col items-center justify-center py-6 mb-6">
            <div className="text-text-secondary font-dm text-[13px] mb-2 uppercase tracking-widest">Monto</div>
            <div className={cn(
              "font-jakarta font-bold text-[40px] tabular-nums tracking-tight transition-colors",
              monto ? (tipo === 'ingreso' ? 'text-positive' : 'text-text-primary') : 'text-text-secondary'
            )}>
              {simboloMoneda}{monto || '0.00'}
            </div>
          </div>

          {/* Moneda y Cuenta */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <select
                value={moneda}
                onChange={e => setMoneda(e.target.value)}
                className="input-base appearance-none bg-bg-card font-bold"
              >
                {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
            <div className="relative flex-[2]">
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="input-base appearance-none bg-bg-card"
                style={{ paddingLeft: '16px' }}
              >
                {accounts.length === 0
                  ? <option value="">— Sin cuentas —</option>
                  : accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
                }
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="section-label block mb-3">Descripción</label>
            <input
              type="text"
              className="input-base"
              placeholder="Ej: Supermercado, Pago freelance..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              style={{ paddingLeft: '16px' }}
            />
          </div>

          {/* Categoría */}
          <div className="mb-8">
            <label className="section-label block mb-3">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS[tipo].map(cat => {
                const CatIcon = ICONOS[cat] || Paperclip;
                return (
                <button
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={cn(
                    "py-2 px-4 rounded-full font-dm text-[13px] font-medium transition-all duration-200 border flex items-center",
                    categoria === cat
                      ? "bg-accent-violet text-white border-transparent"
                      : "bg-bg-card text-text-secondary border-border hover:bg-glass-bg"
                  )}
                >
                  <CatIcon size={14} className="mr-1.5" />{cat}
                </button>
                );
              })}
            </div>
          </div>

          {/* Teclado numérico y botón */}
          <div className="pb-4">
            <NumberPad value={monto} onChange={setMonto} />
            <button
              className="btn-primary mt-6"
              onClick={handleSubmit}
              disabled={!monto || !descripcion || !accountId}
              style={{ opacity: (!monto || !descripcion || !accountId) ? 0.5 : 1 }}
            >
              <Check size={20} /> Registrar
            </button>
          </div>

        </div>
      </motion.div>
    </>
  );
}
