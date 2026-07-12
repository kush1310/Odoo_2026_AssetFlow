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
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '../components/Toast';
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
          <button onClick={() => onActionClick('approve', req)} className="text-[10px] font-bold text-brand hover:text-brand-deep">Approve</button>
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

  const [resolvingReq, setResolvingReq] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

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
        technician_id: parseInt(assignTech)
      });
      addToast("Technician assigned to task successfully.", "success");
      setAssigningReq(null);
      setAssignTech('');
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
        resolution_notes: resolutionNotes
      });
      addToast("Ticket resolved. Asset returned to Available pool.", "success");
      setResolvingReq(null);
      setResolutionNotes('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Resolution submission failed.", "error");
    }
  };

  const handleActionClick = (action, req) => {
    if (action === 'approve') approveRequest(req.id);
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
    { id: 'col-progress', title: 'In Progress', statuses: ['Assigned', 'In Progress'] },
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
    } else if (req.status === 'Approved' && targetColId === 'col-progress') {
      setAssigningReq(req);
    } else if (req.status === 'Assigned' && targetColId === 'col-progress') {
      startWork(req.id); // Moving from assigned to in progress is same column in UI, but maybe user drags it to trigger state update
    } else if (req.status === 'In Progress' && targetColId === 'col-resolved') {
      setResolvingReq(req);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Maintenance Board</h2>
          <p className="text-sm text-gray-500">Drag tickets to update status or assign tasks.</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="btn btn-primary whitespace-nowrap"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Raise Ticket
        </button>
      </div>

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

              <div>
                <label className="label">Select Affected Asset</label>
                <select 
                  required value={maintAsset} onChange={(e) => setMaintAsset(e.target.value)}
                  className="input-field"
                >
                  <option value="">Search asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Task Priority</label>
                <select 
                  value={maintPriority} onChange={(e) => setMaintPriority(e.target.value)}
                  className="input-field"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
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
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Raise Ticket</button>
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

              <div>
                <label className="label">Select Technician</label>
                <select 
                  required value={assignTech} onChange={(e) => setAssignTech(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Tech...</option>
                  {employees.filter(e => e.role !== 'Employee').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setAssigningReq(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setResolvingReq(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary bg-green-600 hover:bg-green-700 text-white border-transparent">Resolve Ticket</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Maintenance;
