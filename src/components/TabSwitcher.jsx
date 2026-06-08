import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TabSwitcher({ tabs, active, onChange, className = '' }) {
  return (
    <div
      className={`flex gap-1 p-1 rounded-full ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-1 py-2 px-4 rounded-full font-dm text-sm font-medium transition-colors duration-200 z-10"
            style={{
              color: isActive ? '#0d0d14' : 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#ffffff', zIndex: -1 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </AnimatePresence>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
