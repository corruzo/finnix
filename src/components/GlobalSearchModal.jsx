import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Info, SlidersHorizontal, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBottomSheet, BACKDROP_VARIANTS, SHEET_VARIANTS } from '../hooks/useBottomSheet';
import TransactionRow from './TransactionRow';

export default function GlobalSearchModal({ onClose }) {
  const { transactions, accounts } = useFinanceStore();
  const { handleProps, sheetProps } = useBottomSheet(onClose);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'ingreso' | 'egreso'
  
  const searchInputRef = useRef(null);

  // Autofocus con delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(tx => {
      // Filtrado por tipo (ingreso/egreso)
      if (filterType !== 'all' && tx.type !== filterType) return false;
      
      const q = query.toLowerCase().trim();
      if (!q) return true;

      // Buscar por descripción
      const descMatch = tx.description?.toLowerCase().includes(q);
      
      // Buscar por categoría
      const catMatch = tx.category?.toLowerCase().includes(q);
      
      // Buscar por nombre de cuenta
      const account = accounts.find(a => a.id === tx.accountId);
      const accMatch = account?.name?.toLowerCase().includes(q);
      
      // Buscar por monto (ej. si el usuario busca "150" o "150.00")
      const amtMatch = tx.amount?.toString().includes(q);
      
      return descMatch || catMatch || accMatch || amtMatch;
    });
  }, [transactions, query, filterType, accounts]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={BACKDROP_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        {...sheetProps}
        variants={SHEET_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute bottom-0 left-0 w-full bg-bg-elevated rounded-t-[32px] border-t border-x border-glass-border z-[200] flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Handle */}
        <div {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-border shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-jakarta font-bold text-xl text-white">Buscar Transacciones</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Input de Búsqueda */}
          <div className="relative group mb-3">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-violet transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por descripción, categoría, cuenta o monto..."
              className="w-full h-[52px] bg-white/5 border border-border rounded-2xl pl-12 pr-4 font-dm text-[15px] text-white outline-none focus:border-accent-violet transition-all placeholder:text-text-secondary"
            />
          </div>

          {/* Filtros rápidos (All / Ingreso / Egreso) */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'ingreso', label: 'Ingresos', icon: ArrowDownLeft, color: 'text-positive' },
              { id: 'egreso', label: 'Egresos', icon: ArrowUpRight, color: 'text-[#f43f5e]' }
            ].map(f => {
              const Icon = f.icon;
              const isSelected = filterType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`flex items-center gap-1.5 py-1.5 px-4 rounded-xl border text-[12px] font-dm font-bold transition-all ${
                    isSelected
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-transparent border-border text-text-secondary hover:text-white'
                  }`}
                >
                  {Icon && <Icon size={12} className={f.color} />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body (Resultados) */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col pb-safe">
          {filteredTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-text-secondary mb-4">
                <Search size={28} className="opacity-40" />
              </div>
              <p className="font-jakarta font-bold text-[16px] text-white mb-1">Sin resultados</p>
              <p className="font-dm text-[13px] text-text-secondary max-w-[240px] leading-relaxed">
                No encontramos transacciones que coincidan con tu búsqueda.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="section-label mb-2 block shrink-0">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'resultado' : 'resultados'}
              </span>
              <div className="flex flex-col gap-1 border border-border bg-bg-card rounded-[20px] p-2">
                {filteredTransactions.map((tx, i) => (
                  <TransactionRow key={tx.id} tx={tx} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
