import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from './RippleButton';

const AlertDialogContext = createContext(null);

export function AlertDialog({ children, defaultOpen = false, open, onOpenChange }) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : localOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setLocalOpen;

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({ render, children }) {
  const { setIsOpen } = useContext(AlertDialogContext);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  if (render) {
    return React.cloneElement(render, { onClick: handleClick });
  }

  return (
    <span onClick={handleClick} className="inline-block cursor-pointer">
      {children}
    </span>
  );
}

export function AlertDialogPopup({ children, className = '', from = 'bottom' }) {
  const { isOpen, setIsOpen } = useContext(AlertDialogContext);

  const getTransitionVariants = () => {
    switch (from) {
      case 'top':
        return {
          hidden: { opacity: 0, y: -50, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -30, scale: 0.95 }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: -50, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -30, scale: 0.95 }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: 50, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 30, scale: 0.95 }
        };
      case 'bottom':
      default:
        return {
          hidden: { opacity: 0, y: 50, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 30, scale: 0.95 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            variants={getTransitionVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full bg-white border border-line rounded-2xl p-6 shadow-xl flex flex-col gap-4 overflow-hidden pointer-events-auto z-10 ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AlertDialogHeader({ children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 text-left ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold text-ink leading-none ${className}`}>
      {children}
    </h3>
  );
}

export function AlertDialogDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-500 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children, className = '' }) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-line mt-2 ${className}`}>
      {children}
    </div>
  );
}

export function AlertDialogCancel({ children, className = '' }) {
  const { setIsOpen } = useContext(AlertDialogContext);
  return (
    <RippleButton
      variant="secondary"
      onClick={() => setIsOpen(false)}
      className={`w-full sm:w-auto ${className}`}
    >
      {children || 'Cancel'}
    </RippleButton>
  );
}

export function AlertDialogAction({ children, onClick, className = '' }) {
  const { setIsOpen } = useContext(AlertDialogContext);

  const handleAction = (e) => {
    setIsOpen(false);
    onClick?.(e);
  };

  return (
    <RippleButton
      variant="purple"
      onClick={handleAction}
      className={`w-full sm:w-auto ${className}`}
    >
      {children || 'Continue'}
    </RippleButton>
  );
}
