import { useState, useMemo, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { PlusCircle, Target, TrendingUp, ArrowRightLeft, Edit3, Check, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS = [
  '#7c5cfc', // violeta
  '#3b82f6', // azul
  '#06b6d4', // cian
  '#f59e0b', // amarillo
  '#ec4899', // rosado
  '#10b981', // esmeralda
  '#84cc16', // lima
  '#a855f7', // morado
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated/90 backdrop-blur-md p-3 rounded-xl border border-glass-border shadow-xl">
        <p className="font-jakarta font-bold text-[13px] text-white">
          {payload[0].name}
        </p>
        <p className="font-dm text-[12px] text-accent-violet mt-0.5 font-bold">
          {formatCurrency(payload[0].value, 'USD')}
        </p>
      </div>
    );
  }
  return null;
};

export default function VistaAnalitica() {
  const { transactions, toUSD, getTotalUSD, getMonthlyStats, balanceVisible } = useFinanceStore();
  const { ingresos, egresos } = getMonthlyStats();
  const balanceTotal = getTotalUSD();

  const [activeSubTab, setActiveSubTab] = useState('flow'); // 'flow' | 'categories' | 'goals'
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Estados de meta de ahorro persistentes
  const [goalName, setGoalName] = useState('Mi Meta de Ahorro');
  const [goalTarget, setGoalTarget] = useState(5000);

  useEffect(() => {
    const savedName = localStorage.getItem('finnix_goal_name');
    const savedTarget = localStorage.getItem('finnix_goal_target');
    if (savedName) setGoalName(savedName);
    if (savedTarget) setGoalTarget(parseFloat(savedTarget));
  }, []);

  const handleSaveGoal = () => {
    localStorage.setItem('finnix_goal_name', goalName);
    localStorage.setItem('finnix_goal_target', goalTarget.toString());
    setIsEditingGoal(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const hasDatos = ingresos > 0 || egresos > 0;

  // Cómputo de gastos por categoría
  const categoryBreakdown = useMemo(() => {
    if (!transactions) return [];
    const expenses = transactions.filter(tx => tx.type === 'egreso');
    const groups = {};
    
    expenses.forEach(tx => {
      const categoryName = tx.category || 'Otro';
      const amountUSD = toUSD(tx.amount, tx.currency);
      groups[categoryName] = (groups[categoryName] || 0) + amountUSD;
    });

    const totalExpenseUSD = Object.values(groups).reduce((sum, val) => sum + val, 0);

    return Object.entries(groups)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenseUSD > 0 ? (value / totalExpenseUSD) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, toUSD]);

  // Cálculos de meta
  const goalProgress = useMemo(() => {
    const progress = (balanceTotal / Math.max(goalTarget, 1)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [balanceTotal, goalTarget]);

  return (
    <div className="px-5 pt-safe mt-6 flex flex-col flex-1">
      <h1 className="font-jakarta font-bold text-[28px] tracking-tight mb-6 shrink-0">Analítica</h1>

      {/* Segmented Sub Tabs */}
      <div className="flex bg-bg-card border border-border rounded-2xl p-1 gap-1 mb-6 shrink-0">
        {[
          { id: 'flow', label: 'Flujo' },
          { id: 'categories', label: 'Categorías' },
          { id: 'goals', label: 'Metas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 py-2 rounded-xl font-dm text-[13px] font-bold transition-all relative ${
              activeSubTab === tab.id ? 'text-white' : 'text-text-secondary hover:text-white/80'
            }`}
          >
            {activeSubTab === tab.id && (
              <motion.div
                layoutId="subtab-indicator"
                className="absolute inset-0 rounded-xl bg-white/5 border border-white/10"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeSubTab === 'flow' && (
            <motion.div
              key="flow-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              {!hasDatos ? (
                <div className="text-center py-12 text-text-secondary font-dm text-sm">
                  Registra ingresos o egresos para habilitar el flujo mensual.
                </div>
              ) : (
                <>
                  <div className="card-base p-6 flex flex-col items-center">
                    <h3 className="section-label mb-6">Balance de Flujo</h3>
                    <div className="h-[180px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[{ name: 'Ingresos', value: ingresos }, { name: 'Egresos', value: egresos }]}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={75}
                            paddingAngle={5} dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="var(--positive)" />
                            <Cell fill="var(--negative)" />
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-dm text-[11px] text-text-secondary">Balance Neto</span>
                        <span className="font-jakarta font-bold text-[20px] tabular-nums mt-0.5 text-white">
                          {balanceVisible ? formatCurrency(ingresos - egresos, 'USD') : '***'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between w-full mt-6 border-t border-border pt-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-positive" />
                          <span className="font-dm text-[11px] text-text-secondary">Ingresos</span>
                        </div>
                        <div className="font-jakarta font-bold text-[15px] tabular-nums text-white">
                          {formatCurrency(ingresos, 'USD')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-negative" />
                          <span className="font-dm text-[11px] text-text-secondary">Egresos</span>
                        </div>
                        <div className="font-jakarta font-bold text-[15px] tabular-nums text-white">
                          {formatCurrency(egresos, 'USD')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Rate Card */}
                  <div className="card-base p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-positive/10 flex items-center justify-center text-positive shrink-0">
                      <TrendingUp size={22} />
                    </div>
                    <div>
                      <span className="font-dm text-[11px] text-text-secondary block">Tasa de Ahorro Mensual</span>
                      <span className="font-jakarta font-bold text-[16px] text-white">
                        {ingresos > 0 
                          ? `${Math.max(0, Math.round(((ingresos - egresos) / ingresos) * 100))}% de los ingresos`
                          : '0% (Sin ingresos)'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeSubTab === 'categories' && (
            <motion.div
              key="categories-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-12 text-text-secondary font-dm text-sm">
                  Registra egresos para ver el desglose por categorías.
                </div>
              ) : (
                <>
                  <div className="card-base p-6 flex flex-col items-center">
                    <h3 className="section-label mb-6">Gastos por Categoría</h3>
                    <div className="h-[180px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={75}
                            paddingAngle={3} dataKey="value"
                            stroke="none"
                          >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-dm text-[11px] text-text-secondary">Egresos Totales</span>
                        <span className="font-jakarta font-bold text-[18px] tabular-nums mt-0.5 text-white">
                          {balanceVisible ? formatCurrency(egresos, 'USD') : '***'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List breakdown */}
                  <div className="flex flex-col gap-2">
                    <span className="section-label px-1">Distribución</span>
                    <div className="card-base p-4 flex flex-col gap-3">
                      {categoryBreakdown.map((cat, idx) => {
                        const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                        return (
                          <div key={cat.name} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-dm text-[13px] text-white truncate font-medium">{cat.name}</span>
                            </div>
                            <div className="text-right flex items-center gap-3 shrink-0">
                              <span className="font-jakarta font-bold text-[13px] text-white tabular-nums">
                                {formatCurrency(cat.value, 'USD')}
                              </span>
                              <span className="font-dm text-[11px] text-text-secondary w-10 text-right font-bold tabular-nums">
                                {Math.round(cat.percentage)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeSubTab === 'goals' && (
            <motion.div
              key="goals-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              <div className="card-base p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-violet/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                      <Target size={20} />
                    </div>
                    <div>
                      <h4 className="font-jakarta font-bold text-white text-[16px]">{goalName}</h4>
                      <span className="font-dm text-[11px] text-text-secondary">Vinculado al Balance Total</span>
                    </div>
                  </div>
                  {!isEditingGoal && (
                    <button
                      onClick={() => setIsEditingGoal(true)}
                      className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-white transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>

                {isEditingGoal ? (
                  <div className="flex flex-col gap-3 mt-4">
                    <div>
                      <label className="block font-dm text-[11px] text-text-secondary mb-1">Nombre de la Meta</label>
                      <input
                        type="text"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        placeholder="Ej. Comprar carro, Vacaciones..."
                        className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 font-dm text-sm text-white outline-none focus:border-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block font-dm text-[11px] text-text-secondary mb-1">Monto Objetivo (USD)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Ej. 5000"
                        className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 font-dm text-sm text-white outline-none focus:border-accent-violet"
                      />
                    </div>
                    <button
                      onClick={handleSaveGoal}
                      className="w-full h-10 bg-accent-violet rounded-xl font-dm text-[13px] font-bold text-white flex items-center justify-center gap-1.5 mt-2 shadow-[0_4px_12px_rgba(124,92,252,0.3)] hover:brightness-110 active:scale-98 transition-all"
                    >
                      <Check size={14} /> Guardar Meta
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* Progression bar */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-dm text-[11px] text-text-secondary">Progreso de Meta</span>
                        <span className="font-jakarta font-bold text-[18px] text-accent-violet tabular-nums">
                          {goalProgress.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Bar container */}
                      <div className="h-3.5 w-full bg-white/5 rounded-full overflow-hidden border border-border p-[2px]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goalProgress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-accent-violet to-accent-indigo rounded-full relative"
                          style={{
                            boxShadow: '0 0 8px rgba(124,92,252,0.6)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Progress Detail */}
                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                      <div>
                        <span className="font-dm text-[11px] text-text-secondary block">Ahorrado</span>
                        <span className="font-jakarta font-bold text-[15px] text-white tabular-nums">
                          {formatCurrency(balanceTotal, 'USD')}
                        </span>
                      </div>
                      <div>
                        <span className="font-dm text-[11px] text-text-secondary block">Objetivo</span>
                        <span className="font-jakarta font-bold text-[15px] text-white tabular-nums">
                          {formatCurrency(goalTarget, 'USD')}
                        </span>
                      </div>
                    </div>

                    {goalProgress >= 100 && (
                      <div className="flex items-center gap-2.5 p-3.5 bg-positive/10 border border-positive/20 rounded-xl text-positive mt-1">
                        <Award size={18} />
                        <span className="font-dm text-[12px] font-bold">¡Meta completada! Has alcanzado tu objetivo de ahorro.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
