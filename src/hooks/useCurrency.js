import { useCallback } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

/**
 * Hook para conversión de monedas usando las tasas del store global.
 * Expone convert(amount, from, to) y la lista de monedas disponibles.
 */
export function useCurrency() {
  const { rates, CURRENCIES } = useFinanceStore();

  const convert = useCallback((amount, from, to) => {
    if (from === to) return amount;

    // Primero a USD, luego a la moneda destino
    let usdAmount;
    switch (from) {
      case 'VES':  usdAmount = rates.binance_usdt ? amount / rates.binance_usdt : (rates.bcv_usd ? amount / rates.bcv_usd : amount); break;
      case 'EUR':  usdAmount = (rates.bcv_usd && rates.bcv_eur) ? amount * (rates.bcv_eur / rates.bcv_usd) : amount; break;
      case 'USDT':
      case 'USD':  usdAmount = amount; break;
      default:     usdAmount = amount;
    }

    switch (to) {
      case 'VES':  return rates.binance_usdt ? usdAmount * rates.binance_usdt : (rates.bcv_usd ? usdAmount * rates.bcv_usd : usdAmount);
      case 'EUR':  return (rates.bcv_usd && rates.bcv_eur) ? usdAmount / (rates.bcv_eur / rates.bcv_usd) : usdAmount;
      case 'USDT':
      case 'USD':  return usdAmount;
      default:     return usdAmount;
    }
  }, [rates]);

  const format = useCallback((amount, currency) => {
    const sym = CURRENCIES[currency]?.symbol ?? '';
    return `${sym}${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [CURRENCIES]);

  return { convert, format, rates, CURRENCIES };
}
