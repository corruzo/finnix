import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Hook para conversión de monedas usando las tasas del contexto global.
 * Expone convert(amount, from, to) y la lista de monedas disponibles.
 */
export function useCurrency() {
  const { rates, CURRENCIES } = useApp();

  const convert = useCallback((amount, from, to) => {
    if (from === to) return amount;

    // Primero a USD, luego a la moneda destino
    let usdAmount;
    switch (from) {
      case 'VES':  usdAmount = amount / rates.paralelo; break;
      case 'EUR':  usdAmount = amount * rates.eur_usd; break;
      case 'USDT':
      case 'USD':  usdAmount = amount; break;
      default:     usdAmount = amount;
    }

    switch (to) {
      case 'VES':  return usdAmount * rates.paralelo;
      case 'EUR':  return usdAmount / rates.eur_usd;
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
