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
import { HandWrittenTitle } from '../components/ui/HandWrittenTitle';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import RippleButton from '../components/ui/RippleButton';
import Pagination from '../components/ui/Pagination';

const PAGE_SIZE_ALLOC = 10;
const PAGE_SIZE_TRANS = 10;

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
  
  // Pagination
  const [allocPage, setAllocPage] = useState(1);
  const [transPage, setTransPage] = useState(1);

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
  const paginatedAllocs = activeAllocations.slice((allocPage - 1) * PAGE_SIZE_ALLOC, allocPage * PAGE_SIZE_ALLOC);
  const totalAllocPages = Math.ceil(activeAllocations.length / PAGE_SIZE_ALLOC);

  const paginatedTransfers = transfers.slice((transPage - 1) * PAGE_SIZE_TRANS, transPage * PAGE_SIZE_TRANS);
  const totalTransPages = Math.ceil(transfers.length / PAGE_SIZE_TRANS);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
        <HandWrittenTitle 
          title="Custody & Allocations" 
          subtitle="Track custody allocations, check in returned assets, or initiate peer-to-peer transfers."
        />
        <div className="flex gap-3 justify-center mt-4">
          {user?.role !== 'Employee' && (
            <RippleButton 
              variant="primary"
              onClick={() => setShowAllocModal(true)}
            >
              <KeyRound className="w-4 h-4" />
              Allocate Asset
            </RippleButton>
          )}
          <RippleButton 
            variant="secondary"
            onClick={() => setShowTransferModal(true)}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Request Transfer
          </RippleButton>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIVE ALLOCATIONS */}
          <div className="bg-white border border-line rounded-2xl flex flex-col shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface/30">
              <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand" /> Active Allocations
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-surface px-2.5 py-1 rounded-full border border-line">
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
                  {paginatedAllocs.map(alloc => {
                    const assetObj = assets.find(a => a.id === alloc.asset_id);
                    const empObj = employees.find(e => e.id === alloc.employee_id);
                    const isOverdue = alloc.state === 'overdue';
                    
                    return (
                      <div key={alloc.id} className="p-5 flex flex-col gap-4 hover:bg-surface transition group">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AssetTagChip tag={assetObj?.tag || 'UNK'} />
                              <span className="text-sm font-bold text-ink">{assetObj?.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <User className="w-3.5 h-3.5" />
                              Custodian: <span className="font-medium text-ink">{empObj?.name}</span>
                            </div>
                          </div>
                          {user?.role !== 'Employee' && (
                            <RippleButton 
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowReturnModal(alloc)}
                            >
                              Check In
                            </RippleButton>
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
            {totalAllocPages > 1 && (
              <div className="p-4 border-t border-line flex justify-center bg-surface/30">
                <Pagination page={allocPage} totalPages={totalAllocPages} onPageChange={setAllocPage} />
              </div>
            )}
          </div>

          {/* CUSTODY TRANSFERS */}
          <div className="bg-white border border-line rounded-2xl flex flex-col shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface/30">
              <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-brand" /> Custody Transfer Requests
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-surface px-2.5 py-1 rounded-full border border-line">
                {transfers.length} total
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] p-0">
              {transfers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                  <ArrowLeftRight className="w-8 h-8 text-gray-300" />
                  No transfer requests raised yet.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {paginatedTransfers.map(transfer => {
                    const assetObj = assets.find(a => a.id === transfer.asset_id);
                    const sourceObj = employees.find(e => e.id === transfer.source_holder_id);
                    const targetObj = employees.find(e => e.id === transfer.target_holder_id);
                    
                    const isPending = transfer.state === 'Requested';
                    const canApprove = isPending && (user?.role === 'Admin' || user?.id === transfer.target_holder_id);

                    return (
                      <div key={transfer.id} className="p-5 flex flex-col gap-3 hover:bg-surface transition">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-xs font-semibold text-brand tracking-wide">
                              TRANSFER REQUEST
                            </span>
                            <h4 className="font-semibold text-ink text-sm truncate">{assetObj?.name || 'Asset'}</h4>
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                              <span className="font-medium text-gray-700">{sourceObj?.name || 'Sender'}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <span className="font-medium text-gray-700">{targetObj?.name || 'Recipient'}</span>
                            </div>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0
                            ${transfer.state === 'Requested' ? 'bg-amber/10 text-amber border-amber/20' : ''}
                            ${transfer.state === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${transfer.state === 'Rejected' ? 'bg-red-50 text-rust border-red-200' : ''}
                          `}>
                            {transfer.state}
                          </span>
                        </div>

                        {transfer.reason && (
                          <p className="text-xs text-gray-500 italic bg-surface/50 p-2.5 rounded-lg border border-line/50 leading-relaxed">
                            "{transfer.reason}"
                          </p>
                        )}

                        {canApprove && (
                          <div className="flex gap-2 justify-end mt-1">
                            <RippleButton 
                              variant="danger" 
                              size="sm"
                              onClick={() => processTransferAction(transfer.id, 'reject')}
                            >
                              Reject
                            </RippleButton>
                            <RippleButton 
                              variant="primary" 
                              size="sm"
                              onClick={() => processTransferAction(transfer.id, 'approve')}
                            >
                              Approve
                            </RippleButton>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {totalTransPages > 1 && (
              <div className="p-4 border-t border-line flex justify-center bg-surface/30">
                <Pagination page={transPage} totalPages={totalTransPages} onPageChange={setTransPage} />
              </div>
            )}
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

               <div className="relative">
                 <AnimatedSelect
                   label="Select Asset"
                   required
                   placeholder="Search and select asset..."
                   options={assets.map(a => ({ value: String(a.id), label: `${a.name} (${a.tag}) - ${a.status}` }))}
                   value={allocAsset}
                   onChange={(val) => { setAllocAsset(val); setAllocConflict(null); }}
                 />
               </div>

               <div className="relative">
                 <AnimatedSelect
                   label="Select Custodian Employee"
                   required
                   placeholder="Search and select employee..."
                   options={employees.map(emp => ({ value: String(emp.id), label: emp.name }))}
                   value={allocEmployee}
                   onChange={setAllocEmployee}
                 />
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

               <div className="relative">
                 <AnimatedSelect
                   label="Condition at Allocation"
                   options={[
                     { value: 'New',  label: 'New' },
                     { value: 'Good', label: 'Good' },
                     { value: 'Fair', label: 'Fair' },
                     { value: 'Poor', label: 'Poor' },
                   ]}
                   value={allocCondition}
                   onChange={setAllocCondition}
                 />
               </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setShowAllocModal(false)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary" disabled={!!allocConflict}>Confirm Allocation</RippleButton>
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

              <div className="relative">
                <AnimatedSelect
                  label="Select Allocated Asset"
                  required
                  placeholder="Select asset..."
                  options={assets.filter(a => a.status === 'Allocated').map(a => ({ value: String(a.id), label: `${a.name} (${a.tag})` }))}
                  value={transferAsset}
                  onChange={setTransferAsset}
                />
              </div>

              <div className="relative">
                <AnimatedSelect
                  label="Select Recipient Employee"
                  required
                  placeholder="Select recipient..."
                  options={employees.filter(e => e.id !== user?.id).map(emp => ({ value: String(emp.id), label: emp.name }))}
                  value={transferTarget}
                  onChange={setTransferTarget}
                />
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
                <RippleButton type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary">Submit Transfer</RippleButton>
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

              <div className="relative">
                <AnimatedSelect
                  label="Condition at Return"
                  options={[
                    { value: 'New',     label: 'New' },
                    { value: 'Good',    label: 'Good' },
                    { value: 'Fair',    label: 'Fair' },
                    { value: 'Poor',    label: 'Poor' },
                    { value: 'Damaged', label: 'Damaged' },
                  ]}
                  value={returnCondition}
                  onChange={setReturnCondition}
                />
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
                <RippleButton type="button" variant="secondary" onClick={() => setShowReturnModal(null)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary">Complete Return</RippleButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Allocations;
