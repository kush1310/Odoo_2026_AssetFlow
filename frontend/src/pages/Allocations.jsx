import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  KeyRound, 
  ArrowLeftRight, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck,
  User,
  Package,
  Calendar,
  ClipboardList
} from 'lucide-react';

const Allocations = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forms
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocAsset, setAllocAsset] = useState('');
  const [allocEmployee, setAllocEmployee] = useState('');
  const [allocDate, setAllocDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocExpectedReturn, setAllocExpectedReturn] = useState('');
  const [allocCondition, setAllocCondition] = useState('Good');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAsset, setTransferAsset] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [showReturnModal, setShowReturnModal] = useState(null); // Holds allocation record to return
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resAssets, resEmps, resAllocs, resTrans] = await Promise.all([
        axios.get('http://localhost:8000/api/assets', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers }),
        axios.get('http://localhost:8000/api/allocations', { headers }),
        axios.get('http://localhost:8000/api/transfers', { headers })
      ]);

      setAssets(resAssets.data);
      setEmployees(resEmps.data);
      setAllocations(resAllocs.data);
      setTransfers(resTrans.data);
    } catch (err) {
      setError("Failed to load custody data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Client-side conflict check: check if asset is available
    const assetObj = assets.find(a => a.id === parseInt(allocAsset));
    if (assetObj && assetObj.status !== 'Available') {
      setError(`Double allocation blocked: Asset ${assetObj.tag} is currently ${assetObj.status}. Please raise a Transfer Request instead.`);
      setShowAllocModal(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/allocations', {
        asset_id: parseInt(allocAsset),
        employee_id: parseInt(allocEmployee),
        allocation_date: allocDate,
        expected_return_date: allocExpectedReturn || null,
        condition_at_allocation: allocCondition
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Asset successfully allocated!");
      setShowAllocModal(false);
      setAllocAsset('');
      setAllocEmployee('');
      setAllocExpectedReturn('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Allocation failed.");
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/allocations/${showReturnModal.id}/return`, {
        condition_at_return: returnCondition,
        checkin_notes: returnNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Asset return check-in complete!");
      setShowReturnModal(null);
      setReturnNotes('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Return submission failed.");
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/transfers', {
        asset_id: parseInt(transferAsset),
        target_holder_id: parseInt(transferTarget),
        reason: transferReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Transfer request successfully raised. Awaiting manager approval.");
      setShowTransferModal(false);
      setTransferAsset('');
      setTransferTarget('');
      setTransferReason('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Transfer request failed.");
    }
  };

  const processTransferAction = async (transferId, action) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/transfers/${transferId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Transfer request ${action}ed successfully!`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Custody & Allocations</h2>
          <p className="text-xs text-slate-400">Track custody allocations, check in returned assets, or initiate peer-to-peer transfers.</p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'Employee' && (
            <button 
              onClick={() => setShowAllocModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Allocate Asset</span>
            </button>
          )}
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Request Transfer</span>
          </button>
        </div>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVE ALLOCATIONS */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200">Active Allocations</h3>
          <div className="flex-1 overflow-y-auto max-h-96 flex flex-col gap-4">
            {allocations.filter(a => a.state === 'approved' || a.state === 'overdue').length === 0 ? (
              <span className="text-slate-500 text-xs py-6 text-center">No active allocations found.</span>
            ) : (
              allocations.filter(a => a.state === 'approved' || a.state === 'overdue').map(alloc => {
                const assetObj = assets.find(a => a.id === alloc.asset_id);
                const empObj = employees.find(e => e.id === alloc.employee_id);
                return (
                  <div key={alloc.id} className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-200">Asset: {assetObj?.name || `ID ${alloc.asset_id}`} ({assetObj?.tag})</span>
                      <span className="text-[10px] text-slate-400">Custodian: {empObj?.name || `ID ${alloc.employee_id}`}</span>
                      <span className="text-[10px] text-slate-500">Expected Return: {alloc.expected_return_date || "Open Ended"}</span>
                    </div>
                    {user?.role !== 'Employee' && (
                      <button 
                        onClick={() => setShowReturnModal(alloc)}
                        className="flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-900/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Return Check-in</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CUSTODY TRANSFERS */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200">Custody Transfer Requests</h3>
          <div className="flex-1 overflow-y-auto max-h-96 flex flex-col gap-4">
            {transfers.length === 0 ? (
              <span className="text-slate-500 text-xs py-6 text-center">No transfer requests pending.</span>
            ) : (
              transfers.map(trans => {
                const assetObj = assets.find(a => a.id === trans.asset_id);
                const fromObj = employees.find(e => e.id === trans.source_holder_id);
                const toObj = employees.find(e => e.id === trans.target_holder_id);
                return (
                  <div key={trans.id} className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-250">Transfer Asset: {assetObj?.name || `ID ${trans.asset_id}`} ({assetObj?.tag})</span>
                        <span className="text-[10px] text-slate-400">Current: {fromObj?.name} → Recipient: {toObj?.name}</span>
                        {trans.reason && <span className="text-[10px] text-slate-500 italic mt-1">Reason: "{trans.reason}"</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border
                        ${trans.state === 'Requested' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800' : ''}
                        ${trans.state === 'Approved' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800' : ''}
                        ${trans.state === 'Rejected' ? 'bg-red-950/30 text-red-400 border-red-800' : ''}
                      `}>
                        {trans.state}
                      </span>
                    </div>

                    {trans.state === 'Requested' && user?.role !== 'Employee' && (
                      <div className="flex justify-end gap-2 border-t border-slate-800/60 pt-2.5">
                        <button 
                          onClick={() => processTransferAction(trans.id, 'reject')}
                          className="bg-red-950/30 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/60 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => processTransferAction(trans.id, 'approve')}
                          className="bg-emerald-950/30 hover:bg-emerald-900 text-emerald-400 hover:text-white border border-emerald-900/60 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ALLOCATION MODAL */}
      {showAllocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleAllocate} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Asset Allocation</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Available Asset</label>
              <select 
                required
                value={allocAsset} 
                onChange={(e) => setAllocAsset(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Asset</option>
                {assets.filter(a => a.status === 'Available').map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Custodian Employee</label>
              <select 
                required
                value={allocEmployee} 
                onChange={(e) => setAllocEmployee(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Allocation Date</label>
              <input 
                type="date" 
                required
                value={allocDate} 
                onChange={(e) => setAllocDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Expected Return Date (Optional)</label>
              <input 
                type="date" 
                value={allocExpectedReturn} 
                onChange={(e) => setAllocExpectedReturn(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Condition at Allocation</label>
              <select 
                value={allocCondition} 
                onChange={(e) => setAllocCondition(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowAllocModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleRequestTransfer} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Request Custody Transfer</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Allocated Asset</label>
              <select 
                required
                value={transferAsset} 
                onChange={(e) => setTransferAsset(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Asset</option>
                {assets.filter(a => a.status === 'Allocated').map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Recipient Employee</label>
              <select 
                required
                value={transferTarget} 
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Recipient</option>
                {employees.filter(e => e.id !== user?.id).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Reason for Transfer</label>
              <textarea 
                required
                value={transferReason} 
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Asset reallocation due to project transition..."
                rows="3"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Submit Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleReturn} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Asset Return Check-in</h3>
            <p className="text-xs text-slate-400">Confirm returned asset details and record check-in notes.</p>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-400">Condition at Return</label>
              <select 
                value={returnCondition} 
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Check-in Notes</label>
              <textarea 
                value={returnNotes} 
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Checklist or hardware verification details..."
                rows="3"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowReturnModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Complete Return
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Allocations;
