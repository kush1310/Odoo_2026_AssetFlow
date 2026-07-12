import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Database,
  Lock,
  UserCircle,
  CheckCircle2,
  Pencil,
  PlusCircle,
  Trash2,
  LogIn,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import Pagination from '../components/ui/Pagination';
import RippleButton from '../components/ui/RippleButton';

const PAGE_SIZE = 15;

/**
 * actionMeta
 *
 * Returns display icon, color classes, and label for a given action type.
 * Centralizes all visual mapping so individual rows stay clean.
 *
 * @param  {string} actionType - e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
 * @returns {{ Icon, bg, text, border, label }}
 */
const actionMeta = (actionType) => {
  switch (actionType) {
    case 'CREATE': return { Icon: PlusCircle,  bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', label: 'CREATE' };
    case 'UPDATE': return { Icon: Pencil,       bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    label: 'UPDATE' };
    case 'DELETE': return { Icon: Trash2,       bg: 'bg-red-50',      text: 'text-rust',         border: 'border-red-200',     label: 'DELETE' };
    case 'LOGIN':  return { Icon: LogIn,         bg: 'bg-amber/10',    text: 'text-amber',        border: 'border-amber/20',    label: 'LOGIN'  };
    default:       return { Icon: HelpCircle,   bg: 'bg-gray-50',     text: 'text-gray-600',    border: 'border-gray-200',    label: actionType };
  }
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasUnread, setHasUnread] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/logs');
        setLogs(res.data);
      } catch (err) {
        addToast('Failed to fetch activity logs.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Reset to page 1 when tab changes
  useEffect(() => { setPage(1); }, [activeTab]);

  const markAllRead = () => {
    setHasUnread(false);
    addToast('All logs marked as read.', 'success');
  };

  const tabs = [
    { id: 'all',       label: 'All Activity',   icon: Activity  },
    { id: 'alerts',    label: 'Alerts & Security', icon: Lock      },
    { id: 'approvals', label: 'Approvals & Custody', icon: CheckCircle2 },
    { id: 'bookings',  label: 'Bookings & Logs', icon: Database  },
  ];

  const filteredLogs = logs.filter(log => {
    const action = log.action_type || '';
    const desc = (log.description || '').toLowerCase();
    
    if (activeTab === 'all') return true;
    
    if (activeTab === 'alerts') {
      return action.includes('LOCKOUT') || 
             action.includes('FAILED') || 
             action.includes('REJECT') || 
             desc.includes('locked') || 
             desc.includes('failed') || 
             desc.includes('discrepancy') ||
             desc.includes('lost') ||
             desc.includes('overdue');
    }
    
    if (activeTab === 'approvals') {
      return action.includes('APPROVE') || 
             action.includes('RESOLVE') || 
             action.includes('ASSIGN') || 
             action.includes('TRANSFER') || 
             desc.includes('allocated') ||
             desc.includes('promoted');
    }
    
    if (activeTab === 'bookings') {
      return action.includes('BOOKING') || 
             action.includes('ALLOCATION') || 
             desc.includes('booked') ||
             desc.includes('return');
    }
    
    return true;
  });

  const totalPages   = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const pagedLogs    = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            System Audit Logs
            {hasUnread && (
              <span className="flex h-2.5 w-2.5 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand" />
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">
            Immutable, real-time record of all resource operations and access events.
          </p>
        </div>

        <div className="flex gap-3">
          {hasUnread && (
            <RippleButton variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="w-4 h-4" />
              Mark All Read
            </RippleButton>
          )}
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Tab bar */}
        <div className="flex gap-0 border-b border-line px-6 pt-4 bg-surface/30">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors
                  ${isActive ? 'text-brand' : 'text-gray-500 hover:text-ink'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="logs-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
                    initial={false}
                  />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pagedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Database className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No activity logged matching criteria.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            <AnimatePresence>
              {pagedLogs.map((log, idx) => {
                const { Icon, bg, text, border, label } = actionMeta(log.action_type);
                const isUnread = hasUnread && idx < 3 && page === 1;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex items-start gap-4 px-6 py-4 hover:bg-surface/50 transition-colors
                      ${isUnread ? 'border-l-2 border-l-brand bg-brand/[0.02]' : ''}`}
                  >
                    {/* Icon badge — matches image-5 list item style */}
                    <div className={`w-9 h-9 rounded-xl ${bg} ${border} border flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${bg} ${text} ${border}`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{log.model_ref}:{log.record_id}</span>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                      </div>
                      <p className="text-sm text-ink mt-1 leading-relaxed">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <UserCircle className="w-3.5 h-3.5" />
                          UID-{log.user_id}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface/30">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} entries
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
