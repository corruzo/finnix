import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowRight, Info, X, PlusCircle, Wallet } from 'lucide-react';
import HeroCard from '../components/HeroCard';
import AssetRow from '../components/AssetRow';
import TransactionRow from '../components/TransactionRow';
import BottomNav from '../components/BottomNav';
import RatesCard from '../components/RatesCard';
import AddTransactionModal from '../components/AddTransactionModal';
import AddAccountModal from '../components/AddAccountModal';
import AccountHistoryModal from '../components/AccountHistoryModal';
import EmptyState from '../components/EmptyState';
import NotificationHistoryModal from '../components/NotificationHistoryModal';
import GlobalSearchModal from '../components/GlobalSearchModal';

// Vistas
import VistaCartera from './Dashboard/VistaCartera';
import VistaAnalitica from './Dashboard/VistaAnalitica';
import VistaAjustes from './Dashboard/VistaAjustes';

const TAB_ORDER = ['home', 'wallet', 'analytics', 'settings'];

export default function Dashboard() {
  const [tab,              setTab]             = useState('home');
  const [tabDirection,     setTabDirection]    = useState(1); // 1 = izq→der, -1 = der→izq
  const [txType,           setTxType]           = useState('egreso');
  const [showTxModal,      setShowTxModal]       = useState(false);
  const [showAccModal,     setShowAccModal]      = useState(false);
  const [accountForEdit,   setAccountForEdit]   = useState(null);
  const [accountForHistory, setAccountForHistory] = useState(null);
  const [showSearchModal,       setShowSearchModal]       = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const openTxModal = (type = 'egreso') => { setTxType(type); setShowTxModal(true); };

  const navigateTab = useCallback((newTab) => {
    const from = TAB_ORDER.indexOf(tab);
    const to   = TAB_ORDER.indexOf(newTab);
    setTabDirection(to > from ? 1 : -1);
    setTab(newTab);
  }, [tab]);

  const handleAssetAction = (action, account) => {
    if (action === 'edit') setAccountForEdit(account);
    if (action === 'history') setAccountForHistory(account);
  };

  // Detecta swipe horizontal para cambiar de tab
  const handleDragEnd = useCallback((_, info) => {
    const THRESHOLD = 60;
    const currentIndex = TAB_ORDER.indexOf(tab);
    if (info.offset.x < -THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
      navigateTab(TAB_ORDER[currentIndex + 1]);
    } else if (info.offset.x > THRESHOLD && currentIndex > 0) {
      navigateTab(TAB_ORDER[currentIndex - 1]);
    }
  }, [tab, navigateTab]);

  const pageVariants = {
    initial: (dir) => ({ opacity: 0, x: dir * 40 }),
    in:      { opacity: 1, x: 0 },
    out:     (dir) => ({ opacity: 0, x: dir * -40 }),
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        <AnimatePresence mode="wait" custom={tabDirection}>
          <motion.div
            key={tab}
            custom={tabDirection}
            variants={pageVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex-1 w-full flex flex-col min-h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
          >
            {tab === 'home'      && <VistaInicio   onOpenAcc={() => setShowAccModal(true)} onOpenTx={openTxModal} onAssetAction={handleAssetAction} onOpenSearch={() => setShowSearchModal(true)} onOpenNotifications={() => setShowNotificationModal(true)} />}
            {tab === 'wallet'    && <VistaCartera  onOpenAcc={() => setShowAccModal(true)} onAssetAction={handleAssetAction} />}
            {tab === 'analytics' && <VistaAnalitica />}
            {tab === 'settings'  && <VistaAjustes />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active={tab} onChange={navigateTab} />

      <AnimatePresence>
        {showTxModal  && <AddTransactionModal initialType={txType} onClose={() => setShowTxModal(false)} />}
        {showAccModal && <AddAccountModal     onClose={() => setShowAccModal(false)} />}
        {accountForEdit && <AddAccountModal accountToEdit={accountForEdit} onClose={() => setAccountForEdit(null)} />}
        {accountForHistory && <AccountHistoryModal account={accountForHistory} onClose={() => setAccountForHistory(null)} />}
        {showSearchModal && <GlobalSearchModal onClose={() => setShowSearchModal(false)} />}
        {showNotificationModal && <NotificationHistoryModal onClose={() => setShowNotificationModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Vista Inicio ─────────────────────────────────────────── */
function VistaInicio({ onOpenAcc, onOpenTx, onAssetAction, onOpenSearch, onOpenNotifications }) {
  const { accounts, transactions } = useFinanceStore();
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const showBanner = accounts.length === 0 && !dismissedBanner;

  return (
    <div className="flex flex-col">
      <HeroCard onOpenTx={onOpenTx} onOpenSearch={onOpenSearch} onOpenNotifications={onOpenNotifications} />

      <div className="px-5 mt-6 flex flex-col gap-8">

        {/* Banner de bienvenida */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-2xl glass p-3 flex gap-3 items-start relative overflow-hidden"
            >
              <div className="w-1.5 h-full absolute left-0 top-0 bg-accent-violet" />
              <Info size={20} className="text-accent-violet mt-0.5 ml-2 shrink-0" />
              <div className="flex-1">
                <p className="font-dm text-[13px] font-medium text-white mb-0.5">Bienvenido a Finnix</p>
                <p className="font-dm text-[12px] text-text-secondary leading-snug">
                  Agrega tus cuentas y comienza a registrar tus movimientos financieros.
                </p>
              </div>
              <button onClick={() => setDismissedBanner(true)} className="text-text-secondary hover:text-white transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasas de cambio */}
        <RatesCard />

        {/* Mis Cuentas */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h3 className="section-label">Mis Cuentas</h3>
            <button onClick={onOpenAcc} className="text-accent-violet font-dm text-[12px] font-bold">
              + Agregar
            </button>
          </div>

          {accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              titulo="Sin cuentas aún"
              descripcion="Agrega tu primera cuenta o activo para comenzar a ver tu patrimonio."
              accion="Agregar cuenta"
              onAccion={onOpenAcc}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {accounts.map((acc, i) => <AssetRow key={acc.id} account={acc} index={i} onAction={onAssetAction} />)}
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="pb-6">
          <div className="flex justify-between items-end mb-4">
            <h3 className="section-label">Actividad Reciente</h3>
            <button onClick={onOpenTx} className="text-accent-violet font-dm text-[12px] font-bold">
              + Nuevo
            </button>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={PlusCircle}
              titulo="Sin movimientos"
              descripcion="Registra tu primer ingreso o egreso para ver tu historial aquí."
              accion="Registrar movimiento"
              onAccion={onOpenTx}
            />
          ) : (
            <div className="flex flex-col gap-2 border border-border bg-bg-card rounded-[20px] p-2">
              {transactions.slice(0, 4).map((tx, i) => <TransactionRow key={tx.id} tx={tx} index={i} />)}
              <button className="w-full py-3 mt-1 flex justify-center items-center gap-1.5 text-text-secondary hover:text-white transition-colors font-dm text-[13px] font-bold">
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
