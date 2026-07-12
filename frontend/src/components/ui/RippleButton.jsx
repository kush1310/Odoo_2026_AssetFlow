import React, { useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * RippleButton
 *
 * A button that spawns a radial ripple animation at the exact click
 * point on every interaction. Supports all standard button variants
 * (primary, secondary, danger, ghost, outline) and sizes (sm, md, lg, icon).
 *
 * @param  {string}         variant   - 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' (default: 'primary')
 * @param  {string}         size      - 'sm' | 'md' | 'lg' | 'icon' (default: 'md')
 * @param  {React.ReactNode} children - Button content
 * @param  {string}         className - Additional Tailwind overrides
 * @param  {Function}       onClick   - Click handler (called after ripple triggers)
 * @param  {boolean}        disabled  - Disabled state
 * @param  {string}         type      - HTML button type ('button' | 'submit' | 'reset')
 * @returns {JSX.Element}
 */
const RippleButton = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...rest
}) => {
  const buttonRef = useRef(null);
  const [ripples, setRipples] = React.useState([]);

  const variantClasses = {
    primary:   'bg-brand text-white hover:bg-brand-deep shadow-sm shadow-brand/20 focus-visible:ring-brand',
    secondary: 'bg-white text-ink border border-line hover:bg-surface shadow-sm focus-visible:ring-brand',
    danger:    'bg-rust text-white hover:bg-red-800 shadow-sm shadow-rust/20 focus-visible:ring-rust',
    ghost:     'bg-transparent text-gray-600 hover:bg-surface hover:text-ink focus-visible:ring-brand',
    outline:   'bg-transparent text-brand border border-brand hover:bg-brand/5 focus-visible:ring-brand',
  };

  const sizeClasses = {
    sm:   'h-8  px-3  text-xs  gap-1.5 rounded-lg',
    md:   'h-10 px-4  text-sm  gap-2   rounded-xl',
    lg:   'h-12 px-6  text-sm  gap-2.5 rounded-xl font-semibold',
    icon: 'h-9  w-9   text-sm  rounded-full p-0 justify-center',
  };

  const rippleColor = {
    primary:   'rgba(255,255,255,0.35)',
    secondary: 'rgba(15,110,95,0.12)',
    danger:    'rgba(255,255,255,0.30)',
    ghost:     'rgba(15,110,95,0.12)',
    outline:   'rgba(15,110,95,0.15)',
  };

  const handleClick = (e) => {
    if (disabled) return;

    const button = buttonRef.current;
    if (!button) return;
    const rect   = button.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const id     = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);

    onClick?.(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        relative overflow-hidden inline-flex items-center font-medium
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed select-none
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size]    || sizeClasses.md}
        ${className}
      `}
      {...rest}
    >
      {/* Ripple layer */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full animate-[ripple_0.6s_ease-out_forwards]"
          style={{
            left: r.x,
            top:  r.y,
            width: 8,
            height: 8,
            transform: 'translate(-50%,-50%)',
            backgroundColor: rippleColor[variant] || rippleColor.primary,
          }}
        />
      ))}
      {children}
    </motion.button>
  );
};

export default RippleButton;
