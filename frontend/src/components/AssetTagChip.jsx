import React from 'react';
import { motion } from 'framer-motion';

const AssetTagChip = ({ tag, className = '' }) => {
  return (
    <motion.div
      className={`asset-tag inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-mono-bg text-white shadow-sm border border-transparent ${className}`}
      whileHover="hover"
      initial="initial"
    >
      <motion.span 
        className="text-brand-deep mr-1 font-bold"
        variants={{
          initial: { x: 0, opacity: 0.5 },
          hover: { x: -2, opacity: 1 }
        }}
        transition={{ duration: 0.2 }}
      >
        [
      </motion.span>
      
      <span>{tag}</span>
      
      <motion.span 
        className="text-brand-deep ml-1 font-bold"
        variants={{
          initial: { x: 0, opacity: 0.5 },
          hover: { x: 2, opacity: 1 }
        }}
        transition={{ duration: 0.2 }}
      >
        ]
      </motion.span>
    </motion.div>
  );
};

export default AssetTagChip;
