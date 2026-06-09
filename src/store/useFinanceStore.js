import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeToRates, refreshRatesIfStale } from '../services/ratesService';
import { subscribeAccounts, subscribeTransactions, subscribeUserPreferences } from '../services/financeService';

const CURRENCIES = {
  VES:  { symbol: 'Bs.',  name: 'Bolívares',  decimals: 2 },
  USD:  { symbol: '$',    name: 'Dólares',    decimals: 2 },
  EUR:  { symbol: '€',    name: 'Euros',      decimals: 2 },
  USDT: { symbol: '₮',   name: 'USDT',       decimals: 2 },
};

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      accounts:       [],
      transactions:   [],
      preferredRate:  'bcv_usd', // 'bcv_usd' | 'bcv_eur' | 'binance_usdt'
      rates: {
        bcv_usd:      null,
        bcv_eur:      null,
        binance_usdt: null,
        lastUpdated:  null,
      },
      balanceVisible: true,
      CURRENCIES,

      toggleBalance: () => set(s => ({ balanceVisible: !s.balanceVisible })),
      setPreferredRate: (rate) => set({ preferredRate: rate }),

      // ── ESTADO CACHE FIRESTORE ──────────────────────────────────────
      setAccounts: (accounts) => set({ accounts }),
      setTransactions: (transactions) => set({ transactions }),

      // ── SUSCRIPCIONES ───────────────────────────────────────────
      subscribeUserData: (uid) => {
        if (!uid) return () => {};
        const unsubAcc = subscribeAccounts(uid, (accounts) => get().setAccounts(accounts));
        const unsubTx = subscribeTransactions(uid, (transactions) => get().setTransactions(transactions));
        const unsubPref = subscribeUserPreferences(uid, (prefs) => {
          if (prefs?.preferredRate) {
            get().setPreferredRate(prefs.preferredRate);
          }
        });
        
        return () => {
          unsubAcc();
          unsubTx();
          unsubPref();
        };
      },

      updateRates: (newRates) => set(s => ({ rates: { ...s.rates, ...newRates } })),

      subscribeRates: () => {
        const { updateRates } = get();
        const unsubscribe = subscribeToRates(updateRates);
        // Ejecutar en background sin bloquear (fire and forget)
        refreshRatesIfStale().catch(e => console.warn('[Finnix] Error refrescando tasas:', e));
        return unsubscribe;
      },

      // ── CONVERSIÓN ──────────────────────────────────────────────
      toUSD: (amount, currency) => {
        const { rates, preferredRate } = get();
        switch (currency) {
          case 'VES':
            const selectedRate = rates[preferredRate];
            // Si no hay tasa seleccionada cargada, devuelve 0 o asume 1 temporalmente, pero mejor intentar fallback seguro.
            // Pero el requerimiento dicta usar estrictamente la tasa seleccionada.
            if (selectedRate) return amount / selectedRate;
            return amount; // Fallback si rates aún no carga
          case 'EUR':
            if (rates.bcv_usd && rates.bcv_eur) return amount * (rates.bcv_eur / rates.bcv_usd);
            return amount;
          case 'USDT':
          case 'USD':
            return amount;
          default:
            return amount;
        }
      },

      toVES: (amount, currency) => {
        const { rates, preferredRate } = get();
        const selectedRate = rates[preferredRate];
        switch (currency) {
          case 'USD':   
          case 'USDT':
          case 'EUR':   
            // Para todas las monedas extranjeras, convertirlas a USD y luego a VES usando la tasa preferida
            // O más directo: si la moneda de destino es VES, y la de origen es USD/USDT/EUR, 
            // usamos siempre la selectedRate como puente o directamente multiplicador.
            // Pero para ser exactos: 1 USD = selectedRate VES.
            const usdValue = get().toUSD(amount, currency);
            return selectedRate ? usdValue * selectedRate : amount;
          case 'VES':   return amount;
          default:      return amount;
        }
      },

      // ── CÁLCULOS AGREGADOS ──────────────────────────────────────
      getTotalUSD: () => {
        const { accounts, toUSD } = get();
        return accounts.reduce((sum, acc) => sum + toUSD(acc.balance, acc.currency), 0);
      },

      getMonthlyStats: () => {
        const { transactions, toUSD } = get();
        const now = new Date();
        const delMes = transactions.filter(tx => {
          const d = new Date(tx.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const ingresos = delMes
          .filter(tx => tx.type === 'ingreso')
          .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);
        const egresos = delMes
          .filter(tx => tx.type === 'egreso')
          .reduce((s, tx) => s + toUSD(tx.amount, tx.currency), 0);
        return { ingresos, egresos };
      },

      getAccountBalance: (id) => {
        const { accounts } = get();
        return accounts.find(acc => acc.id === id)?.balance ?? 0;
      },
    }),
    {
      name: 'finnix-storage',
      partialize: (state) => ({ rates: state.rates, preferredRate: state.preferredRate }),
    }
  )
);

