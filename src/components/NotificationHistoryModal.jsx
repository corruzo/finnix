import { motion } from 'framer-motion';
import { X, Bell, Trash2, Check, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useBottomSheet, BACKDROP_VARIANTS, SHEET_VARIANTS } from '../hooks/useBottomSheet';

export default function NotificationHistoryModal({ onClose }) {
  const { history, markAsRead, clearHistory } = useNotificationStore();
  const { handleProps, sheetProps } = useBottomSheet(onClose);

  // Formatear fecha a formato amigable
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + ' - ' + 
             date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-positive" />;
      case 'error':
        return <AlertCircle size={16} className="text-[#f43f5e]" />;
      case 'info':
      default:
        return <Info size={16} className="text-accent-blue" />;
    }
  };

  const handleMarkAllRead = () => {
    markAsRead();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleClear = () => {
    clearHistory();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={BACKDROP_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        {...sheetProps}
        variants={SHEET_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="absolute bottom-0 left-0 w-full bg-bg-elevated rounded-t-[32px] border-t border-x border-glass-border z-[200] flex flex-col"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Handle */}
        <div {...handleProps}>
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex justify-between items-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-violet/10 flex items-center justify-center text-accent-violet">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="font-jakarta font-bold text-xl text-white">
                Notificaciones
              </h2>
              {history.length > 0 && (
                <span className="font-dm text-[11px] text-text-secondary">
                  {history.filter(n => !n.read).length} no leídas
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col pb-safe">
          {history.length > 0 && (
            <div className="flex justify-between gap-3 mb-4 shrink-0">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-dm text-[12px] font-bold transition-all"
              >
                <Check size={14} />
                Marcar leídas
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 text-[#f43f5e] font-dm text-[12px] font-bold transition-all"
              >
                <Trash2 size={14} />
                Limpiar
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-text-secondary mb-4">
                <Bell size={28} className="opacity-40" />
              </div>
              <p className="font-jakarta font-bold text-[16px] text-white mb-1">Sin notificaciones</p>
              <p className="font-dm text-[13px] text-text-secondary max-w-[240px] leading-relaxed">
                Aquí aparecerán las alertas de tus transacciones y configuraciones.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex gap-3 relative overflow-hidden ${
                    notif.read
                      ? 'bg-bg-card/50 border-border/50 opacity-60'
                      : 'bg-bg-card border-glass-border shadow-md'
                  }`}
                >
                  {!notif.read && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-violet" />
                  )}
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-jakarta font-bold text-[14px] text-white leading-tight mb-1">
                      {notif.title}
                    </p>
                    <p className="font-dm text-[12px] text-text-secondary leading-snug mb-2">
                      {notif.message}
                    </p>
                    <span className="font-dm text-[10px] text-text-secondary/60 flex items-center gap-1">
                      <Calendar size={10} />
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
