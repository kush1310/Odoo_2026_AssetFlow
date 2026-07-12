import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Plus, 
  Check, 
  AlertTriangle, 
  X,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../components/Toast';
import AssetTagChip from '../components/AssetTagChip';

const Audits = ({ user }) => {
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Active Cycle detail view
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleLines, setCycleLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(false);

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
      const [resCycles, resDepts, resEmps, resAssets] = await Promise.all([
        api.get('/audits'),
        api.get('/departments'),
        api.get('/employees'),
        api.get('/assets')
      ]);

      setCycles(resCycles.data);
      setDepartments(resDepts.data);
      setEmployees(resEmps.data);
      setAssets(resAssets.data);
    } catch (err) {
      addToast("Failed to load audit logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCycleLines = async (cycleId) => {
    setLinesLoading(true);
    try {
      const res = await api.get(`/audits/${cycleId}/lines`);
      setCycleLines(res.data);
    } catch (err) {
      addToast("Failed to load audit items.", "error");
    } finally {
      setLinesLoading(false);
    }
  };

  const handleSelectCycle = (cycle) => {
    setSelectedCycle(cycle);
    loadCycleLines(cycle.id);
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (selectedAuditors.length === 0) {
      addToast("Please assign at least one auditor.", "error");
      return;
    }

    try {
      await api.post('/audits', {
        name: cycleName,
        scope_department_id: scopeDept ? parseInt(scopeDept) : null,
        scope_location: scopeLocation || null,
        start_date: startDate,
        end_date: endDate,
        auditor_ids: selectedAuditors.map(id => parseInt(id))
      });
      addToast("Audit verification cycle initiated!", "success");
      setShowCreateModal(false);
      setCycleName('');
      setScopeDept('');
      setScopeLocation('');
      setStartDate('');
      setEndDate('');
      setSelectedAuditors([]);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Initiating cycle failed.", "error");
    }
  };

  const handleVerifyLine = async (lineId, result, notes = "") => {
    try {
      // Optimistic update
      setCycleLines(prev => prev.map(l => l.id === lineId ? { ...l, result, notes } : l));
      
      await api.put(`/audits/${selectedCycle.id}/lines/${lineId}`, { result, notes });
      addToast(`Asset marked as ${result}.`, "success");
    } catch (err) {
      addToast(err.response?.data?.detail || "Verification failed.", "error");
      loadCycleLines(selectedCycle.id); // revert on failure
    }
  };

  const closeCycle = async () => {
    // Check client-side for unverified lines
    const unverified = cycleLines.filter(line => !line.result);
    if (unverified.length > 0) {
      addToast(`Cannot close cycle. ${unverified.length} items awaiting verification.`, "error");
      return;
    }

    try {
      const res = await api.post(`/audits/${selectedCycle.id}/close`);
      addToast(`Audit closed! Discrepancies: ${res.data.missing} missing, ${res.data.damaged} damaged.`, "success");
      setSelectedCycle(null);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Close request failed.", "error");
    }
  };

  const handleAuditorToggle = (id) => {
    setSelectedAuditors(prev => 
      prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
    );
  };

  // UI state for verification list
  const unverifiedCount = cycleLines.filter(l => !l.result).length;
  const verifiedCount = cycleLines.filter(l => l.result === 'Verified').length;
  const discrepancyCount = cycleLines.filter(l => l.result === 'Missing' || l.result === 'Damaged').length;
  const totalCount = cycleLines.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round(((totalCount - unverifiedCount) / totalCount) * 100);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Physical Auditing</h2>
          <p className="text-sm text-gray-500">Initiate inventory reconciliations, assign auditors, and handle discrepancy reporting.</p>
        </div>
        
        {user?.role === 'Admin' && !selectedCycle && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Audit Cycle
          </button>
        )}
        {selectedCycle && (
          <button 
            onClick={() => setSelectedCycle(null)}
            className="btn btn-secondary whitespace-nowrap"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Verification
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !selectedCycle ? (
        <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-surface/30">
            <h3 className="font-bold text-ink text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-brand" /> Reconciliation Cycles
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line">
                <tr className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Cycle Name</th>
                  <th className="py-3 px-6">Department Scope</th>
                  <th className="py-3 px-6">Location Scope</th>
                  <th className="py-3 px-6">Timeline</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cycles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500 text-sm">No audits initiated yet.</td>
                  </tr>
                ) : (
                  cycles.map(cycle => {
                    const deptObj = departments.find(d => d.id === cycle.scope_department_id);
                    return (
                      <tr key={cycle.id} className="hover:bg-surface transition">
                        <td className="py-4 px-6 font-bold text-ink">{cycle.name}</td>
                        <td className="py-4 px-6 text-gray-600">{deptObj?.name || "Global Scope"}</td>
                        <td className="py-4 px-6 text-gray-600 flex items-center gap-1">
                          {cycle.scope_location || "Global Scope"}
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-xs">{cycle.start_date} <span className="text-gray-400">to</span> {cycle.end_date}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider
                            ${cycle.status === 'In Progress' ? 'bg-amber/10 text-amber border-amber/20' : ''}
                            ${cycle.status === 'Closed' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}
                          `}>
                            {cycle.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => handleSelectCycle(cycle)}
                            className="btn btn-secondary text-brand border-brand/20 hover:bg-brand/5 px-3 py-1.5 text-xs"
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
        /* ACTIVE VERIFICATION CYCLE */
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Header & Progress Stats */}
            <div className="bg-white border border-line p-6 rounded-2xl shadow-sm flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span> Active Cycle
                  </span>
                  <h3 className="text-xl font-bold text-ink">{selectedCycle.name}</h3>
                </div>
                {user?.role === 'Admin' && selectedCycle.status !== 'Closed' && (
                  <button 
                    onClick={closeCycle}
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-emerald-600/20 shadow-lg text-white"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Reconcile & Close Cycle
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Verification Progress</span>
                  <span>{progressPercent}% Complete ({totalCount - unverifiedCount}/{totalCount})</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(verifiedCount / totalCount) * 100}%` }}></div>
                  <div className="bg-amber h-full transition-all duration-500" style={{ width: `${(discrepancyCount / totalCount) * 100}%` }}></div>
                </div>
                <div className="flex gap-4 text-xs font-medium text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified ({verifiedCount})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber"></span> Discrepancies ({discrepancyCount})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Pending ({unverifiedCount})</span>
                </div>
              </div>
            </div>

            {/* AUTO-GENERATED DISCREPANCIES SUMMARY BOX FOR CLOSED CYCLES */}
            {selectedCycle.status === 'Closed' && selectedCycle.discrepancy_report && (() => {
              try {
                const report = JSON.parse(selectedCycle.discrepancy_report);
                return (
                  <div className="bg-amber-50/50 border border-amber/20 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center gap-2 text-amber border-b border-amber/10 pb-3">
                      <AlertTriangle className="w-5 h-5 text-amber" />
                      <h4 className="font-bold text-sm text-ink uppercase tracking-wider">Auto-Generated Discrepancy Audit Report</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium">Reconciled By</span>
                        <p className="font-bold text-ink mt-0.5">{report.closed_by || "System Admin"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Close Date</span>
                        <p className="font-bold text-ink mt-0.5">{report.close_date}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Assets Audited</span>
                        <p className="font-bold text-ink mt-0.5">{report.total_assets}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Discrepancies Flagged</span>
                        <p className="font-bold text-rust mt-0.5 font-mono">{report.discrepancies?.length || 0}</p>
                      </div>
                    </div>

                    {report.discrepancies?.length > 0 ? (
                      <div className="overflow-x-auto border border-line rounded-xl mt-2 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-surface border-b border-line text-gray-500 font-semibold uppercase tracking-wider text-[9px]">
                            <tr>
                              <th className="py-2.5 px-4">Asset Tag</th>
                              <th className="py-2.5 px-4">Asset Name</th>
                              <th className="py-2.5 px-4">Expected Location</th>
                              <th className="py-2.5 px-4">Audit Result</th>
                              <th className="py-2.5 px-4">Notes / Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line font-medium text-gray-600">
                            {report.discrepancies.map((disc, dIdx) => (
                              <tr key={`disc-${dIdx}`} className="hover:bg-surface/50">
                                <td className="py-2.5 px-4 font-mono font-bold text-ink">{disc.asset_tag}</td>
                                <td className="py-2.5 px-4">{disc.asset_name}</td>
                                <td className="py-2.5 px-4">{disc.expected_location}</td>
                                <td className="py-2.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider
                                    ${disc.result === 'Missing' ? 'bg-red-50 text-rust border-red-200' : 'bg-amber/10 text-amber border-amber/20'}
                                  `}>
                                    {disc.result}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 italic text-gray-500">"{disc.notes || 'No notes provided'}"</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-line rounded-xl text-center text-xs text-gray-500 font-medium">
                        No physical location or status discrepancies were flagged during this reconciliation cycle.
                      </div>
                    )}
                  </div>
                );
              } catch (e) {
                return null;
              }
            })()}

            {/* Checklist Grid */}
            <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
              <div className="px-6 py-4 border-b border-line bg-surface/30 flex justify-between items-center">
                <h4 className="font-bold text-sm text-ink flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand" /> Verification Checklist
                </h4>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Filter tags..." className="input-field pl-9 py-1.5 h-8 text-xs w-48" />
                </div>
              </div>

              {linesLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {cycleLines.map(line => {
                    const assetObj = assets.find(a => a.id === line.asset_id);
                    const auditorObj = employees.find(e => e.id === line.verified_by_id);
                    const isChecked = !!line.result;

                    return (
                      <div key={line.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition
                        ${isChecked ? 'bg-surface/50' : 'bg-white hover:bg-surface'}
                      `}>
                        <div className="flex items-start md:items-center gap-4 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2
                            ${!isChecked ? 'border-gray-200 bg-surface text-gray-300' : ''}
                            ${line.result === 'Verified' ? 'border-emerald-500 bg-emerald-50 text-emerald-500' : ''}
                            ${line.result === 'Damaged' || line.result === 'Missing' ? 'border-amber bg-orange-50 text-amber' : ''}
                          `}>
                            {!isChecked && <div className="w-2 h-2 rounded-full bg-gray-300" />}
                            {line.result === 'Verified' && <Check className="w-4 h-4" />}
                            {(line.result === 'Damaged' || line.result === 'Missing') && <AlertTriangle className="w-4 h-4" />}
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <AssetTagChip tag={assetObj?.tag || 'UNK'} />
                              <span className={`font-bold text-sm ${isChecked ? 'text-gray-600 line-through' : 'text-ink'}`}>{assetObj?.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">Location: {assetObj?.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto pl-12 md:pl-0 border-t border-line md:border-t-0 pt-3 md:pt-0">
                          {isChecked && (
                            <div className="flex flex-col items-start md:items-end mr-4">
                              <span className="text-[10px] text-gray-500 font-semibold uppercase">Verified By</span>
                              <span className="text-xs font-medium text-ink">{auditorObj?.name || "-"}</span>
                            </div>
                          )}

                          {selectedCycle.status !== 'Closed' && (
                            <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-line">
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Verified')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5
                                  ${line.result === 'Verified' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}
                                `}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Match
                              </button>
                              <div className="w-px h-4 bg-line"></div>
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Damaged')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5
                                  ${line.result === 'Damaged' ? 'bg-amber text-white shadow-md' : 'text-gray-500 hover:text-amber hover:bg-orange-50'}
                                `}
                              >
                                <AlertCircle className="w-3.5 h-3.5" /> Damaged
                              </button>
                              <button 
                                onClick={() => handleVerifyLine(line.id, 'Missing')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5
                                  ${line.result === 'Missing' ? 'bg-rust text-white shadow-md' : 'text-gray-500 hover:text-rust hover:bg-red-50'}
                                `}
                              >
                                <X className="w-3.5 h-3.5" /> Missing
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleCreateCycle} 
              className="relative w-full max-w-lg bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Create Audit Cycle</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              <div>
                <label className="label">Cycle Name</label>
                <input 
                  type="text" required value={cycleName} onChange={(e) => setCycleName(e.target.value)}
                  placeholder="e.g. Q3 Hardware Reconciliation" className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Scope Department (Optional)</label>
                  <select 
                    value={scopeDept} onChange={(e) => setScopeDept(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Global (All)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Scope Location (Optional)</label>
                  <input 
                    type="text" value={scopeLocation} onChange={(e) => setScopeLocation(e.target.value)}
                    placeholder="e.g. HQ Floor 2" className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input 
                    type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input 
                    type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Assign Auditors</label>
                <div className="p-3 bg-surface border border-line rounded-xl flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {employees.filter(e => e.role !== 'Employee').map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition">
                      <input 
                        type="checkbox" 
                        checked={selectedAuditors.includes(emp.id.toString())}
                        onChange={() => handleAuditorToggle(emp.id.toString())}
                        className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand"
                      />
                      <span className="text-sm text-ink">{emp.name} <span className="text-xs text-gray-500">({emp.role})</span></span>
                    </label>
                  ))}
                  {employees.filter(e => e.role !== 'Employee').length === 0 && (
                    <p className="text-xs text-gray-500 italic">No valid auditors found.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Initiate Audit</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Audits;
