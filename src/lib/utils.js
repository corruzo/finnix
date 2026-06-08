import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency */
export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  const symbols = { USD: '$', VES: 'Bs. ', EUR: '€', USDT: '₮' };
  const sym = symbols[currency] ?? '';
  return `${sym}${amount.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Truncate an address/string for display */
export function truncate(str, start = 6, end = 4) {
  if (!str || str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

/** Get date label: "Hoy", "Ayer", or formatted date */
export function dateLabel(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
}
