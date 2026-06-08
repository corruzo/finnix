import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Wallet } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import TransactionRow from './TransactionRow';

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const sheetVariants = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 400, damping: 38 } },
  exit:    { y: '100%', transition: { duration: 0.22 } },
};

export default function AccountHistoryModal({ account, onClose }) {
  const { transactions } = useFinanceStore();
  const accountTx = transactions.filter(tx => tx.accountId === account.id);

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
        style={{ maxHeight: '92dvh', minHeight: '60dvh' }}
      >
        <div className="w-12 h-1.5 rounded-full bg-border mx-auto mt-3 mb-2" />

        <div className="flex justify-between items-center px-5 mb-4">
          <div>
            <h2 className="font-jakarta font-bold text-[18px]">Movimientos</h2>
            <p className="font-dm text-[12px] text-text-secondary">{account.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-glass-bg text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 overflow-y-auto no-scrollbar flex-1 pb-safe">
          {accountTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
              <div className="w-12 h-12 rounded-full bg-glass-bg flex items-center justify-center mb-3">
                <Wallet size={20} className="text-text-secondary" />
              </div>
              <p className="font-jakarta font-bold text-[15px] text-white">Sin movimientos</p>
              <p className="font-dm text-[12px] text-text-secondary text-center max-w-[200px] mt-1">
                Esta cuenta no tiene registros recientes.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-6 mt-2">
              {accountTx.map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
