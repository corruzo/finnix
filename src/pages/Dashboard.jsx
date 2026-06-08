import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowRight, Info, X, LogOut, User, PlusCircle, Wallet } from 'lucide-react';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';
import HeroCard from '../components/HeroCard';
import AssetRow from '../components/AssetRow';
import TransactionRow from '../components/TransactionRow';
import BottomNav from '../components/BottomNav';
import RatesCard from '../components/RatesCard';
import AddTransactionModal from '../components/AddTransactionModal';
import AddAccountModal from '../components/AddAccountModal';
import AccountHistoryModal from '../components/AccountHistoryModal';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const [tab,          setTab]         = useState('home');
  const [showTxModal,  setShowTxModal]  = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
  const [accountForEdit, setAccountForEdit] = useState(null);
  const [accountForHistory, setAccountForHistory] = useState(null);

  const handleAssetAction = (action, account) => {
    if (action === 'edit') setAccountForEdit(account);
    if (action === 'history') setAccountForHistory(account);
  };

  return (
    <div className="app-shell">
      <div className="app-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 w-full"
          >
            {tab === 'home'      && <VistaInicio   onOpenAcc={() => setShowAccModal(true)} onOpenTx={() => setShowTxModal(true)} onAssetAction={handleAssetAction} />}
            {tab === 'wallet'    && <VistaCartera  onOpenAcc={() => setShowAccModal(true)} onAssetAction={handleAssetAction} />}
            {tab === 'analytics' && <VistaAnalitica />}
            {tab === 'settings'  && <VistaAjustes />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active={tab} onChange={setTab} />

      <AnimatePresence>
        {showTxModal  && <AddTransactionModal onClose={() => setShowTxModal(false)} />}
        {showAccModal && <AddAccountModal     onClose={() => setShowAccModal(false)} />}
        {accountForEdit && <AddAccountModal accountToEdit={accountForEdit} onClose={() => setAccountForEdit(null)} />}
        {accountForHistory && <AccountHistoryModal account={accountForHistory} onClose={() => setAccountForHistory(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Vista Inicio ─────────────────────────────────────────── */
function VistaInicio({ onOpenAcc, onOpenTx, onAssetAction }) {
  const { accounts, transactions } = useFinanceStore();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="flex flex-col">
      <HeroCard onOpenTx={onOpenTx} />

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
              <button onClick={() => setShowBanner(false)} className="text-text-secondary hover:text-white transition-colors">
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

/* ── Vista Analítica ──────────────────────────────────────── */
function VistaAnalitica() {
  const { getMonthlyStats, balanceVisible } = useFinanceStore();
  const { ingresos, egresos } = getMonthlyStats();
  const hasDatos = ingresos > 0 || egresos > 0;
  const PIE_COLORS = ['var(--positive)', 'var(--negative)'];

  return (
    <div className="px-5 pt-safe mt-6">
      <h1 className="font-jakarta font-bold text-[28px] tracking-tight mb-8">Analítica</h1>

      {!hasDatos ? (
        <EmptyState
          icon={PlusCircle}
          titulo="Sin datos este mes"
          descripcion="Registra ingresos y egresos para ver aquí tu flujo de efectivo mensual."
        />
      ) : (
        <div className="card-base p-6 mb-6">
          <h3 className="section-label text-center mb-6">Flujo Mensual</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: ingresos }, { value: egresos }]}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={85}
                  paddingAngle={5} dataKey="value"
                  stroke="none"
                >
                  {PIE_COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-dm text-[12px] text-text-secondary">Neto</span>
              <span className="font-jakarta font-bold text-[20px] tabular-nums mt-1">
                {balanceVisible ? formatCurrency(ingresos - egresos, 'USD') : '***'}
              </span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-positive"></div>
                <span className="font-dm text-[12px] text-text-secondary">Ingresos</span>
              </div>
              <div className="font-jakarta font-bold tabular-nums">{formatCurrency(ingresos, 'USD')}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-negative"></div>
                <span className="font-dm text-[12px] text-text-secondary">Egresos</span>
              </div>
              <div className="font-jakarta font-bold tabular-nums">{formatCurrency(egresos, 'USD')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Vista Cartera ────────────────────────────────────────── */
function VistaCartera({ onOpenAcc, onAssetAction }) {
  const { accounts } = useFinanceStore();
  return (
    <div className="px-5 pt-safe mt-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-jakarta font-bold text-[28px] tracking-tight">Mis Cuentas</h1>
        <button onClick={onOpenAcc} className="text-accent-violet font-dm text-[13px] font-bold">
          + Agregar
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          titulo="Sin cuentas registradas"
          descripcion="Agrega tus cuentas bancarias, efectivo o criptomonedas para gestionar tu patrimonio."
          accion="Agregar primera cuenta"
          onAccion={onOpenAcc}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((acc, i) => <AssetRow key={acc.id} account={acc} index={i} onAction={onAssetAction} />)}
        </div>
      )}
    </div>
  );
}

/* ── Vista Ajustes ────────────────────────────────────────── */
function VistaAjustes() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
      clearAuth();
    }
  };

  return (
    <div className="px-5 pt-safe mt-6 flex flex-col items-center">
      <h1 className="font-jakarta font-bold text-[28px] tracking-tight mb-8 self-start">Ajustes</h1>

      <div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#4f46e5] flex items-center justify-center mb-4"
        style={{ boxShadow: '0 0 24px rgba(124,92,252,0.4)' }}
      >
        <User size={40} color="#fff" />
      </div>

      <h2 className="font-jakarta font-bold text-xl text-white mb-1">
        {user?.displayName || 'Usuario'}
      </h2>
      <p className="font-dm text-[#8b8ba7] mb-10">{user?.email}</p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        style={{
          width: '100%', height: 56, borderRadius: 16,
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
          color: '#f43f5e', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
        }}
      >
        <LogOut size={20} />
        Cerrar Sesión
      </motion.button>
    </div>
  );
}

/* ── Componente de Estado Vacío ───────────────────────────── */
function EmptyState({ icon: Icon, titulo, descripcion, accion, onAccion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-[20px] border border-dashed border-border"
    >
      <div className="w-14 h-14 rounded-full bg-glass-bg flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-secondary" />
      </div>
      <p className="font-jakarta font-bold text-[16px] text-white mb-2">{titulo}</p>
      <p className="font-dm text-[13px] text-text-secondary leading-relaxed mb-5">{descripcion}</p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="font-dm text-[13px] font-bold text-accent-violet border border-accent-violet/30 px-5 py-2.5 rounded-full hover:bg-accent-violet/10 transition-colors"
        >
          {accion}
        </button>
      )}
    </motion.div>
  );
}
