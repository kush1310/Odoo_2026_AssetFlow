import React from 'react';

/**
 * LoadingIndicator
 *
 * Renders a highly-customizable and aesthetic loading indicator.
 *
 * @param  {string} type  - Loader style, e.g. "dot-circle", "spinner"
 * @param  {string} size  - Size variant: "sm", "md", "lg"
 * @param  {string} label - Text label to display alongside/below loader
 * @returns {JSX.Element}
 */
export const LoadingIndicator = ({ type = 'dot-circle', size = 'md', label = '' }) => {
  // Size mapping
  const sizeClasses = {
    sm: { container: 'w-6 h-6', dotSize: 'w-1 h-1', text: 'text-xs' },
    md: { container: 'w-10 h-10', dotSize: 'w-2 h-2', text: 'text-sm' },
    lg: { container: 'w-16 h-16', dotSize: 'w-3.5 h-3.5', text: 'text-base' }
  }[size] || { container: 'w-10 h-10', dotSize: 'w-2 h-2', text: 'text-sm' };

  // Render correct type
  const renderLoader = () => {
    if (type === 'dot-circle') {
      return (
        <div className={`relative ${sizeClasses.container} animate-spin`}>
          {/* Arrange 8 dots in a circle using absolute positioning */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            const opacity = 0.15 + (i * 0.85) / 8;
            return (
              <span
                key={i}
                className={`absolute ${sizeClasses.dotSize} rounded-full bg-brand`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-250%)`,
                  opacity: opacity,
                }}
              />
            );
          })}
        </div>
      );
    }

    // Fallback simple spinner
    return (
      <div className={`${sizeClasses.container} border-2 border-brand border-t-transparent rounded-full animate-spin`} />
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      {renderLoader()}
      {label && <span className={`font-bold text-brand tracking-wide ${sizeClasses.text}`}>{label}</span>}
    </div>
  );
};
