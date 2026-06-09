import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { formatCurrency, truncate } from '../lib/utils';
import { SiBitcoin, SiTether, SiPaypal } from 'react-icons/si';
import { Building2, Wallet, Trash2, Edit2, ListOrdered, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { deleteAccountData } from '../services/financeService';

const ICON_MAP = {
  'binance': { icon: SiTether, color: 'icon-amber', size: 24 },
  'cash_usd': { icon: Wallet, color: 'icon-green', size: 22 },
  'bank_ves': { icon: Building2, color: 'icon-violet', size: 22 },
  'paypal': { icon: SiPaypal, color: 'icon-blue', size: 22 },
};

export default function AssetRow({ account, index, onAction }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  const { toUSD, toVES } = useFinanceStore();

  const { name, balance, currency, type, sparkline, color } = account;
  const config = ICON_MAP[type] || { icon: Wallet, color: 'icon-violet', size: 22 };
  const Icon = config.icon;
  const iconBg = color || `bg-${config.color}`;

  const chartData = sparkline?.map((val, i) => ({ value: val, name: i })) || [];
  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].value >= chartData[0].value;
  const strokeColor = isPositive ? 'var(--positive)' : 'var(--negative)';

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta cuenta y todos sus movimientos?')) return;
    if (!user?.uid) return;
    
    setIsDeleting(true);
    try {
      await deleteAccountData(user.uid, account.id);
      showNotification('Cuenta eliminada', '', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error', 'No se pudo eliminar la cuenta.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col mb-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.02)' }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-3 rounded-[14px] cursor-pointer transition-colors bg-bg-card border border-transparent"
      >
        <div className={`icon-circle ${iconBg}`}>
          <Icon size={config.size} color="#ffffff" />
        </div>

      <div className="flex-1 min-w-0">
        <div className="font-jakarta font-bold text-[15px] truncate">{name}</div>
        <div className="font-dm text-[13px] text-text-secondary mt-0.5 flex items-center gap-2">
          {currency} 
          {/* Sparkline mini-chart */}
          <div className="w-[50px] h-[20px] opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={strokeColor} 
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-jakarta font-bold text-[15px] tabular-nums">
          {formatCurrency(balance, currency)}
        </div>
        <div className="font-dm text-[12px] text-text-secondary mt-0.5 tabular-nums">
          ≈ {formatCurrency(
            currency === 'VES' ? toUSD(balance, 'VES') : toVES(balance, currency),
            currency === 'VES' ? 'USD' : 'VES'
          )}
        </div>
      </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-3 pb-3 pt-1">
              <button 
                onClick={() => onAction && onAction('history', account)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-glass-bg border border-border text-[12px] font-dm text-text-secondary hover:text-white transition-colors"
              >
                <ListOrdered size={14} /> Movimientos
              </button>
              <button 
                onClick={() => onAction && onAction('edit', account)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-glass-bg border border-border text-[12px] font-dm text-text-secondary hover:text-white transition-colors"
              >
                <Edit2 size={14} /> Editar
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-negative/10 border border-negative/20 text-[12px] font-dm text-negative hover:bg-negative/20 transition-colors"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                {isDeleting ? 'Borrando' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
