import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

const AppContext = createContext(null);

// Tasas de cambio mock — se reemplazarán con API real (BCV, etc.)
const DEFAULT_RATES = {
  bcv: 36.50,       // USD → VES (tasa BCV oficial)
  paralelo: 38.20,  // USD → VES (tasa paralela/Binance P2P)
  eur_usd: 1.08,    // EUR → USD
  lastUpdated: null,
};

const ACCOUNT_TYPES = {
  BANK_VES: 'bank_ves',
  BANK_USD: 'bank_usd',
  CASH_USD: 'cash_usd',
  CASH_EUR: 'cash_eur',
  CASH_VES: 'cash_ves',
  CARD_DEBIT: 'card_debit',
  CARD_CREDIT: 'card_credit',
  BINANCE: 'binance',
  PAYPAL: 'paypal',
};

const CURRENCIES = {
  VES: { symbol: 'Bs.', name: 'Bolívares', flag: '🇻🇪' },
  USD: { symbol: '$', name: 'Dólares', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euros', flag: '🇪🇺' },
  USDT: { symbol: '₮', name: 'USDT', flag: '🔵' },
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [accounts, setAccounts] = useState([
    {
      id: 'demo-1',
      name: 'Banco Venezuela',
      type: ACCOUNT_TYPES.BANK_VES,
      currency: 'VES',
      balance: 125000,
      color: '#6366f1',
      icon: '🏦',
    },
    {
      id: 'demo-2',
      name: 'Efectivo Dólares',
      type: ACCOUNT_TYPES.CASH_USD,
      currency: 'USD',
      balance: 320,
      color: '#10b981',
      icon: '💵',
    },
    {
      id: 'demo-3',
      name: 'Binance USDT',
      type: ACCOUNT_TYPES.BINANCE,
      currency: 'USDT',
      balance: 85.50,
      color: '#f59e0b',
      icon: '₿',
    },
  ]);
  const [transactions, setTransactions] = useState([
    {
      id: 'tx-1',
      type: 'expense',
      category: 'Alimentación',
      description: 'Supermercado Central',
      amount: 45.00,
      currency: 'USD',
      accountId: 'demo-2',
      date: new Date(Date.now() - 86400000).toISOString(),
      icon: '🛒',
    },
    {
      id: 'tx-2',
      type: 'income',
      category: 'Trabajo',
      description: 'Pago freelance',
      amount: 150.00,
      currency: 'USD',
      accountId: 'demo-2',
      date: new Date(Date.now() - 172800000).toISOString(),
      icon: '💼',
    },
    {
      id: 'tx-3',
      type: 'expense',
      category: 'Transporte',
      description: 'Gasolina',
      amount: 8000,
      currency: 'VES',
      accountId: 'demo-1',
      date: new Date(Date.now() - 259200000).toISOString(),
      icon: '⛽',
    },
  ]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Conversión de monedas a USD (moneda base interna)
  const toUSD = useCallback((amount, currency) => {
    switch (currency) {
      case 'VES': return amount / rates.paralelo;
      case 'EUR': return amount * rates.eur_usd;
      case 'USDT':
      case 'USD': return amount;
      default: return amount;
    }
  }, [rates]);

  // Conversión de USD a moneda destino
  const fromUSD = useCallback((amountUSD, toCurrency) => {
    switch (toCurrency) {
      case 'VES': return amountUSD * rates.paralelo;
      case 'EUR': return amountUSD / rates.eur_usd;
      case 'USDT':
      case 'USD': return amountUSD;
      default: return amountUSD;
    }
  }, [rates]);

  // Balance total del portafolio en USD
  const totalBalanceUSD = accounts.reduce((sum, acc) => sum + toUSD(acc.balance, acc.currency), 0);

  // Agregar cuenta
  const addAccount = useCallback((account) => {
    setAccounts(prev => [...prev, { ...account, id: `acc-${Date.now()}` }]);
  }, []);

  // Agregar transacción y actualizar balance de la cuenta
  const addTransaction = useCallback((tx) => {
    const newTx = { ...tx, id: `tx-${Date.now()}`, date: new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      return { ...acc, balance: acc.balance + delta };
    }));
  }, []);

  // Actualizar tasas de cambio manualmente
  const updateRates = useCallback((newRates) => {
    setRates(prev => ({ ...prev, ...newRates, lastUpdated: new Date().toISOString() }));
  }, []);

  const value = {
    // Auth
    user,
    authLoading,
    // Tasas y conversión
    rates,
    updateRates,
    toUSD,
    fromUSD,
    CURRENCIES,
    ACCOUNT_TYPES,
    // Finanzas
    accounts,
    addAccount,
    transactions,
    addTransaction,
    totalBalanceUSD,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
