/**
 * useBottomSheet.js
 *
 * Hook reutilizable que devuelve los props necesarios para convertir
 * cualquier motion.div en un bottom sheet con arrastre para cerrar.
 *
 * Uso:
 *   const { dragControls, handleProps, sheetProps } = useBottomSheet(onClose);
 *
 *   // En el contenedor drag-handle:
 *   <div {...handleProps}>...</div>
 *
 *   // En el motion.div del sheet:
 *   <motion.div {...sheetProps}>...</motion.div>
 */
import { useDragControls } from 'framer-motion';

/**
 * @param {() => void} onClose - Función que se llama al cerrar el sheet.
 * @param {number} [threshold=100] - Píxeles de desplazamiento hacia abajo para activar el cierre.
 */
export function useBottomSheet(onClose, threshold = 100) {
  const dragControls = useDragControls();

  const handleProps = {
    onPointerDown: (e) => dragControls.start(e),
    className: 'flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none',
  };

  const sheetProps = {
    drag: 'y',
    dragControls,
    dragListener: false,
    dragConstraints: { top: 0 },
    dragElastic: 0.15,
    onDragEnd: (_, info) => {
      if (info.offset.y > threshold) onClose();
    },
  };

  return { dragControls, handleProps, sheetProps };
}

/**
 * Variantes de animación reutilizables para bottom sheets.
 * Importar donde sea necesario.
 */
export const BACKDROP_VARIANTS = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

export const SHEET_VARIANTS = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.45 } },
  exit:    { y: '100%', transition: { ease: [0.7, 0, 0.84, 0], duration: 0.25 } },
};

