import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

/**
 * NotificationStack
 *
 * Displays notifications as a stacked card cluster (collapsed) that
 * expands into a flat list on click — matching images 3 and 4 from the
 * design reference.
 *
 * Collapsed state:  Shows the top card with depth-stacked shadows behind
 *                   it and a "N Notifications" badge at the bottom.
 * Expanded state:   All cards unfold vertically with a "View all" link.
 *
 * @param  {Array}    notifications  - Array of { id, type, message, created_date, read_status }
 * @param  {Function} onMarkRead     - Called with notification id when card is clicked
 * @param  {Function} onMarkAllRead  - Called when "View all" is clicked
 * @param  {string}   className      - Additional wrapper classes
 * @returns {JSX.Element}
 */
const NotificationStack = ({ notifications = [], onMarkRead, onMarkAllRead, className = '' }) => {
  const [expanded, setExpanded] = useState(false);

  const unread = notifications.filter(n => !n.read_status);
  const displayList = expanded ? notifications.slice(0, 5) : notifications.slice(0, 1);
  const total = notifications.length;

  if (total === 0) {
    return (
      <div className={`px-4 py-6 text-center text-sm text-gray-400 ${className}`}>
        No notifications right now.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Stack / List area */}
      <div
        className="relative cursor-pointer"
        onClick={() => setExpanded(prev => !prev)}
      >
        <AnimatePresence mode="sync">
          {displayList.map((notif, idx) => {
            const isTop = idx === 0;
            const relativeAge = getRelativeTime(notif.created_date);
            return (
              <motion.div
                key={notif.id}
                layout
                initial={expanded ? { opacity: 0, y: -8 } : { opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y:       expanded ? 0 : idx * 6,
                  scale:   expanded ? 1 : 1 - idx * 0.04,
                  zIndex:  10 - idx,
                }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => {
                  if (expanded && isTop) {
                    e.stopPropagation();
                    onMarkRead?.(notif.id);
                  }
                }}
                className={`
                  bg-white border border-line rounded-2xl px-4 py-3 shadow-sm
                  ${!expanded ? 'absolute w-full' : 'relative'}
                  ${isTop && !notif.read_status ? 'border-l-2 border-l-brand' : ''}
                `}
                style={!expanded ? { top: 0 } : {}}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-ink leading-tight truncate">
                      {notif.type}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">
                      {relativeAge} · {notif.message}
                    </p>
                  </div>
                  {!notif.read_status && (
                    <span className="shrink-0 flex items-center gap-0.5 text-xs text-gray-400 font-mono mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Depth stubs when collapsed */}
        {!expanded && total > 1 && (
          <>
            <div className="absolute w-full h-full rounded-2xl border border-line bg-white"
              style={{ top: 6, left: 0, transform: 'scale(0.96)', zIndex: 2, opacity: 0.7 }} />
            {total > 2 && (
              <div className="absolute w-full h-full rounded-2xl border border-line bg-white"
                style={{ top: 12, left: 0, transform: 'scale(0.92)', zIndex: 1, opacity: 0.4 }} />
            )}
          </>
        )}

        {/* Spacer for collapsed stacks */}
        {!expanded && <div style={{ height: 56 }} />}
      </div>

      {/* Footer: count badge + expand/collapse */}
      <motion.button
        layout
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-ink transition-colors self-start"
      >
        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">
          {unread.length > 0 ? unread.length : total}
        </span>
        {expanded ? (
          <span className="flex items-center gap-1 font-medium" onClick={(e) => { e.stopPropagation(); onMarkAllRead?.(); }}>
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="font-medium">
            {unread.length > 0 ? `${unread.length} unread notification${unread.length > 1 ? 's' : ''}` : 'Notifications'}
          </span>
        )}
      </motion.button>
    </div>
  );
};

// ── Helper ──
function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60)  return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m`;
  const hrs  = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default NotificationStack;
