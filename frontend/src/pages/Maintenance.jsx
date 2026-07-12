import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Plus, 
  UserCheck, 
  Play, 
  CheckCircle2, 
  X,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { HandWrittenTitle } from '../components/ui/HandWrittenTitle';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import RippleButton from '../components/ui/RippleButton';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AssetTagChip from '../components/AssetTagChip';

// Draggable Task Card Component
const SortableTaskCard = ({ req, assetObj, techObj, user, onActionClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: req.id, data: { req } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isAssignedToMe = req.technician_id === user?.id || user?.role !== 'Employee';

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`p-4 bg-white border border-line rounded-xl flex flex-col gap-3 shadow-sm relative group cursor-grab active:cursor-grabbing
        ${isDragging ? 'ring-2 ring-brand shadow-lg' : 'hover:border-brand/30'}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AssetTagChip tag={assetObj?.tag || 'UNK'} />
            <span className="text-xs font-bold text-ink">{assetObj?.name || `Asset ${req.asset_id}`}</span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider w-fit px-1.5 py-0.5 rounded border
            ${req.priority === 'Critical' ? 'bg-red-50 text-rust border-red-200' : ''}
            ${req.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
            ${req.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
            ${req.priority === 'Low' ? 'bg-gray-50 text-gray-500 border-gray-200' : ''}
          `}>
            {req.priority}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-600">"{req.issue_description}"</p>
      
      {(techObj || req.status === 'Assigned' || req.status === 'In Progress') && (
        <div className="text-[10px] text-brand font-semibold flex items-center gap-1">
          <UserCheck className="w-3 h-3" /> Tech: {techObj?.name || "Unassigned"}
        </div>
      )}

      {/* Quick Action Button (won't trigger drag) */}
      <div className="border-t border-line pt-3 mt-1 flex justify-between items-center" onPointerDown={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-gray-400 font-semibold uppercase">{req.status}</span>
        
        {req.status === 'Pending' && user?.role !== 'Employee' && (
          <div className="flex gap-3">
            <button onClick={() => onActionClick('approve', req)} className="text-[10px] font-bold text-brand hover:text-brand-deep">Approve</button>
            <button onClick={() => onActionClick('reject', req)} className="text-[10px] font-bold text-rust hover:text-red-700">Reject</button>
          </div>
        )}
        {req.status === 'Approved' && user?.role !== 'Employee' && (
          <button onClick={() => onActionClick('assign', req)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">Assign</button>
        )}
        {req.status === 'Assigned' && isAssignedToMe && (
          <button onClick={() => onActionClick('start', req)} className="text-[10px] font-bold text-green-600 hover:text-green-800 flex items-center"><Play className="w-3 h-3 mr-1"/> Start</button>
        )}
        {req.status === 'In Progress' && isAssignedToMe && (
          <button onClick={() => onActionClick('resolve', req)} className="text-[10px] font-bold text-teal-600 hover:text-teal-800 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Resolve</button>
        )}
      </div>
    </div>
  );
};


const Maintenance = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [maintAsset, setMaintAsset] = useState('');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintPriority, setMaintPriority] = useState('Low');

  const [assigningReq, setAssigningReq] = useState(null);
  const [assignTech, setAssignTech] = useState('');
  const [assignTime, setAssignTime] = useState('');
  const [assignDuration, setAssignDuration] = useState('60');

  const [resolvingReq, setResolvingReq] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');

  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [customExtendId, setCustomExtendId] = useState(null);
  const [customExtendMins, setCustomExtendMins] = useState('');

  const loadData = async () => {
    try {
      const [resReqs, resAssets, resEmps] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets'),
        api.get('/employees')
      ]);

      setRequests(resReqs.data);
      setAssets(resAssets.data);
      setEmployees(resEmps.data);
    } catch (err) {
      addToast("Failed to load maintenance records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        asset_id: parseInt(maintAsset),
        issue_description: maintDescription,
        priority: maintPriority
      });
      addToast("Maintenance request submitted successfully.", "success");
      setShowRequestModal(false);
      setMaintAsset('');
      setMaintDescription('');
      setMaintPriority('Low');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to submit request.", "error");
    }
  };

  const approveRequest = async (id) => {
    try {
      await api.post(`/maintenance/${id}/approve`);
      addToast("Request approved! Asset status flagged 'Under Maintenance'.", "success");
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Approval failed.", "error");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/maintenance/${assigningReq.id}/assign`, {
        technician_id: parseInt(assignTech),
        scheduled_time: new Date(assignTime).toISOString(),
        duration_minutes: parseInt(assignDuration) || 60
      });
      addToast("Technician assigned to task successfully.", "success");
      setAssigningReq(null);
      setAssignTech('');
      setAssignTime('');
      setAssignDuration('60');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Assignment failed.", "error");
    }
  };

  const startWork = async (id) => {
    try {
      await api.post(`/maintenance/${id}/start`);
      addToast("Work started. Ticket set to In Progress.", "success");
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to start task.", "error");
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/maintenance/${resolvingReq.id}/resolve`, {
        resolution_notes: resolutionNotes,
        parts_replaced: partsReplaced
      });
      addToast("Ticket resolved. Asset returned to Available pool.", "success");
      setResolvingReq(null);
      setResolutionNotes('');
      setPartsReplaced('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Resolution submission failed.", "error");
    }
  };

  const extendTaskSchedule = async (id, minutes) => {
    try {
      await api.post(`/maintenance/${id}/extend`, {
        extension_minutes: parseInt(minutes)
      });
      addToast(`Extended scheduled visit by ${minutes} minutes. Subsequent tasks shifted forward.`, "success");
      setCustomExtendId(null);
      setCustomExtendMins('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Extension failed.", "error");
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/maintenance/${rejectingReq.id}/reject`, {
        rejection_reason: rejectionReason
      });
      addToast("Request rejected successfully.", "success");
      setRejectingReq(null);
      setRejectionReason('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Rejection failed.", "error");
    }
  };

  const handleActionClick = (action, req) => {
    if (action === 'approve') approveRequest(req.id);
    if (action === 'reject') setRejectingReq(req);
    if (action === 'assign') setAssigningReq(req);
    if (action === 'start') startWork(req.id);
    if (action === 'resolve') setResolvingReq(req);
  };

  // Group columns
  const getColItems = (statuses) => {
    return requests.filter(r => statuses.includes(r.status));
  };

  const cols = [
    { id: 'col-pending', title: 'Pending Approval', statuses: ['Pending'] },
    { id: 'col-approved', title: 'Unassigned', statuses: ['Approved'] },
    { id: 'col-assigned', title: 'Technician Assigned', statuses: ['Assigned'] },
    { id: 'col-progress', title: 'In Progress', statuses: ['In Progress'] },
    { id: 'col-resolved', title: 'Resolved', statuses: ['Resolved'] }
  ];

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const req = active.data.current?.req;
    const overId = over.id; // Either a col id or a req id

    if (!req) return;

    let targetColId = null;
    if (cols.find(c => c.id === overId)) {
      targetColId = overId;
    } else {
      // Find which column this req belongs to
      const overReq = requests.find(r => r.id === overId);
      if (overReq) {
        const col = cols.find(c => c.statuses.includes(overReq.status));
        if (col) targetColId = col.id;
      }
    }

    if (!targetColId) return;

    // Check valid transitions based on current status and target column
    if (req.status === 'Pending' && targetColId === 'col-approved') {
      approveRequest(req.id);
    } else if (req.status === 'Approved' && targetColId === 'col-assigned') {
      setAssigningReq(req);
    } else if (req.status === 'Assigned' && targetColId === 'col-progress') {
      startWork(req.id);
    } else if (req.status === 'In Progress' && targetColId === 'col-resolved') {
      setResolvingReq(req);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-line shadow-sm text-center">
        <HandWrittenTitle 
          title="Maintenance Dispatcher" 
          subtitle="Track repair tickets, assign technician specialists, and update lifecycle statuses."
        />
        <div className="mt-4 flex justify-center">
          <RippleButton 
            variant="primary"
            onClick={() => setShowRequestModal(true)}
          >
            <Plus className="w-4 h-4" />
            Raise Repair Ticket
          </RippleButton>
        </div>
      </div>

      {/* TECHNICIAN VISITS SCHEDULER PORTAL */}
      {!loading && (
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 gap-2">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" /> Technician Visits Scheduler & Shift Portal
              </h3>
              <p className="text-xs text-gray-500">Chronological schedule of technician visits and maintenance task times for today.</p>
            </div>
            <span className="text-xs font-bold bg-brand/10 text-brand px-3 py-1 rounded-full border border-brand/20">
              Today: {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {(() => {
            const todayStr = new Date().toDateString();
            const techVisits = requests.filter(req => {
              const isTech = user?.role === 'Technician';
              const isMatch = isTech ? req.technician_id === user?.id : req.technician_id !== null;
              if (!isMatch) return false;
              if (!req.scheduled_time) return false;
              return new Date(req.scheduled_time).toDateString() === todayStr;
            }).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

            if (techVisits.length === 0) {
              return (
                <div className="py-6 text-center text-gray-400 text-xs italic border border-dashed border-line rounded-xl">
                  No maintenance visits scheduled for today.
                </div>
              );
            }

            return (
              <div className="relative pl-6 border-l border-line flex flex-col gap-8 my-2">
                {techVisits.map((req, idx) => {
                  const assetObj = assets.find(a => a.id === req.asset_id);
                  const techObj = employees.find(e => e.id === req.technician_id);
                  const startTime = new Date(req.scheduled_time);
                  const endTime = new Date(startTime.getTime() + (req.duration_minutes || 60) * 60000);
                  
                  const isAssigned = req.status === 'Assigned';
                  const isInProgress = req.status === 'In Progress';
                  const isResolved = req.status === 'Resolved';
                  const isPendingActions = isAssigned || isInProgress;

                  return (
                    <div key={`visit-${req.id}`} className="relative flex flex-col sm:flex-row justify-between items-start gap-4 p-4 rounded-xl border border-line bg-surface/50 hover:bg-white transition-all shadow-sm">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-7 w-4.5 h-4.5 rounded-full bg-brand border-4 border-white shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Time Span Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-brand bg-brand/5 border border-brand/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">({req.duration_minutes || 60} mins)</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                            ${req.priority === 'Critical' ? 'bg-red-50 text-rust border-red-200' : ''}
                            ${req.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
                            ${req.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${req.priority === 'Low' ? 'bg-gray-50 text-gray-500 border-gray-200' : ''}
                          `}>
                            {req.priority}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                            ${isResolved ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${isInProgress ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : ''}
                            ${isAssigned ? 'bg-amber-50 text-amber border-amber-200' : ''}
                          `}>
                            {req.status}
                          </span>
                        </div>

                        {/* Asset and Ticket Information */}
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-xs font-bold text-ink">
                            {assetObj?.name || `Asset ${req.asset_id}`} ({assetObj?.tag || 'UNK'})
                          </span>
                          <p className="text-xs text-gray-500">Issue: "{req.issue_description}"</p>
                          {techObj && user?.role !== 'Technician' && (
                            <span className="text-[10px] font-semibold text-gray-400">Assigned Tech: {techObj.name}</span>
                          )}
                          {isResolved && req.parts_replaced && (
                            <div className="mt-2 text-[10px] bg-green-50 text-green-800 p-2 rounded border border-green-100 font-medium">
                              Replaced Parts: <span className="font-semibold">{req.parts_replaced}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shift & Resolve Action Controls */}
                      {isPendingActions && (req.technician_id === user?.id || user?.role !== 'Employee') && (
                        <div className="flex flex-col gap-2 shrink-0 sm:items-end w-full sm:w-auto">
                          <div className="flex gap-2">
                            {isAssigned && (
                              <RippleButton 
                                type="button" 
                                variant="primary" 
                                size="sm" 
                                onClick={() => startWork(req.id)}
                              >
                                Start Visit
                              </RippleButton>
                            )}
                            {isInProgress && (
                              <RippleButton 
                                type="button" 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleActionClick('resolve', req)}
                              >
                                Checkout / Resolve
                              </RippleButton>
                            )}
                          </div>

                          {isInProgress && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left sm:text-right">Shift Task Time</span>
                              <div className="flex gap-1.5 flex-wrap">
                                <button 
                                  onClick={() => extendTaskSchedule(req.id, 25)}
                                  className="text-[10px] font-bold border border-line bg-white hover:bg-surface text-ink px-2.5 py-1 rounded-lg transition"
                                >
                                  +25 mins
                                </button>
                                <button 
                                  onClick={() => extendTaskSchedule(req.id, 50)}
                                  className="text-[10px] font-bold border border-line bg-white hover:bg-surface text-ink px-2.5 py-1 rounded-lg transition"
                                >
                                  +50 mins
                                </button>
                                {customExtendId === req.id ? (
                                  <div className="flex gap-1 items-center">
                                    <input 
                                      type="number" 
                                      min="1" 
                                      placeholder="Mins" 
                                      value={customExtendMins}
                                      onChange={(e) => setCustomExtendMins(e.target.value)}
                                      className="w-16 text-center text-xs py-1 border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                                    />
                                    <button 
                                      onClick={() => {
                                        if (customExtendMins) {
                                          extendTaskSchedule(req.id, customExtendMins);
                                        }
                                      }}
                                      className="text-xs font-bold bg-brand text-white px-2 py-1 rounded-lg hover:bg-brand-deep transition"
                                    >
                                      Go
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setCustomExtendId(req.id)}
                                    className="text-[10px] font-bold border border-line bg-white hover:bg-surface text-brand px-2.5 py-1 rounded-lg transition"
                                  >
                                    Custom
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4 h-full">
            {cols.map(col => {
              const colItems = getColItems(col.statuses);
              return (
                <div key={col.id} className="bg-surface border border-line p-4 rounded-2xl flex flex-col gap-4 min-w-[300px] w-full max-w-sm shrink-0">
                  <div className="flex justify-between items-center pb-2 border-b border-line">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                      {col.title}
                    </span>
                    <span className="bg-white text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-line">
                      {colItems.length}
                    </span>
                  </div>

                  <SortableContext items={colItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                      {colItems.map(req => {
                        const assetObj = assets.find(a => a.id === req.asset_id);
                        const techObj = employees.find(e => e.id === req.technician_id);
                        return (
                          <SortableTaskCard 
                            key={req.id} 
                            req={req} 
                            assetObj={assetObj} 
                            techObj={techObj}
                            user={user}
                            onActionClick={handleActionClick}
                          />
                        );
                      })}
                      {colItems.length === 0 && (
                        <div className="py-8 text-center text-gray-400 text-xs italic border-2 border-dashed border-line rounded-xl">
                          Drop tickets here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* RAISE MAINT MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowRequestModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleRequest} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Raise Repair Request</h3>
                <button type="button" onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

               <div className="relative">
                 <AnimatedSelect
                   label="Select Affected Asset"
                   required
                   placeholder="Search asset..."
                   options={assets.map(a => ({ value: String(a.id), label: `${a.name} (${a.tag})` }))}
                   value={maintAsset}
                   onChange={setMaintAsset}
                 />
               </div>

               <div className="relative">
                 <AnimatedSelect
                   label="Task Priority"
                   options={[
                     { value: 'Low',      label: 'Low' },
                     { value: 'Medium',   label: 'Medium' },
                     { value: 'High',     label: 'High' },
                     { value: 'Critical', label: 'Critical' },
                   ]}
                   value={maintPriority}
                   onChange={setMaintPriority}
                 />
               </div>

              <div>
                <label className="label">Issue Description</label>
                <textarea 
                  required value={maintDescription} onChange={(e) => setMaintDescription(e.target.value)}
                  placeholder="Describe hardware failure, warning signals..." rows="4"
                  className="input-field h-auto py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setShowRequestModal(false)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary">Raise Ticket</RippleButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN TECH MODAL */}
      <AnimatePresence>
        {assigningReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setAssigningReq(null)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAssign} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Assign Technician</h3>
                <button type="button" onClick={() => setAssigningReq(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Assign a qualified specialist to this repair task.</p>

              <div className="relative">
                <AnimatedSelect
                  label="Select Technician"
                  required
                  placeholder="Select Tech..."
                  options={employees.filter(e => e.role !== 'Employee').map(emp => ({ value: String(emp.id), label: `${emp.name} (${emp.role})` }))}
                  value={assignTech}
                  onChange={setAssignTech}
                />
              </div>

              <div>
                <label className="label">Scheduled Time</label>
                <input
                  type="datetime-local"
                  required
                  value={assignTime}
                  onChange={(e) => setAssignTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={assignDuration}
                  onChange={(e) => setAssignDuration(e.target.value)}
                  placeholder="e.g. 60"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setAssigningReq(null)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary">Confirm Assignment</RippleButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* RESOLVE MODAL */}
      <AnimatePresence>
        {resolvingReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setResolvingReq(null)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleResolve} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Complete Repair Resolution</h3>
                <button type="button" onClick={() => setResolvingReq(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Document diagnostic actions and parts replaced.</p>

              <div>
                <label className="label">Resolution Notes</label>
                <textarea 
                  required value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Details of the resolution..." rows="4"
                  className="input-field h-auto py-3"
                />
              </div>

              <div>
                <label className="label">Parts Changed, Replaced, or Repaired</label>
                <input
                  type="text"
                  required
                  value={partsReplaced}
                  onChange={(e) => setPartsReplaced(e.target.value)}
                  placeholder="e.g. Replaced laptop battery pack, RAM sticks"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setResolvingReq(null)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary">Complete Resolution</RippleButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* REJECT MODAL */}
      <AnimatePresence>
        {rejectingReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setRejectingReq(null)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleReject} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Reject Maintenance Request</h3>
                <button type="button" onClick={() => setRejectingReq(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Please explain why this request is rejected.</p>

              <div>
                <label className="label">Rejection Reason</label>
                <textarea 
                  required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..." rows="4"
                  className="input-field h-auto py-3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setRejectingReq(null)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="danger">Reject Request</RippleButton>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Maintenance;

