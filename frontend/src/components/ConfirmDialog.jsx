import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, isDestructive = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative modal-panel max-w-md"
          >
            <h3 className="text-xl font-bold text-ink mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-secondary mb-8 leading-relaxed">{message}</p>
            
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-secondary px-5" 
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button 
                className={`btn px-5 ${isDestructive ? 'btn-danger' : 'btn-primary'}`} 
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
