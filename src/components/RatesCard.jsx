import { motion } from 'framer-motion';
import { useFinanceStore } from '../store/useFinanceStore';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function RatesCard() {
  const { rates } = useFinanceStore();

  const DATA_BCV = [ {v:36.2}, {v:36.3}, {v:36.4}, {v:36.4}, {v:36.5} ];
  const DATA_PAR = [ {v:38.0}, {v:37.9}, {v:38.1}, {v:38.1}, {v:38.2} ];
  const DATA_EUR = [ {v:1.07}, {v:1.075}, {v:1.08}, {v:1.078}, {v:1.08} ];

  const tasas = [
    { label: 'BCV',      value: rates.bcv,      data: DATA_BCV, color: 'var(--accent-violet)' },
    { label: 'Paralelo', value: rates.paralelo,  data: DATA_PAR, color: 'var(--accent-blue)' },
    { label: 'EUR/USD',  value: rates.eur_usd,   data: DATA_EUR, color: 'var(--positive)', isEur: true },
  ];

  const horaActualizada = rates.lastUpdated
    ? `Actualizado ${new Date(rates.lastUpdated).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`
    : 'En vivo';

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="section-label">Tasas de Cambio</h3>
        <span className="font-dm text-[11px] text-text-secondary">{horaActualizada}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {tasas.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[120px] p-4 card-base flex flex-col gap-2"
          >
            <div className="font-dm text-[12px] text-text-secondary font-medium">{item.label}</div>
            <div className="font-jakarta font-bold text-[18px] tabular-nums">
              {item.isEur ? '$' : 'Bs.'}{item.value.toFixed(2)}
            </div>
            <div className="h-[24px] mt-1 opacity-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={item.data}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={item.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
