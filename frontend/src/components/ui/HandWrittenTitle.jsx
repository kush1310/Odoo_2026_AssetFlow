import React from "react";
import { motion } from "framer-motion";

/**
 * HandWrittenTitle
 *
 * Renders a title with a handwritten SVG loop path drawn around it.
 * Uses smooth framer-motion path drawing animations.
 *
 * @param {string} title - The main title text
 * @param {string} subtitle - Optional descriptive subtitle
 * @param {string} className - Optional container styling overrides
 */
export function HandWrittenTitle({
  title = "AssetFlow",
  subtitle = "",
  className = "",
}) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2.2, ease: [0.43, 0.13, 0.23, 0.96] },
        opacity: { duration: 0.4 },
      },
    },
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto py-10 overflow-hidden ${className}`}>
      {/* SVG handwritten loop shape */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 400"
          initial="hidden"
          animate="visible"
          className="w-full h-full text-brand"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 1050 50 
               C 1250 180, 1050 350, 600 370
               C 150 370, 50 320, 50 200
               C 50 80, 250 30, 600 30
               C 850 30, 1050 100, 1050 100"
            fill="none"
            strokeWidth="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
          />
        </motion.svg>
      </div>

      <div className="relative text-center z-10 flex flex-col items-center justify-center px-4">
        <motion.h1
          className="text-3xl md:text-5xl font-extrabold text-ink tracking-tight flex items-center gap-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            className="text-sm md:text-base text-gray-500 mt-2 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
