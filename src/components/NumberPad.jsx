import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

const KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', '⌫',
];

export default function NumberPad({ value, onChange, maxLength = 10 }) {
  const handleKey = (key) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1) || '');
      return;
    }
    if (key === '.' && value.includes('.')) return;
    if (key === '.' && value === '') { onChange('0.'); return; }
    if (value.length >= maxLength) return;
    // Prevent leading zeros
    if (value === '0' && key !== '.') { onChange(key); return; }
    onChange(value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full px-2">
      {KEYS.map((key) => (
        <motion.button
          key={key}
          className="numpad-key"
          whileTap={{ scale: 0.88, backgroundColor: 'var(--bg-card)' }}
          transition={{ duration: 0.1 }}
          onClick={() => handleKey(key)}
        >
          {key === '⌫' ? <Delete size={20} color="var(--text-secondary)" /> : key}
        </motion.button>
      ))}
    </div>
  );
}
