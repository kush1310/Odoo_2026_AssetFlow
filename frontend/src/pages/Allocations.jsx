import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyRound, 
  ArrowLeftRight, 
  RefreshCw,
  User,
  Package,
  Calendar,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../components/Toast';
import AssetTagChip from '../components/AssetTagChip';

const Allocations = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Forms
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocAsset, setAllocAsset] = useState('');
  const [allocEmployee, setAllocEmployee] = useState('');
  const [allocDate, setAllocDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocExpectedReturn, setAllocExpectedReturn] = useState('');
  const [allocCondition, setAllocCondition] = useState('Good');
  const [allocConflict, setAllocConflict] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAsset, setTransferAsset] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [showReturnModal, setShowReturnModal] = useState(null);
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const loadData = async () => {
    try {
      const [resAssets, resEmps, resAllocs, resTrans] = await Promise.all([
        api.get('/assets'),
        api.get('/employees'),
        api.get('/allocations'),
        api.get('/transfers')
      ]);

      setAssets(resAssets.data);
      setEmployees(resEmps.data);
      setAllocations(resAllocs.data);
      setTransfers(resTrans.data);
    } catch (err) {
      addToast("Failed to load custody data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setAllocConflict(null);
    
    // Client-side quick check, though backend will 409
    const assetObj = assets.find(a => a.id === parseInt(allocAsset));
    if (assetObj && assetObj.status !== 'Available') {
      setAllocConflict({
        message: `Asset ${assetObj.tag} is currently ${assetObj.status}.`,
        assetId: assetObj.id
      });
      return;
    }

    try {
      await api.post('/allocations', {
        asset_id: parseInt(allocAsset),
        employee_id: parseInt(allocEmployee),
        allocation_date: allocDate,
        expected_return_date: allocExpectedReturn || null,
        condition_at_allocation: allocCondition
      });
      addToast("Asset successfully allocated!", "success");
      setShowAllocModal(false);
      resetAllocForm();
      loadData();
    } catch (err) {
      if (err.response?.status === 409) {
        setAllocConflict({
          message: err.response.data.detail || "Asset is already allocated to someone else.",
          assetId: parseInt(allocAsset)
        });
      } else {
        addToast(err.response?.data?.detail || "Allocation failed.", "error");
      }
    }
  };

  const resetAllocForm = () => {
    setAllocAsset('');
    setAllocEmployee('');
    setAllocExpectedReturn('');
    setAllocConflict(null);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${showReturnModal.id}/return`, {
        condition_at_return: returnCondition,
        checkin_notes: returnNotes
      });
      addToast("Asset return check-in complete!", "success");
      setShowReturnModal(null);
      setReturnNotes('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Return submission failed.", "error");
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transfers', {
        asset_id: parseInt(transferAsset),
        target_holder_id: parseInt(transferTarget),
        reason: transferReason
      });
      addToast("Transfer request successfully raised. Awaiting approval.", "success");
      setShowTransferModal(false);
      setTransferAsset('');
      setTransferTarget('');
      setTransferReason('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Transfer request failed.", "error");
    }
  };

  const processTransferAction = async (transferId, action) => {
    try {
      await api.post(`/transfers/${transferId}/${action}`);
      addToast(`Transfer request ${action}ed successfully!`, "success");
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Action failed.", "error");
    }
  };

  const switchToTransfer = (assetId) => {
    setShowAllocModal(false);
    resetAllocForm();
    setTransferAsset(assetId.toString());
    setShowTransferModal(true);
  };

  const activeAllocations = allocations.filter(a => a.state === 'approved' || a.state === 'overdue');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Custody & Allocations</h2>
          <p className="text-sm text-slate-400 font-medium">Track custody allocations, check in returned assets, or initiate peer-to-peer transfers.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          {user?.role !== 'Employee' && (
            <button 
              onClick={() => setShowAllocModal(true)}
              className="btn btn-primary"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Allocate Asset
            </button>
          )}
          <button 
            onClick={() => setShowTransferModal(true)}
            className="btn btn-secondary"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2 text-brand" />
            Request Transfer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIVE ALLOCATIONS */}
          <div className="bg-white border border-slate-100 rounded-2xl flex flex-col shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand" /> Active Allocations
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                {activeAllocations.length} total
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] p-0">
              {activeAllocations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                  <Package className="w-8 h-8 text-gray-300" />
                  No active allocations found.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {activeAllocations.map(alloc => {
                    const assetObj = assets.find(a => a.id === alloc.asset_id);
                    const empObj = employees.find(e => e.id === alloc.employee_id);
                    const isOverdue = alloc.state === 'overdue';
                    
                    return (
                      <div key={alloc.id} className="p-5 flex flex-col gap-4 hover:bg-surface transition group">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AssetTagChip tag={alloc.asset_tag || 'UNK'} />
                              <span className="text-sm font-bold text-ink">{alloc.asset_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <User className="w-3.5 h-3.5" />
                              Custodian: <span className="font-medium text-ink">{alloc.employee_name}</span>
                            </div>
                          </div>
                          {user?.role !== 'Employee' && (
                            <button 
                              onClick={() => setShowReturnModal(alloc)}
                              className="btn btn-secondary px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              Return Check-in
                            </button>
                          )}
                        </div>

                        {/* Visual Timeline Component */}
                        <div className="mt-2 relative">
                          <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-line rounded-full z-0"></div>
                          <div className="flex justify-between relative z-10">
                            <div className="flex flex-col items-start gap-1 w-1/3">
                              <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center ring-4 ring-white">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[10px] font-semibold text-gray-500 uppercase">Allocated</span>
                              <span className="text-[10px] font-medium text-ink">{alloc.allocation_date}</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-1 w-1/3">
                              <div className="w-5 h-5 rounded-full bg-surface border-2 border-brand flex items-center justify-center ring-4 ring-white">
                                <Clock className="w-3 h-3 text-brand" />
                              </div>
                              <span className="text-[10px] font-semibold text-gray-500 uppercase">In Use</span>
                              <span className="text-[10px] font-medium text-ink">{allocCondition}</span>
                            </div>

                            <div className="flex flex-col items-end gap-1 w-1/3 text-right">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${isOverdue ? 'bg-rust border-2 border-rust' : 'bg-surface border-2 border-gray-300'}`}>
                                {isOverdue ? <AlertTriangle className="w-3 h-3 text-white" /> : <Calendar className="w-3 h-3 text-gray-400" />}
                              </div>
                              <span className={`text-[10px] font-semibold uppercase ${isOverdue ? 'text-rust' : 'text-gray-500'}`}>Return</span>
                              <span className={`text-[10px] font-medium ${isOverdue ? 'text-rust' : 'text-ink'}`}>
                                {alloc.expected_return_date || "Open Ended"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CUSTODY TRANSFERS */}
          <div className="bg-white border border-slate-100 rounded-2xl flex flex-col shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-brand" /> Custody Transfer Requests
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                {transfers.length} total
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] p-0">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                  <ArrowLeftRight className="w-8 h-8 text-gray-300" />
                  No transfer requests pending.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {transfers.map(trans => {
                    const assetObj = assets.find(a => a.id === trans.asset_id);
                    const fromObj = employees.find(e => e.id === trans.source_holder_id);
                    const toObj = employees.find(e => e.id === trans.target_holder_id);
                    return (
                      <div key={trans.id} className="p-5 flex flex-col gap-4 hover:bg-surface transition">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <AssetTagChip tag={trans.asset_tag || 'UNK'} />
                              <span className="text-sm font-bold text-ink">{trans.asset_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-1 bg-white border border-line rounded-lg p-2.5 shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-semibold uppercase">From</span>
                                <span className="text-xs font-medium text-ink">{trans.source_holder_name || 'Unknown'}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-brand font-semibold uppercase">To Recipient</span>
                                <span className="text-xs font-medium text-ink">{trans.target_holder_name || 'Unknown'}</span>
                              </div>
                            </div>
                            
                            {trans.reason && (
                              <p className="text-xs text-gray-600 bg-gray-50 border-l-2 border-gray-300 p-2 italic mt-1">
                                "{trans.reason}"
                              </p>
                            )}
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                            ${trans.state === 'Requested' ? 'bg-amber/10 text-amber border-amber/20' : ''}
                            ${trans.state === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${trans.state === 'Rejected' ? 'bg-red-50 text-rust border-red-200' : ''}
                          `}>
                            {trans.state}
                          </span>
                        </div>

                        {trans.state === 'Requested' && user?.role !== 'Employee' && (
                          <div className="flex justify-end gap-2 pt-3 border-t border-line mt-1">
                            <button 
                              onClick={() => processTransferAction(trans.id, 'reject')}
                              className="btn btn-secondary text-rust border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => processTransferAction(trans.id, 'approve')}
                              className="btn bg-brand text-white hover:bg-brand-deep px-3 py-1.5 text-xs"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALLOCATION MODAL */}
      <AnimatePresence>
        {showAllocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowAllocModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAllocate} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Create Asset Allocation</h3>
                <button type="button" onClick={() => setShowAllocModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              <AnimatePresence mode="wait">
                {allocConflict && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-orange-50 border border-amber/30 rounded-xl flex flex-col gap-3 overflow-hidden"
                  >
                    <div className="flex gap-3 text-sm text-ink font-medium">
                      <AlertTriangle className="w-5 h-5 text-amber shrink-0" />
                      <p>{allocConflict.message}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => switchToTransfer(allocConflict.assetId)}
                      className="btn bg-white border border-amber/30 text-amber hover:bg-amber/10 w-full text-xs shadow-sm"
                    >
                      Request Transfer Instead <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="label">Select Asset</label>
                <select 
                  required value={allocAsset} onChange={(e) => {setAllocAsset(e.target.value); setAllocConflict(null);}}
                  className="input-field"
                >
                  <option value="">Search and select...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.tag}) - {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Select Custodian Employee</label>
                <select 
                  required value={allocEmployee} onChange={(e) => setAllocEmployee(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Allocation Date</label>
                <input 
                  type="date" required value={allocDate} onChange={(e) => setAllocDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Expected Return Date (Optional)</label>
                <input 
                  type="date" value={allocExpectedReturn} onChange={(e) => setAllocExpectedReturn(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Condition at Allocation</label>
                <select 
                  value={allocCondition} onChange={(e) => setAllocCondition(e.target.value)}
                  className="input-field"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowAllocModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!allocConflict}>Confirm Allocation</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSFER MODAL */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowTransferModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleRequestTransfer} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Request Custody Transfer</h3>
                <button type="button" onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              <div>
                <label className="label">Select Allocated Asset</label>
                <select 
                  required value={transferAsset} onChange={(e) => setTransferAsset(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Asset</option>
                  {assets.filter(a => a.status === 'Allocated').map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Select Recipient Employee</label>
                <select 
                  required value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Recipient</option>
                  {employees.filter(e => e.id !== user?.id).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reason for Transfer</label>
                <textarea 
                  required value={transferReason} onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Reallocation due to project transition..." rows="3"
                  className="input-field h-auto py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Transfer</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* RETURN MODAL */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowReturnModal(null)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleReturn} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Asset Return Check-in</h3>
                <button type="button" onClick={() => setShowReturnModal(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Confirm returned asset details and record check-in notes.</p>

              <div>
                <label className="label">Condition at Return</label>
                <select 
                  value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}
                  className="input-field"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="label">Check-in Notes</label>
                <textarea 
                  value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Checklist or hardware verification details..." rows="3"
                  className="input-field h-auto py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowReturnModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Return</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Allocations;
