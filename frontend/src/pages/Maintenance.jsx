import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wrench, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  Play, 
  CheckCircle2, 
  XSquare 
} from 'lucide-react';

const Maintenance = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resReqs, resAssets, resEmps] = await Promise.all([
        axios.get('http://localhost:8000/api/maintenance', { headers }),
        axios.get('http://localhost:8000/api/assets', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers })
      ]);

      setRequests(resReqs.data);
      setAssets(resAssets.data);
      setEmployees(resEmps.data);
    } catch (err) {
      setError("Failed to load maintenance records.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/maintenance', {
        asset_id: parseInt(maintAsset),
        issue_description: maintDescription,
        priority: maintPriority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Maintenance request submitted successfully.");
      setShowRequestModal(false);
      setMaintAsset('');
      setMaintDescription('');
      setMaintPriority('Low');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit request.");
    }
  };

  const approveRequest = async (id) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/maintenance/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Request approved! Asset status flagged 'Under Maintenance'.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Action failed.");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/maintenance/${assigningReq.id}/assign`, {
        technician_id: parseInt(assignTech)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Technician assigned to task successfully.");
      setAssigningReq(null);
      setAssignTech('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Assignment failed.");
    }
  };

  const startWork = async (id) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/maintenance/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Work started. Ticket set to In Progress.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start task.");
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/maintenance/${resolvingReq.id}/resolve`, {
        resolution_notes: resolutionNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Ticket resolved. Asset returned to Available pool.");
      setResolvingReq(null);
      setResolutionNotes('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Resolution submission failed.");
    }
  };

  // Group columns
  const getColItems = (statuses) => {
    return requests.filter(r => statuses.includes(r.status));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Maintenance Pipeline</h2>
          <p className="text-xs text-slate-400">File repair tickets, approve requests, assign tasks, and track resolve pipelines.</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Ticket</span>
        </button>
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

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* COLUMN 1: PENDING */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-4 shadow-lg min-h-[30rem]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approval</span>
            <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
              {getColItems(['Pending']).length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[40rem]">
            {getColItems(['Pending']).map(req => {
              const assetObj = assets.find(a => a.id === req.asset_id);
              return (
                <div key={req.id} className="p-4 bg-slate-955 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">{assetObj?.name || `Asset ID ${req.asset_id}`} ({assetObj?.tag})</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">"{req.issue_description}"</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border
                      ${req.priority === 'Critical' ? 'bg-red-950/40 text-red-400 border-red-800' : ''}
                      ${req.priority === 'High' ? 'bg-orange-950/40 text-orange-400 border-orange-850' : ''}
                      ${req.priority === 'Medium' ? 'bg-blue-950/40 text-blue-400 border-blue-800' : ''}
                      ${req.priority === 'Low' ? 'bg-slate-950/40 text-slate-400 border-slate-850' : ''}
                    `}>
                      {req.priority}
                    </span>
                    {user?.role !== 'Employee' && (
                      <button 
                        onClick={() => approveRequest(req.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded transition"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: APPROVED / ASSIGN */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-4 shadow-lg min-h-[30rem]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unassigned</span>
            <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
              {getColItems(['Approved']).length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[40rem]">
            {getColItems(['Approved']).map(req => {
              const assetObj = assets.find(a => a.id === req.asset_id);
              return (
                <div key={req.id} className="p-4 bg-slate-955 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">{assetObj?.name || `Asset ID ${req.asset_id}`} ({assetObj?.tag})</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">"{req.issue_description}"</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                    <span className="text-[10px] text-slate-500">Approved: {req.approval_date}</span>
                    {user?.role !== 'Employee' && (
                      <button 
                        onClick={() => setAssigningReq(req)}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-semibold px-2 py-1 rounded transition"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3: WORK IN PROGRESS */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-4 shadow-lg min-h-[30rem]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
              {getColItems(['Assigned', 'In Progress']).length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[40rem]">
            {getColItems(['Assigned', 'In Progress']).map(req => {
              const assetObj = assets.find(a => a.id === req.asset_id);
              const techObj = employees.find(e => e.id === req.technician_id);
              const isAssignedToMe = req.technician_id === user?.id || user?.role !== 'Employee';
              return (
                <div key={req.id} className="p-4 bg-slate-955 border border-slate-800 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">{assetObj?.name || `Asset ID ${req.asset_id}`} ({assetObj?.tag})</span>
                    <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Tech: {techObj?.name || "Assigned"}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">"{req.issue_description}"</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">{req.status}</span>
                    
                    {isAssignedToMe && (
                      req.status === 'Assigned' ? (
                        <button 
                          onClick={() => startWork(req.id)}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded transition"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setResolvingReq(req)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded transition"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 4: RESOLVED */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col gap-4 shadow-lg min-h-[30rem]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</span>
            <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
              {getColItems(['Resolved']).length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[40rem]">
            {getColItems(['Resolved']).map(req => {
              const assetObj = assets.find(a => a.id === req.asset_id);
              return (
                <div key={req.id} className="p-4 bg-slate-955/40 border border-slate-850 rounded-xl flex flex-col gap-2 opacity-75">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-400">{assetObj?.name || `Asset ID ${req.asset_id}`} ({assetObj?.tag})</span>
                    <span className="text-[10px] text-slate-500">Resolved: {req.resolved_date}</span>
                    {req.resolution_notes && (
                      <p className="text-[10px] text-slate-450 italic mt-1.5 border-l border-slate-700 pl-2">
                        "{req.resolution_notes}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RAISE MAINT MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleRequest} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Raise Repair Request</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Affected Asset</label>
              <select 
                required
                value={maintAsset} 
                onChange={(e) => setMaintAsset(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
              >
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Task Priority</label>
              <select 
                value={maintPriority} 
                onChange={(e) => setMaintPriority(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Issue Description</label>
              <textarea 
                required
                value={maintDescription} 
                onChange={(e) => setMaintDescription(e.target.value)}
                placeholder="Hardware failure description, warning signals, or symptoms..."
                rows="4"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Raise Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ASSIGN TECH MODAL */}
      {assigningReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleAssign} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Assign Technician</h3>
            <p className="text-xs text-slate-400">Assign a qualified specialist in the directory to repair task.</p>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-400">Select Technician</label>
              <select 
                required
                value={assignTech} 
                onChange={(e) => setAssignTech(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Technician</option>
                {employees.filter(e => e.role !== 'Employee').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setAssigningReq(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESOLVE MODAL */}
      {resolvingReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleResolve} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Complete Repair Resolution</h3>
            <p className="text-xs text-slate-400">Document the diagnostic actions, parts replaced, or repair resolution.</p>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-400">Resolution Notes</label>
              <textarea 
                required
                value={resolutionNotes} 
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Details of the resolution..."
                rows="4"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setResolvingReq(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Resolve Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
