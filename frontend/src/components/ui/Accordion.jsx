import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const AccordionContext = createContext(null);
const AccordionItemContext = createContext(null);

export function Accordion({ children, multiple = false, defaultValue, className = '' }) {
  const [activeItems, setActiveItems] = useState(() => {
    if (defaultValue) {
      return multiple ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : defaultValue;
    }
    return multiple ? [] : null;
  });

  const toggleItem = (value) => {
    if (multiple) {
      setActiveItems((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        if (arr.includes(value)) {
          return arr.filter((item) => item !== value);
        }
        return [...arr, value];
      });
    } else {
      setActiveItems((prev) => (prev === value ? null : value));
    }
  };

  const isItemActive = (value) => {
    if (multiple) {
      return Array.isArray(activeItems) && activeItems.includes(value);
    }
    return activeItems === value;
  };

  return (
    <AccordionContext.Provider value={{ toggleItem, isItemActive }}>
      <div className={`flex flex-col gap-3 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ children, value, className = '' }) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={`border-b border-line pb-3 last:border-0 ${className}`}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ children, showArrow = true, className = '' }) {
  const { toggleItem, isItemActive } = useContext(AccordionContext);
  const { value } = useContext(AccordionItemContext);
  const isActive = isItemActive(value);

  return (
    <button
      onClick={() => toggleItem(value)}
      className={`w-full flex items-center justify-between py-2 text-left font-semibold text-ink hover:text-brand transition-colors focus:outline-none ${className}`}
    >
      <span className="text-base select-none">{children}</span>
      {showArrow && (
        <motion.div
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-gray-400 shrink-0 ml-4"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      )}
    </button>
  );
}

export function AccordionPanel({ children, keepRendered = false, className = '' }) {
  const { isItemActive } = useContext(AccordionContext);
  const { value } = useContext(AccordionItemContext);
  const isActive = isItemActive(value);

  const panelVariants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0 },
    expanded: { height: 'auto', opacity: 1, marginTop: 8 }
  };

  if (keepRendered) {
    return (
      <motion.div
        initial={isActive ? "expanded" : "collapsed"}
        animate={isActive ? "expanded" : "collapsed"}
        variants={panelVariants}
        transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
        className={`overflow-hidden text-sm text-gray-500 leading-relaxed ${className}`}
      >
        <div className="pb-2">{children}</div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {isActive && (
        <motion.div
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={panelVariants}
          transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
          className={`overflow-hidden text-sm text-gray-500 leading-relaxed ${className}`}
        >
          <div className="pb-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
