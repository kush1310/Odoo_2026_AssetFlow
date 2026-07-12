import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardCheck, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  X,
  Lock
} from 'lucide-react';

const Audits = ({ user }) => {
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Cycle detail view
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleLines, setCycleLines] = useState([]);

  // Forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [scopeDept, setScopeDept] = useState('');
  const [scopeLocation, setScopeLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState([]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resCycles, resDepts, resEmps, resAssets] = await Promise.all([
        axios.get('http://localhost:8000/api/audits', { headers }),
        axios.get('http://localhost:8000/api/departments', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers }),
        axios.get('http://localhost:8000/api/assets', { headers })
      ]);

      setCycles(resCycles.data);
      setDepartments(resDepts.data);
      setEmployees(resEmps.data);
      setAssets(resAssets.data);
    } catch (err) {
      setError("Failed to load audit logs.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCycleLines = async (cycleId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/audits/${cycleId}/lines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCycleLines(res.data);
    } catch (err) {
      setError("Failed to load audit items.");
    }
  };

  const handleSelectCycle = (cycle) => {
    setSelectedCycle(cycle);
    loadCycleLines(cycle.id);
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (selectedAuditors.length === 0) {
      setError("Please assign at least one auditor.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/audits', {
        name: cycleName,
        scope_department_id: scopeDept ? parseInt(scopeDept) : null,
        scope_location: scopeLocation || null,
        start_date: startDate,
        end_date: endDate,
        auditor_ids: selectedAuditors.map(id => parseInt(id))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Audit verification cycle initiated!");
      setShowCreateModal(false);
      // Reset
      setCycleName('');
      setScopeDept('');
      setScopeLocation('');
      setStartDate('');
      setEndDate('');
      setSelectedAuditors([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Initiating cycle failed.");
    }
  };

  const handleVerifyLine = async (lineId, result, notes = "") => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/audits/${selectedCycle.id}/lines/${lineId}`, {
        result,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Asset verified successfully.");
      loadCycleLines(selectedCycle.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed.");
    }
  };

  const closeCycle = async () => {
    setError('');
    setSuccess('');
    
    // Check client-side for unverified lines
    const unverified = cycleLines.filter(line => !line.result);
    if (unverified.length > 0) {
      setError(`Cannot close cycle. There are still ${unverified.length} assets awaiting verification check-in.`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:8000/api/audits/${selectedCycle.id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Audit cycle closed successfully! Discrepancies logged: ${res.data.missing} missing (flagged Lost), ${res.data.damaged} damaged.`);
      setSelectedCycle(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Close request failed.");
    }
  };

  const handleAuditorSelect = (e) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedAuditors(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Physical Auditing & Reconciliation</h2>
          <p className="text-xs text-slate-400">Initiate inventory reconciliations, assign auditors, and handle discrepancy reporting.</p>
        </div>
        {user?.role === 'Admin' && !selectedCycle && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Audit Cycle</span>
          </button>
        )}
        {selectedCycle && (
          <button 
            onClick={() => setSelectedCycle(null)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <X className="w-4 h-4" />
            <span>Exit Verification</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/45 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/45 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* VIEW SELECTOR */}
      {!selectedCycle ? (
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-200">Reconciliation Cycles</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Cycle Name</th>
                  <th className="py-3 px-4">Department Scope</th>
                  <th className="py-3 px-4">Location Scope</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cycles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">No audits initiated yet.</td>
                  </tr>
                ) : (
                  cycles.map(cycle => {
                    const deptObj = departments.find(d => d.id === cycle.scope_department_id);
                    return (
                      <tr key={cycle.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-250">{cycle.name}</td>
                        <td className="py-3.5 px-4 text-slate-400">{deptObj?.name || "Global Scope"}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">{cycle.scope_location || "Global Scope"}</td>
                        <td className="py-3.5 px-4 text-slate-450">{cycle.start_date} to {cycle.end_date}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider
                            ${cycle.status === 'In Progress' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800' : ''}
                            ${cycle.status === 'Closed' ? 'bg-slate-950/40 text-slate-450 border-slate-850' : ''}
                          `}>
                            {cycle.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => handleSelectCycle(cycle)}
                            className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-900/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            Enter Verification
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ACTIVE VERIFICATION CYCLE GRID */
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-850 p-6 rounded-xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Active Cycle</span>
              <h3 className="text-lg font-bold text-white">{selectedCycle.name}</h3>
            </div>
            {user?.role === 'Admin' && selectedCycle.status !== 'Closed' && (
              <button 
                onClick={closeCycle}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-600/10"
              >
                <Lock className="w-4 h-4" />
                <span>Reconcile & Close Cycle</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-200">Scope Items Grid</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Tag</th>
                    <th className="py-3 px-4">Asset Description</th>
                    <th className="py-3 px-4">Verified By</th>
                    <th className="py-3 px-4">Status Check</th>
                    <th className="py-3 px-4 text-right">Verification Checklist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cycleLines.map(line => {
                    const assetObj = assets.find(a => a.id === line.asset_id);
                    const auditorObj = employees.find(e => e.id === line.verified_by_id);
                    return (
                      <tr key={line.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{assetObj?.tag}</td>
                        <td className="py-3.5 px-4 flex flex-col">
                          <span className="font-semibold text-slate-200">{assetObj?.name}</span>
                          <span className="text-[10px] text-slate-500">Location: {assetObj?.location}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-medium">{auditorObj?.name || "-"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider
                            ${line.result === 'Verified' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800' : ''}
                            ${line.result === 'Missing' ? 'bg-red-950/30 text-red-400 border-red-800' : ''}
                            ${line.result === 'Damaged' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800' : ''}
                            ${!line.result ? 'bg-slate-950/40 text-slate-400 border-slate-850' : ''}
                          `}>
                            {line.result || "Awaiting Check"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                          {selectedCycle.status !== 'Closed' && (
                            <>
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Verified')}
                                className="bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-900/60 px-2 py-1 rounded transition text-[10px] font-bold"
                              >
                                Match
                              </button>
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Damaged')}
                                className="bg-yellow-950/40 hover:bg-yellow-600 text-yellow-400 hover:text-white border border-yellow-900/60 px-2 py-1 rounded transition text-[10px] font-bold"
                              >
                                Damaged
                              </button>
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Missing')}
                                className="bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/60 px-2 py-1 rounded transition text-[10px] font-bold"
                              >
                                Missing
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleCreateCycle} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-base text-white">Create Audit Cycle</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Cycle Name</label>
              <input 
                type="text" 
                required 
                value={cycleName} 
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g. Q3 Hardware Reconciliation"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Scope Department (Optional)</label>
              <select 
                value={scopeDept} 
                onChange={(e) => setScopeDept(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-355"
              >
                <option value="">All Departments (Global)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Scope Location (Optional)</label>
              <input 
                type="text" 
                value={scopeLocation} 
                onChange={(e) => setScopeLocation(e.target.value)}
                placeholder="e.g. Headquarters Floor 2"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Start Date</label>
              <input 
                type="date" 
                required
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">End Date</label>
              <input 
                type="date" 
                required
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Assign Auditor(s) (Hold Ctrl to select multiple)</label>
              <select 
                multiple
                required
                value={selectedAuditors} 
                onChange={handleAuditorSelect}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350 min-h-24"
              >
                {employees.filter(e => e.role !== 'Employee').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Initiate Audit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Audits;
