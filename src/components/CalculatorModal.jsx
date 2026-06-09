import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator, ArrowRightLeft } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useBottomSheet, BACKDROP_VARIANTS, SHEET_VARIANTS } from '../hooks/useBottomSheet';

export default function CalculatorModal({ onClose }) {
  const { rates } = useFinanceStore();
  const { handleProps, sheetProps } = useBottomSheet(onClose);
  
  const availableRates = useMemo(() => [
    { id: 'bcv_usd', label: 'Dólar BCV', value: rates.bcv_usd, currency: 'USD', symbol: '$' },
    { id: 'binance', label: 'Binance', value: rates.binance_usdt, currency: 'USDT', symbol: '₮' },
    { id: 'bcv_eur', label: 'Euro BCV', value: rates.bcv_eur, currency: 'EUR', symbol: '€' }
  ].filter(r => r.value !== null), [rates]);

  const [selectedRateId, setSelectedRateId] = useState(availableRates.length > 0 ? availableRates[0].id : null);
  const [baseAmount, setBaseAmount] = useState('');
  const [vesAmount, setVesAmount] = useState('');
  const [lastEdited, setLastEdited] = useState('base');
  const [swapped, setSwapped] = useState(false); // Controls which input is on top

  const selectedRate = availableRates.find(r => r.id === selectedRateId);

  useEffect(() => {
    if (!selectedRate) return;
    
    if (lastEdited === 'base' && baseAmount !== '') {
      const parsedBase = parseFloat(baseAmount.replace(/,/g, ''));
      if (!isNaN(parsedBase)) {
        setVesAmount((parsedBase * selectedRate.value).toFixed(2));
      } else {
        setVesAmount('');
      }
    } else if (lastEdited === 'ves' && vesAmount !== '') {
      const parsedVes = parseFloat(vesAmount.replace(/,/g, ''));
      if (!isNaN(parsedVes)) {
        setBaseAmount((parsedVes / selectedRate.value).toFixed(2));
      } else {
        setBaseAmount('');
      }
    }
  }, [baseAmount, vesAmount, lastEdited, selectedRate]);

  const handleBaseChange = (e) => {
    // Solo permitir números y un punto o coma
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    setLastEdited('base');
    setBaseAmount(val);
    if (val === '') setVesAmount('');
  };

  const handleVesChange = (e) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    setLastEdited('ves');
    setVesAmount(val);
    if (val === '') setBaseAmount('');
  };

  const handleSwap = () => {
    // Haptic feedback en Android/algunos dispositivos al presionar el botón
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSwapped(!swapped);
  };

  // Definir los dos bloques de input para poder renderizarlos en orden condicional
  const baseInput = selectedRate && (
    <div className="relative group" key="base-input">
      <label className="absolute left-4 top-1/2 -translate-y-1/2 font-jakarta font-bold text-text-secondary group-focus-within:text-accent-violet transition-colors">
        {selectedRate.symbol}
      </label>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9.,]*"
        value={baseAmount}
        onChange={handleBaseChange}
        placeholder={`Monto en ${selectedRate.currency}`}
        className="w-full h-[56px] bg-white/5 border border-border rounded-xl pl-10 pr-16 font-dm text-[18px] text-white outline-none focus:border-accent-violet transition-colors tabular-nums"
        style={{ WebkitAppearance: 'none' }}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-dm text-[13px] text-text-secondary font-bold">
        {selectedRate.currency}
      </span>
    </div>
  );

  const vesInput = selectedRate && (
    <div className="relative group" key="ves-input">
      <label className="absolute left-4 top-1/2 -translate-y-1/2 font-jakarta font-bold text-text-secondary group-focus-within:text-accent-violet transition-colors">
        Bs.
      </label>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9.,]*"
        value={vesAmount}
        onChange={handleVesChange}
        placeholder="Monto en Bolívares"
        className="w-full h-[56px] bg-white/5 border border-border rounded-xl pl-12 pr-16 font-dm text-[18px] text-white outline-none focus:border-accent-violet transition-colors tabular-nums"
        style={{ WebkitAppearance: 'none' }}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-dm text-[13px] text-text-secondary font-bold">
        VES
      </span>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <motion.div
        variants={BACKDROP_VARIANTS} initial="hidden" animate="visible" exit="hidden"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        {...sheetProps}
        variants={SHEET_VARIANTS} initial="hidden" animate="visible" exit="exit"
        className="absolute bottom-0 left-0 w-full bg-bg-elevated rounded-t-[32px] border-t border-x border-glass-border z-[200] flex flex-col"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Handle */}
        <div {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-violet/10 flex items-center justify-center text-accent-violet">
              <Calculator size={20} />
            </div>
            <h2 className="font-jakarta font-bold text-xl text-white">
              Calculadora
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-safe">
          {availableRates.length === 0 ? (
            <div className="text-center text-text-secondary py-4 font-dm text-sm">
              No hay tasas disponibles para calcular.
            </div>
          ) : (
            <>
              {/* Tasa Selector */}
              <div>
                <label className="block font-dm text-[13px] text-text-secondary mb-2">Tasa de conversión</label>
                <div className="flex bg-white/5 rounded-xl p-1 relative">
                  {availableRates.map(rate => (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`flex-1 py-2 font-dm text-[13px] font-bold rounded-lg transition-colors relative z-10 ${
                        selectedRateId === rate.id ? 'text-white' : 'text-text-secondary hover:text-white/80'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                  <div
                    className="absolute top-1 bottom-1 bg-accent-violet rounded-lg transition-all duration-300"
                    style={{
                      width: `${100 / availableRates.length}%`,
                      left: `${(availableRates.findIndex(r => r.id === selectedRateId) * 100) / availableRates.length}%`
                    }}
                  />
                </div>
                
                {selectedRate && (
                  <div className="mt-3 text-center">
                    <span className="font-jakarta font-bold text-[24px] tabular-nums text-white">
                      Bs. {selectedRate.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Inputs */}
              {selectedRate && (
                <div className="flex flex-col gap-3 relative mt-2">
                  <AnimatePresence initial={false}>
                    {swapped ? [vesInput, baseInput] : [baseInput, vesInput]}
                  </AnimatePresence>

                  {/* Botón de Intercambio (Swap) */}
                  <button 
                    onClick={handleSwap}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-bg-card flex items-center justify-center z-10 border-4 border-[#1c1c1e] text-text-secondary hover:text-accent-violet hover:bg-white/5 transition-all active:scale-90"
                    aria-label="Invertir monedas"
                  >
                    <ArrowRightLeft size={16} className="rotate-90" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
