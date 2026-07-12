import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination
 *
 * Page-based navigation control matching the "1 / 10" pill design from
 * the reference image. Handles first/last/prev/next boundary logic.
 * Designed to be database-friendly — consumers control the `page` state
 * and pass `totalPages`; actual data fetching uses skip/limit params.
 *
 * Usage:
 *   const [page, setPage] = useState(1);
 *   const totalPages = Math.ceil(total / PAGE_SIZE);
 *   <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
 *
 * @param  {number}   page         - Current 1-indexed page number
 * @param  {number}   totalPages   - Total number of pages
 * @param  {Function} onPageChange - Called with new page number when user navigates
 * @param  {string}   className    - Additional wrapper classes
 * @returns {JSX.Element|null}     Returns null when totalPages <= 1
 */
const Pagination = ({ page, totalPages, onPageChange, className = '' }) => {
  if (!totalPages || totalPages <= 1) return null;

  const goPrev = () => { if (page > 1) onPageChange(page - 1); };
  const goNext = () => { if (page < totalPages) onPageChange(page + 1); };

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={goPrev}
        disabled={page <= 1}
        aria-label="Previous page"
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-white text-gray-500
                   hover:text-ink hover:bg-surface hover:border-gray-300 transition-colors
                   disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      {/* Pill counter — matches reference image style */}
      <div className="flex items-center gap-1 px-4 h-8 rounded-lg border border-line bg-white">
        <span className="text-sm font-bold text-brand tabular-nums">{page}</span>
        <span className="text-sm text-gray-400">/</span>
        <span className="text-sm text-gray-500 tabular-nums">{totalPages}</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={goNext}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-white text-gray-500
                   hover:text-ink hover:bg-surface hover:border-gray-300 transition-colors
                   disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default Pagination;
