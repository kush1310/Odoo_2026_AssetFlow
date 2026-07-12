import React from 'react';
import { motion } from 'framer-motion';

const AssetTagChip = ({ tag, className = '' }) => {
  return (
    <motion.div
      className={`asset-tag ${className}`}
      whileHover="hover"
      initial="initial"
    >
      <motion.span 
        className="opacity-50 mr-1"
        variants={{
          initial: { x: 0, opacity: 0.5 },
          hover: { x: -2, opacity: 0.8 }
        }}
        transition={{ duration: 0.2 }}
      >
        [
      </motion.span>
      
      <span>{tag}</span>
      
      <motion.span 
        className="opacity-50 ml-1"
        variants={{
          initial: { x: 0, opacity: 0.5 },
          hover: { x: 2, opacity: 0.8 }
        }}
        transition={{ duration: 0.2 }}
      >
        ]
      </motion.span>
    </motion.div>
  );
};

export default AssetTagChip;
