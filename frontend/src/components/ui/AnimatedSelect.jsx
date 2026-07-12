import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * AnimatedSelect
 *
 * Animated dropdown selector that renders a floating panel with
 * smooth enter/exit transitions. Supports single-select and optional
 * search filtering. Used wherever resource, employee, asset, or category
 * selection is required.
 *
 * @param  {string}   label       - Field label shown above the trigger
 * @param  {string}   placeholder - Trigger text when no value selected
 * @param  {Array}    options     - Array of { value, label, icon?, sub? } objects
 * @param  {*}        value       - Currently selected value
 * @param  {Function} onChange    - Called with selected option value
 * @param  {boolean}  searchable  - Enable search input inside dropdown (default: true when options > 6)
 * @param  {boolean}  required    - Marks field as required
 * @param  {boolean}  disabled    - Disables interaction
 * @param  {string}   className   - Additional wrapper classes
 * @returns {JSX.Element}
 */
const AnimatedSelect = ({
  label,
  placeholder = 'Select...',
  options = [],
  value,
  onChange,
  searchable,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const showSearch = searchable ?? options.length > 6;
  const selectedOption = options.find(o => o.value === value || o.value === String(value));

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-rust ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={`
          relative flex items-center justify-between h-10 w-full rounded-xl border px-3 text-sm
          transition-all duration-150 focus:outline-none
          ${open
            ? 'border-brand ring-2 ring-brand/20 bg-white'
            : 'border-line bg-white hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-surface' : 'cursor-pointer'}
        `}
      >
        <span className={selectedOption ? 'text-ink font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-50 mt-1 w-full bg-white border border-line rounded-2xl shadow-xl overflow-hidden"
            style={{ top: '100%', left: 0 }}
          >
            {showSearch && (
              <div className="p-2 border-b border-line">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm text-ink placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
              ) : (
                filtered.map(opt => {
                  const isSelected = opt.value === value || opt.value === String(value);
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      whileHover={{ backgroundColor: '#F6F7F9' }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                        ${isSelected ? 'text-brand font-medium' : 'text-ink'}`}
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-400" />}
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sub && <span className="block text-[11px] text-gray-400 truncate">{opt.sub}</span>}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedSelect;
