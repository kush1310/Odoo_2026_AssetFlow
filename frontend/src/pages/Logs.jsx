import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Database,
  Lock,
  UserCircle,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/Toast';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { addToast } = useToast();
  
  // Simulated "unread" state for demo
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/logs');
        setLogs(res.data);
      } catch (err) {
        addToast("Failed to fetch activity logs.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const markAllRead = () => {
    setHasUnread(false);
    addToast("All logs marked as read.", "success");
  };

  const tabs = [
    { id: 'all', label: 'All Activity', icon: Activity },
    { id: 'system', label: 'System Mutators', icon: Database },
    { id: 'security', label: 'Access & Security', icon: Lock }
  ];

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'all') return true;
    if (activeTab === 'system') return log.action_type === 'UPDATE' || log.action_type === 'DELETE';
    if (activeTab === 'security') return log.action_type === 'CREATE' || log.action_type === 'LOGIN';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            System Audit Logs 
            {hasUnread && (
              <span className="flex h-3 w-3 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">View real-time immutable logs of resource operations and system mutations.</p>
        </div>
        
        <div className="flex gap-3">
          {hasUnread && (
            <button 
              onClick={markAllRead}
              className="btn btn-secondary text-gray-600 border-gray-300 hover:bg-gray-50 bg-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-line px-6 pt-4 bg-surface/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors
                  ${isActive ? 'text-brand' : 'text-gray-500 hover:text-ink'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="logs-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                    initial={false}
                  />
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center flex-1 py-12">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line">
                <tr className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6 w-48">Timestamp</th>
                  <th className="py-3 px-6">Operation</th>
                  <th className="py-3 px-6">Subject Ref</th>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <AnimatePresence>
                  {filteredLogs.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                          <Database className="w-10 h-10 text-gray-200" />
                          <p>No activity logged matching criteria.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredLogs.map((log, index) => {
                      // Determine visual styling for action types
                      let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
                      if (log.action_type === 'CREATE') colorClass = 'bg-green-50 text-green-700 border-green-200';
                      if (log.action_type === 'UPDATE') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (log.action_type === 'DELETE') colorClass = 'bg-red-50 text-rust border-red-200';
                      if (log.action_type === 'LOGIN') colorClass = 'bg-amber/10 text-amber border-amber/20';

                      const isUnread = hasUnread && index < 3; // fake first 3 as unread

                      return (
                        <motion.tr 
                          key={log.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-surface transition ${isUnread ? 'bg-brand/5' : ''}`}
                        >
                          <td className="py-3.5 px-6 font-mono text-xs text-gray-500 flex items-center gap-2">
                            {isUnread && <div className="w-2 h-2 rounded-full bg-brand shrink-0"></div>}
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-mono text-xs text-gray-600">
                            {log.model_ref}:{log.record_id}
                          </td>
                          <td className="py-3.5 px-6 text-gray-600 flex items-center gap-2 text-xs">
                            <UserCircle className="w-4 h-4 text-gray-400" />
                            UID-{log.user_id}
                          </td>
                          <td className="py-3.5 px-6 text-ink text-sm">
                            {log.description}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
