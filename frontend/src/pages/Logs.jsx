import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, ShieldCheck } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } catch (err) {
        setError("Failed to fetch activity logs.");
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-white">System Activity Logs</h2>
        <p className="text-xs text-slate-400">View real-time immutable logs of resource operations and system mutations.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/45 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-indigo-400" />
          <span>Operations Audit Trail</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">No activity logged in database.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-4 text-slate-450">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-indigo-400 uppercase tracking-wider">{log.action_type}</td>
                    <td className="py-3 px-4 text-slate-350">{log.model_ref}:{log.record_id}</td>
                    <td className="py-3 px-4 text-slate-400">UID-{log.user_id}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans leading-relaxed">"{log.description}"</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
