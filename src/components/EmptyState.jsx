import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, titulo, descripcion, accion, onAccion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-[20px] border border-dashed border-border"
    >
      <div className="w-14 h-14 rounded-full bg-glass-bg flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-secondary" />
      </div>
      <p className="font-jakarta font-bold text-[16px] text-white mb-2">{titulo}</p>
      <p className="font-dm text-[13px] text-text-secondary leading-relaxed mb-5">{descripcion}</p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="font-dm text-[13px] font-bold text-accent-violet border border-accent-violet/30 px-5 py-2.5 rounded-full hover:bg-accent-violet/10 transition-colors"
        >
          {accion}
        </button>
      )}
    </motion.div>
  );
}
