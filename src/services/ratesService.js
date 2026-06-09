/**
 * ratesService.js — Servicio de tasas de cambio
 *
 * Fuentes (scraping HTML):
 *   • Dólar BCV  → usdt.com.ve (tabla comparativa, fila "Tasa BCV")
 *   • Euro BCV   → bcv.org.ve  (div#euro > strong.strong-tb)
 *   • Binance    → usdt.com.ve (span.rate-display.rate-buy)
 *
 * Arquitectura:
 *   - El scraping pasa por el proxy de Vite (/api/scrape/*) para evitar CORS
 *   - Los resultados se guardan en Firestore /config/exchangeRates (recurso compartido)
 *   - Todos los usuarios se suscriben via onSnapshot al mismo documento
 *   - Si el scraping falla, Firestore conserva la última tasa válida
 *   - Solo se re-scrappea si la tasa tiene más de 55 minutos
 */

import { db } from './firebase';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const RATES_DOC = doc(db, 'config', 'exchangeRates');
const STALE_MS  = 55 * 60 * 1000; // 55 minutos

// ── Parseo ──────────────────────────────────────────────────

/** Convierte formato venezolano "567,68280000" → 567.6828 */
function parseVE(str) {
  if (!str) return null;
  // Limpiar espacios, quitar separador de miles (puntos), convertir coma decimal
  const clean = String(str).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ── Scraping usdt.com.ve ────────────────────────────────────

async function scrapeUSDT() {
  const res = await fetch('/api/scrape/usdt', { cache: 'no-store' });
  if (!res.ok) throw new Error(`usdt.com.ve respondió ${res.status}`);
  const html = await res.text();

  // Binance P2P (compra): <span class="rate-display rate-buy">765,00</span>
  const mBinance = html.match(
    /class="rate-display rate-buy">\s*([\d.,]+)\s*<\/span>/i
  );

  // BCV USD: fila con "Tasa BCV" → <span class="text-rate-neutral">563,29</span>
  const mBCV = html.match(
    /Tasa BCV[\s\S]{0,500}?<span\s+class="[^"]*text-rate-neutral[^"]*">\s*([\d.,]+)\s*<\/span>/i
  );

  return {
    binance_usdt: mBinance ? parseVE(mBinance[1]) : null,
    bcv_usd:      mBCV     ? parseVE(mBCV[1])     : null,
  };
}

// ── Scraping bcv.org.ve (solo Euro) ─────────────────────────

async function scrapeBCV() {
  const res = await fetch('/api/scrape/bcv', { cache: 'no-store' });
  if (!res.ok) throw new Error(`bcv.org.ve respondió ${res.status}`);
  const html = await res.text();

  // Euro BCV: <div id="euro"> ... <strong class="strong-tb"> 655,38411577</strong>
  const mEuro = html.match(
    /id="euro"[\s\S]*?<strong\s+class="strong-tb">\s*([\d.,]+)\s*<\/strong>/i
  );

  return {
    bcv_eur: mEuro ? parseVE(mEuro[1]) : null,
  };
}

// ── Guardar en Firestore ────────────────────────────────────

async function saveRates(rates) {
  const payload = { lastUpdated: serverTimestamp() };

  // Solo escribimos campos con valor válido (merge preserva los anteriores)
  if (rates.bcv_usd      !== null) payload.bcv_usd      = rates.bcv_usd;
  if (rates.bcv_eur      !== null) payload.bcv_eur      = rates.bcv_eur;
  if (rates.binance_usdt !== null) payload.binance_usdt = rates.binance_usdt;

  await setDoc(RATES_DOC, payload, { merge: true });
  console.info('[Finnix] Tasas guardadas en Firestore:', payload);
}

// ── Refresh condicional ─────────────────────────────────────

export async function refreshRatesIfStale() {
  // Verificar si las tasas actuales son recientes
  try {
    const snap = await getDoc(RATES_DOC);
    if (snap.exists()) {
      const updated = snap.data().lastUpdated?.toDate?.();
      if (updated && (Date.now() - updated.getTime()) < STALE_MS) {
        console.info('[Finnix] Tasas frescas, no se actualiza.');
        return;
      }
    }
  } catch { /* si falla la lectura, intentamos refrescar igual */ }

  console.info('[Finnix] Refrescando tasas...');

  // Scraping en paralelo
  const [usdt, bcv] = await Promise.allSettled([scrapeUSDT(), scrapeBCV()]);

  const rates = {
    binance_usdt: usdt.status === 'fulfilled' ? usdt.value.binance_usdt : null,
    bcv_usd:      usdt.status === 'fulfilled' ? usdt.value.bcv_usd     : null,
    bcv_eur:      bcv.status  === 'fulfilled' ? bcv.value.bcv_eur      : null,
  };

  const hayAlgo = Object.values(rates).some(v => v !== null);
  if (hayAlgo) {
    await saveRates(rates);
  } else {
    console.warn('[Finnix] Scraping falló — Firestore conserva la última tasa válida.');
  }
}

// ── Suscripción en tiempo real ──────────────────────────────

/**
 * Suscribe al documento compartido de tasas.
 * @param {(rates: object) => void} callback
 * @returns {() => void} función para cancelar la suscripción
 */
export function subscribeToRates(callback) {
  return onSnapshot(RATES_DOC, (snap) => {
    if (!snap.exists()) {
      callback({ bcv_usd: null, bcv_eur: null, binance_usdt: null, lastUpdated: null });
      return;
    }
    const d = snap.data();
    callback({
      bcv_usd:      d.bcv_usd      ?? null,
      bcv_eur:      d.bcv_eur      ?? null,
      binance_usdt: d.binance_usdt ?? null,
      lastUpdated:  d.lastUpdated?.toDate?.()?.toISOString?.() ?? null,
    });
  });
}
