import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { formatCurrency, dateLabel } from '../lib/utils';
import { useFinanceStore } from '../store/useFinanceStore';

export default function TransactionRow({ tx, index }) {
  const { accounts, toUSD } = useFinanceStore();
  const account = accounts.find(a => a.id === tx.accountId);
  const isIncome = tx.type === 'ingreso';
  
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const gradientClass = isIncome ? 'bg-icon-green' : 'bg-icon-red';
  const amountColor = isIncome ? 'text-positive' : 'text-text-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
      className="flex items-center gap-3 py-3 px-2 rounded-[14px] cursor-pointer transition-colors"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${gradientClass}`}>
        <Icon size={18} color="#fff" strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-jakarta font-bold text-[15px] truncate">{tx.description}</div>
        <div className="font-dm text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5 truncate">
          <span>{dateLabel(tx.date)}</span>
          <span className="w-1 h-1 rounded-full bg-border"></span>
          <span>{account?.name || 'Desconocido'}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={`font-jakarta font-bold text-[15px] tabular-nums ${amountColor}`}>
          {isIncome ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
        </div>
        <div className="font-dm text-[12px] text-text-secondary mt-0.5 tabular-nums">
          {formatCurrency(toUSD(tx.amount, tx.currency), 'USD')}
        </div>
      </div>
    </motion.div>
  );
}
