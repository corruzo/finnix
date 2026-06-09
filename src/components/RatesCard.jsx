import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { RefreshCw, Calculator } from 'lucide-react';
import { refreshRatesIfStale } from '../services/ratesService';
import { useState } from 'react';
import CalculatorModal from './CalculatorModal';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserPreference } from '../services/financeService';

export default function RatesCard() {
  const { rates, preferredRate, setPreferredRate } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const showNotification = useNotificationStore(state => state.showNotification);
  const { user } = useAuthStore();

  const tasas = [
    {
      key: 'bcv_usd',
      label: 'Dólar BCV',
      value: rates.bcv_usd,
      prefix: 'Bs.',
      color: 'var(--accent-violet)',
    },
    {
      key: 'bcv_eur',
      label: 'Euro BCV',
      value: rates.bcv_eur,
      prefix: 'Bs.',
      color: 'var(--accent-blue)',
    },
    {
      key: 'binance_usdt',
      label: 'Binance',
      value: rates.binance_usdt,
      prefix: 'Bs.',
      color: 'var(--positive)',
    },
  ];

  const horaActualizada = rates.lastUpdated
    ? `${new Date(rates.lastUpdated).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  const handleRefresh = () => {
    setRefreshing(true);
    refreshRatesIfStale()
      .then(() => showNotification('Tasas actualizadas', 'Los valores de cambio están al día', 'success'))
      .catch((e) => {
        console.warn('[Finnix] Error al refrescar tasas:', e);
        showNotification('Error al actualizar', 'No se pudieron obtener las últimas tasas', 'error');
      })
      .finally(() => setRefreshing(false));
  };

  const handleSelectRate = async (key) => {
    setPreferredRate(key);
    if (user?.uid) {
      try {
        await updateUserPreference(user.uid, { preferredRate: key });
      } catch (err) {
        console.error('Error guardando preferencia:', err);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="section-label">Tasas de Cambio</h3>
        <div className="flex items-center gap-3">
          {horaActualizada && (
            <span className="font-dm text-[11px] text-text-secondary">
              {horaActualizada}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-7 h-7 flex items-center justify-center rounded-full text-text-secondary hover:text-white transition-colors disabled:opacity-40"
            aria-label="Refrescar tasas"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
        {tasas.map((item, i) => {
          const isSelected = preferredRate === item.key;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelectRate(item.key)}
              className={`min-w-[120px] p-4 card-base flex flex-col gap-1.5 cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'ring-1 ring-accent-violet bg-accent-violet/5 shadow-[0_0_15px_rgba(124,92,252,0.15)]' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className={`font-dm text-[12px] font-medium transition-colors ${isSelected ? 'text-accent-violet' : 'text-text-secondary'}`}>
                  {item.label}
                </div>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
                )}
              </div>
              
              {item.value !== null ? (
                <div className="font-jakarta font-bold text-[18px] tabular-nums">
                  <span className="text-text-secondary text-[14px] mr-0.5">{item.prefix}</span>
                  {item.value.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              ) : (
                <div className="h-[27px] flex items-center">
                  <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                </div>
              )}
              <div
                className="h-[3px] w-full rounded-full mt-1 opacity-40 transition-all"
                style={{ 
                  background: item.color,
                  opacity: isSelected ? 1 : 0.4
                }}
              />
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={() => setShowCalculator(true)}
        className="w-full mt-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-text-secondary hover:text-white hover:bg-white/10 transition-colors font-jakarta font-bold text-[14px]"
      >
        <Calculator size={16} className="text-accent-violet" />
        Calculadora Rápida
      </button>

      <AnimatePresence>
        {showCalculator && (
          <CalculatorModal onClose={() => setShowCalculator(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
