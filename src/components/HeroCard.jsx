import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Search, Bell, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useFinanceStore } from '../store/useFinanceStore';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ACTION_PILLS = [
  { icon: ArrowDownLeft, label: 'Ingreso', type: 'ingreso' },
  { icon: ArrowUpRight,  label: 'Egreso',  type: 'egreso' },
];

export default function HeroCard({ onOpenTx }) {
  const { getTotalUSD, balanceVisible, toggleBalance } = useFinanceStore();
  const { user } = useAuthStore();
  const balance = getTotalUSD();
  const [displayBalance, setDisplayBalance] = useState('0.00');

  // Animación de contador numérico
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 400, damping: 30 });

  useEffect(() => {
    const animation = animate(count, balance, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayBalance(formatCurrency(latest, 'USD').replace('$', ''));
      }
    });
    return animation.stop;
  }, [balance, count]);

  const nombreUsuario = user?.displayName?.split(' ')[0] || 'Usuario';

  return (
    <div className="header-arc pt-safe pb-8 px-5">
      {/* Barra superior */}
      <div className="flex justify-between items-center mt-4 mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <div>
            <span className="font-dm text-white/60 text-[11px] block">Bienvenido,</span>
            <span className="font-jakarta font-bold text-white text-[13px] tracking-tight leading-none">{nombreUsuario}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="text-white/80 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          <button className="text-white/80 hover:text-white transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Área de saldo */}
      <div className="flex flex-col items-center text-center relative z-10 mb-8">
        <span className="font-dm text-[12px] text-white/60 mb-2">Patrimonio Total</span>
        <div className="flex items-center gap-3">
          <div className="font-jakarta font-bold text-4xl text-white tabular-nums tracking-tight drop-shadow-md">
            ${balanceVisible ? displayBalance : '••••••'}
          </div>
          <button
            onClick={toggleBalance}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            {balanceVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <span className="font-dm text-[11px] text-white/40 mt-1">en USD equivalente</span>
      </div>

      {/* Acciones rápidas */}
      <div className="flex justify-center gap-4 relative z-10">
        {ACTION_PILLS.map((action, i) => (
          <button key={i} onClick={onOpenTx} className="action-pill group">
            <motion.div
              className="action-pill-icon"
              whileTap={{ scale: 0.92 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <action.icon size={22} strokeWidth={2} />
            </motion.div>
            <span className="action-pill-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
