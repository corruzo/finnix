import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home',      icon: Home,      label: 'Inicio' },
  { id: 'wallet',    icon: Wallet,    label: 'Cuentas' },
  { id: 'analytics', icon: BarChart3, label: 'Análisis' },
  { id: 'settings',  icon: Settings,  label: 'Ajustes' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.88 }}
            animate={{ scale: isActive ? 1.08 : 1 }}
            transition={{ duration: 0.18 }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              color={isActive ? '#ffffff' : '#4a4a6a'}
              style={{ transition: 'color 0.2s' }}
            />
            <span className="nav-label" style={{ color: isActive ? '#fff' : '#4a4a6a' }}>
              {label}
            </span>

            <AnimatePresence>
              {isActive && (
                <motion.span
                  className="nav-indicator"
                  layoutId="nav-indicator"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </nav>
  );
}
