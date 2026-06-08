import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Monedas soportadas ───────────────────────────────────────
const CURRENCIES = {
  VES:  { symbol: 'Bs.',  name: 'Bolívares',  decimals: 2 },
  USD:  { symbol: '$',    name: 'Dólares',    decimals: 2 },
  EUR:  { symbol: '€',    name: 'Euros',      decimals: 2 },
  USDT: { symbol: '₮',   name: 'USDT',       decimals: 2 },
};

// ── Tasas de cambio por defecto ──────────────────────────────
const DEFAULT_RATES = {
  bcv:        36.50,
  paralelo:   38.20,
  eur_usd:    1.08,
  lastUpdated: null,
};

// ── Store central de finanzas ────────────────────────────────
export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // ── Estado ──────────────────────────────────────────────
      accounts:       [],        // Cuentas/activos del usuario (vacío por defecto)
      transactions:   [],        // Historial de movimientos (vacío por defecto)
      rates:          DEFAULT_RATES,
      balanceVisible: true,
      CURRENCIES,

      // ── Visibilidad de saldo ─────────────────────────────────
      toggleBalance: () =>
        set(s => ({ balanceVisible: !s.balanceVisible })),

      // ── CUENTAS ──────────────────────────────────────────────

      /** Agrega una cuenta nueva con todos sus campos */
      addAccount: (account) =>
        set(s => ({
          accounts: [
            ...s.accounts,
            {
              // ── Identificadores ──────────────────────────────
              id:           `ACC-${Date.now().toString(36).toUpperCase()}`,
              userId:       account.userId       || null,   // UID del propietario (Firebase Auth)
              // ── Datos de cuenta ──────────────────────────────
              name:         account.name,
              numeroCuenta: account.numeroCuenta || null,   // número de cuenta (opcional)
              type:         account.type,
              currency:     account.currency,
              balance:      account.balance,
              color:        account.color,
              icon:         account.icon         || '💼',
              // ── Metadata ─────────────────────────────────────
              sparkline:    [50, 50, 50, 50, 50, 50, 50],
              createdAt:    new Date().toISOString(),
              updatedAt:    new Date().toISOString(),
            },
          ],
        })),

      /** Actualiza los datos de una cuenta existente */
      updateAccount: (id, data) =>
        set(s => ({
          accounts: s.accounts.map(acc =>
            acc.id === id ? { ...acc, ...data, updatedAt: new Date().toISOString() } : acc
          ),
        })),

      /** Elimina una cuenta y todas sus transacciones asociadas */
      removeAccount: (id) =>
        set(s => ({
          accounts:     s.accounts.filter(acc => acc.id !== id),
          transactions: s.transactions.filter(tx => tx.accountId !== id),
        })),

      // ── TRANSACCIONES ─────────────────────────────────────────

      /** Registra un movimiento y actualiza el saldo de la cuenta */
      addTransaction: (tx) => {
        const newTx = {
          ...tx,
          id:   `tx-${Date.now()}`,
          date: new Date().toISOString(),
        };
        set(s => ({
          transactions: [newTx, ...s.transactions],
          accounts: s.accounts.map(acc => {
            if (acc.id !== tx.accountId) return acc;
            const delta = tx.type === 'ingreso' ? tx.amount : -tx.amount;
            return { ...acc, balance: acc.balance + delta };
          }),
        }));
      },

      /** Elimina un movimiento y revierte el saldo de la cuenta */
      removeTransaction: (id) => {
        const { transactions } = get();
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;
        set(s => ({
          transactions: s.transactions.filter(t => t.id !== id),
          accounts: s.accounts.map(acc => {
            if (acc.id !== tx.accountId) return acc;
            // Revertir: si era ingreso restamos, si era egreso sumamos
            const delta = tx.type === 'ingreso' ? -tx.amount : tx.amount;
            return { ...acc, balance: acc.balance + delta };
          }),
        }));
      },

      // ── TASAS DE CAMBIO ───────────────────────────────────────

      /** Actualiza las tasas de cambio */
      updateRates: (newRates) =>
        set(s => ({
          rates: { ...s.rates, ...newRates, lastUpdated: new Date().toISOString() },
        })),

      // ── HELPERS DE CONVERSIÓN ─────────────────────────────────

      /** Convierte cualquier monto a USD */
      toUSD: (amount, currency) => {
        const { rates } = get();
        switch (currency) {
          case 'VES':  return amount / rates.paralelo;
          case 'EUR':  return amount * rates.eur_usd;
          case 'USDT':
          case 'USD':  return amount;
          default:     return amount;
        }
      },

      /** Convierte cualquier monto a VES (bolívares al paralelo) */
      toVES: (amount, currency) => {
        const { rates } = get();
        switch (currency) {
          case 'USD':
          case 'USDT': return amount * rates.paralelo;
          case 'EUR':  return amount * rates.eur_usd * rates.paralelo;
          case 'VES':  return amount;
          default:     return amount;
        }
      },

      // ── CÁLCULOS AGREGADOS ────────────────────────────────────

      /** Patrimonio total del usuario convertido a USD */
      getTotalUSD: () => {
        const { accounts, toUSD } = get();
        return accounts.reduce((sum, acc) => sum + toUSD(acc.balance, acc.currency), 0);
      },

      /** Ingresos y egresos del mes actual en USD */
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

      /** Balance actualizado de una cuenta específica */
      getAccountBalance: (id) => {
        const { accounts } = get();
        return accounts.find(acc => acc.id === id)?.balance ?? 0;
      },
    }),
    {
      name: 'finnix-store-v2',
      // Persiste solo datos del usuario, no funciones ni catálogos
      partialize: (s) => ({
        accounts:       s.accounts,
        transactions:   s.transactions,
        rates:          s.rates,
        balanceVisible: s.balanceVisible,
      }),
    }
  )
);
