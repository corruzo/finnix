import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/useNotificationStore';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DynamicIsland() {
  const { notification, hideNotification } = useNotificationStore();
  const [deviceType, setDeviceType] = useState('standard');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isIPhone = /iPhone/.test(navigator.userAgent);
    if (!isIPhone) {
      setDeviceType('standard');
      return;
    }

    const w = Math.min(window.screen.width, window.screen.height);
    const h = Math.max(window.screen.width, window.screen.height);

    // Dynamic Island iPhones: 14 Pro/Max, 15 series, etc.
    if ((w === 393 && h === 852) || (w === 430 && h === 932)) {
      setDeviceType('island');
    } 
    // Notch iPhones: X, XS, 11, 12, 13, 14
    else if (
      (w === 375 && h === 812) || 
      (w === 414 && h === 896) || 
      (w === 390 && h === 844) || 
      (w === 428 && h === 926)
    ) {
      setDeviceType('notch');
    } else {
      setDeviceType('standard');
    }
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-positive" />;
      case 'error': return <AlertCircle size={16} className="text-destructive" />;
      default: return <Info size={16} className="text-accent-blue" />;
    }
  };

  const isIsland = deviceType === 'island';
  const isNotch = deviceType === 'notch';

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4",
        isIsland ? "top-2" : isNotch ? "top-12 pt-1.5" : "top-safe pt-2"
      )}
      style={!isIsland && !isNotch ? { top: 'env(safe-area-inset-top)' } : {}}
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={isIsland 
              ? { y: -20, scale: 0.8, opacity: 0, filter: 'blur(10px)' }
              : isNotch
                ? { y: -35, scale: 0.9, opacity: 0 }
                : { y: -50, scale: 0.95, opacity: 0 }
            }
            animate={isIsland 
              ? { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', transition: { type: "spring", stiffness: 400, damping: 25 } }
              : isNotch
                ? { y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 24 } }
                : { y: 0, scale: 1, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 30 } }
            }
            exit={isIsland 
              ? { y: -20, scale: 0.9, opacity: 0, filter: 'blur(5px)', transition: { duration: 0.2 } }
              : isNotch
                ? { y: -25, scale: 0.9, opacity: 0, transition: { duration: 0.18 } }
                : { y: -30, opacity: 0, transition: { duration: 0.2 } }
            }
            className={cn(
              "pointer-events-auto cursor-pointer flex items-center gap-3 px-5 py-3 shadow-2xl transition-all",
              isIsland 
                ? "bg-black/95 backdrop-blur-md border border-white/10 shadow-black/50 rounded-[32px] max-w-[90%] sm:max-w-sm"
                : isNotch
                  ? cn(
                      "bg-bg-elevated/95 backdrop-blur-md shadow-black/45 rounded-full w-full max-w-[92%] border-y border-r border-glass-border/70 border-l-4",
                      notification.type === 'success' ? 'border-l-positive' :
                      notification.type === 'error' ? 'border-l-[#f43f5e]' :
                      'border-l-accent-blue'
                    )
                  : "bg-bg-elevated backdrop-blur-md border border-glass-border shadow-black/30 rounded-2xl w-full max-w-sm mt-2"
            )}
            onClick={hideNotification}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="shrink-0 flex items-center justify-center">
              {getIcon(notification.type)}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              {notification.title && (
                <span className="font-jakarta font-bold text-[13px] text-white leading-tight">
                  {notification.title}
                </span>
              )}
              {notification.message && (
                <span className="font-dm text-[11.5px] text-text-secondary leading-tight mt-0.5 line-clamp-1">
                  {notification.message}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
