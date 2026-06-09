import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Search, Bell, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

const ACTION_PILLS = [
  {
    icon: ArrowDownLeft,
    label: 'Ingreso',
    type: 'ingreso',
    accent: 'rgba(34,197,94,0.22)',
    border: 'rgba(34,197,94,0.35)',
    glow: 'rgba(34,197,94,0.3)',
  },
  {
    icon: ArrowUpRight,
    label: 'Egreso',
    type: 'egreso',
    accent: 'rgba(244,63,94,0.22)',
    border: 'rgba(244,63,94,0.35)',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: RefreshCw,
    label: 'Transferir',
    type: 'transferencia',
    accent: 'rgba(124,92,252,0.22)',
    border: 'rgba(124,92,252,0.35)',
    glow: 'rgba(124,92,252,0.3)',
  },
];

export default function HeroCard({ onOpenTx, onOpenSearch, onOpenNotifications }) {
  const { getTotalUSD, balanceVisible, toggleBalance, getMonthlyStats } = useFinanceStore();
  const { user } = useAuthStore();
  const { history } = useNotificationStore();

  const balance = getTotalUSD();
  const { ingresos, egresos } = getMonthlyStats();
  const netMes = ingresos - egresos;
  const isPositiveMes = netMes >= 0;

  // FIX: iniciar displayBalance con el valor actual (no 0) para evitar flash
  const [displayBalance, setDisplayBalance] = useState(
    balance.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const prevBalanceRef = useRef(balance);
  const count = useMotionValue(prevBalanceRef.current);

  useEffect(() => {
    const from = prevBalanceRef.current;
    const to   = balance;
    prevBalanceRef.current = to;

    const animation = animate(count, to, {
      duration: from === to ? 0 : 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayBalance(
          latest.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
      },
    });
    return animation.stop;
  }, [balance, count]);

  const nombre = user?.displayName?.split(' ')[0] || 'Usuario';
  const iniciales = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const unread = history.filter(n => !n.read).length;

  return (
    /* overflow visible para que los pills no se corten */
    <div className="header-arc pt-safe relative" style={{ paddingBottom: 0 }}>
      {/* Inner arc con overflow:hidden para el gradiente */}
      <div className="header-arc-inner px-5 pb-7">
        {/* ── Top bar ── */}
        <div className="flex justify-between items-center mt-4 mb-6 relative z-10">
          {/* Avatar + saludo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-jakarta font-bold text-[13px] text-white select-none shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,252,0.3) 0%, rgba(168,85,247,0.2) 100%)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {iniciales}
            </div>
            <div>
              <span className="font-dm text-white/45 text-[10px] block leading-none mb-0.5 uppercase tracking-widest">
                Bienvenido
              </span>
              <span className="font-jakarta font-bold text-white text-[14px] tracking-tight leading-none">
                {nombre}
              </span>
            </div>
          </div>

          {/* Iconos de acción */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Buscar transacción"
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              onClick={onOpenNotifications}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all relative"
              aria-label="Notificaciones"
            >
              <Bell size={17} strokeWidth={2} />
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f43f5e] rounded-full"
                  style={{ boxShadow: '0 0 6px rgba(244,63,94,0.9)' }}
                />
              )}
            </button>
          </div>
        </div>

        {/* ── Balance ── */}
        <div className="flex flex-col items-center text-center relative z-10 mb-2">
          <span className="font-dm text-[10px] text-white/40 mb-3 uppercase tracking-[0.18em]">
            Patrimonio Total
          </span>

          <div className="flex items-center gap-3">
            <span className="font-jakarta font-bold text-[44px] text-white tabular-nums tracking-tight leading-none drop-shadow-lg">
              {balanceVisible ? `$${displayBalance}` : '$ ••••••'}
            </span>
            <button
              onClick={toggleBalance}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-all"
              aria-label={balanceVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {balanceVisible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Delta mensual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full ${
              isPositiveMes
                ? 'bg-[#22c55e]/10 text-[#4ade80]'
                : 'bg-[#f43f5e]/10 text-[#fb7185]'
            }`}
          >
            {isPositiveMes
              ? <TrendingUp size={11} strokeWidth={2.5} />
              : <TrendingDown size={11} strokeWidth={2.5} />
            }
            <span className="font-dm text-[11px] font-semibold">
              {isPositiveMes ? '+' : ''}
              {formatCurrency(netMes, 'USD')} este mes
            </span>
          </motion.div>
        </div>

        {/* ── Divider ── */}
        <div className="w-full h-px my-5 relative z-10" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* ── Action pills — dentro del inner para que el gradiente los cubra ── */}
        <div className="flex justify-center gap-4 relative z-10 pb-1">
          {ACTION_PILLS.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.type}
                onClick={() => onOpenTx?.(action.type)}
                className="action-pill group"
                whileTap={{ scale: 0.86 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div
                  className="action-pill-icon"
                  style={{
                    background: action.accent,
                    borderColor: action.border,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    boxShadow: `0 4px 16px ${action.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  <Icon size={21} strokeWidth={2} color="#fff" />
                </div>
                <span className="action-pill-label">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sombra suave debajo del arco */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--bg-base))',
          bottom: '-28px',
          zIndex: -1,
        }}
      />
    </div>
  );
}
