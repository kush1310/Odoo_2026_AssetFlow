import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  DollarSign, 
  MapPin, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon,
  User,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../components/Toast';

const ResourceRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Search & Filter state
  const [filterStatus, setFilterStatus] = useState('All');

  // Request Modal state
  const [showModal, setShowModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqBenefits, setReqBenefits] = useState('');
  const [reqCost, setReqCost] = useState('');
  const [reqLocation, setReqLocation] = useState('');
  const [reqImage, setReqImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resource-requests');
      setRequests(res.data);
    } catch (err) {
      addToast("Failed to load resource requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setReqImage(res.data.url);
      addToast("Image uploaded successfully!", "success");
    } catch (err) {
      addToast("Failed to upload image.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!reqName.trim() || !reqReason.trim() || !reqBenefits.trim() || !reqCost || !reqLocation.trim()) {
      setFormError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/resource-requests', {
        name: reqName.trim(),
        reason: reqReason.trim(),
        benefits: reqBenefits.trim(),
        estimated_cost: parseFloat(reqCost),
        location_to_use: reqLocation.trim(),
        image: reqImage || null
      });
      addToast("Resource request submitted successfully!", "success");
      setShowModal(false);
      // Reset form
      setReqName('');
      setReqReason('');
      setReqBenefits('');
      setReqCost('');
      setReqLocation('');
      setReqImage('');
      loadRequests();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      await api.post(`/resource-requests/${requestId}/${action}`);
      addToast(`Request successfully ${action}ed!`, "success");
      loadRequests();
    } catch (err) {
      addToast(err.response?.data?.detail || `Failed to ${action} request.`, "error");
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'All') return true;
    return req.status === filterStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber/10 text-amber border-amber/20';
      case 'Accepted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-50 text-rust border-red-200';
      default: return 'bg-gray-105 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Resource Requests</h2>
          <p className="text-sm text-slate-400 font-medium">Request new procurement resources and manage multi-stage organizational approvals.</p>
        </div>
        {user?.role === 'Employee' && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary whitespace-nowrap relative z-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request New Resource
          </button>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Status:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['All', 'Pending', 'Accepted', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border flex-1 sm:flex-initial
                ${filterStatus === status ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100'}
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* REQUESTS LIST / GRID */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRequests.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-16 text-center text-gray-500 font-medium">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No resource requests found.</p>
              </div>
            ) : (
              filteredRequests.map(req => {
                // Check if user is Department Head of requester
                const isMyDeptRequester = user?.role === 'Department Head' && req.requester_dept_name === user?.department?.name;
                
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-line rounded-2xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col"
                  >
                    {/* Resource Image Header */}
                    <div className="h-44 bg-slate-50 border-b border-line relative overflow-hidden flex items-center justify-center">
                      {req.image ? (
                        <img 
                          src={`http://127.0.0.1:8000${req.image}`} 
                          alt={req.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                          <ImageIcon className="w-8 h-8 opacity-60" />
                          <span className="text-xs">No image provided</span>
                        </div>
                      )}
                      
                      {/* Price Tag */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm border border-line px-2.5 py-1 rounded-full text-xs font-extrabold text-slate-800 shadow-sm flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 mr-0.5" />
                        {req.estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {/* Overall Status Badge */}
                      <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusClass(req.status)}`}>
                        {req.status}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div>
                        <h4 className="font-extrabold text-lg text-ink line-clamp-1">{req.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-650">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-brand uppercase text-[10px]">
                            {req.requester_name?.charAt(0) || 'U'}
                          </div>
                          <span>{req.requester_name}</span>
                          <span className="text-gray-300">•</span>
                          <span>{req.requester_dept_name || 'No Dept'}</span>
                        </div>
                      </div>

                      {/* Detail Toggles */}
                      <div className="flex flex-col gap-2.5 bg-surface p-3.5 rounded-xl border border-line">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Business Reason</span>
                          <p className="text-xs text-ink mt-0.5 line-clamp-2 italic">"{req.reason}"</p>
                        </div>
                        <div className="flex flex-col border-t border-line/60 pt-2.5">
                          <span className="text-[10px] text-brand font-bold uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-brand" /> Company Benefit
                          </span>
                          <p className="text-xs text-ink mt-0.5 line-clamp-2 italic">"{req.benefits}"</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-line/60 pt-2.5">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" /> Location of Use
                          </span>
                          <span className="text-xs font-semibold text-slate-800">{req.location_to_use}</span>
                        </div>
                      </div>

                      {/* Approvals Workflow Tracker */}
                      <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-line/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approval Checklist</span>
                        
                        {/* Manager Check */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">1. Manager Accept:</span>
                          <span className={`font-semibold ${req.status !== 'Pending' ? 'text-green-600' : 'text-amber'}`}>
                            {req.status !== 'Pending' ? 'Accepted ✓' : 'Awaiting Check'}
                          </span>
                        </div>

                        {/* Dept Head Approval */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">2. Dept Head Approval:</span>
                          <span className={`font-semibold ${req.dept_head_approved ? 'text-green-600' : (req.status === 'Accepted' ? 'text-amber' : 'text-gray-400')}`}>
                            {req.dept_head_approved ? 'Approved ✓' : (req.status === 'Accepted' ? 'Awaiting Approval' : 'Pending Stage 1')}
                          </span>
                        </div>

                        {/* Admin Approval */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">3. Admin Final Approval:</span>
                          <span className={`font-semibold ${req.admin_approved ? 'text-green-600' : (req.status === 'Accepted' ? 'text-amber' : 'text-gray-400')}`}>
                            {req.admin_approved ? 'Approved ✓' : (req.status === 'Accepted' ? 'Awaiting Approval' : 'Pending Stage 1')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    {/* Stage 1 Actions: Manager Accept/Reject */}
                    {req.status === 'Pending' && (user?.role === 'Admin' || user?.role === 'Asset Manager') && (
                      <div className="px-5 pb-5 flex gap-2 pt-2 border-t border-line/60">
                        <button 
                          onClick={() => handleAction(req.id, 'accept')}
                          className="flex-1 btn btn-primary flex items-center justify-center gap-1.5 py-2 text-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Request
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'reject')}
                          className="btn btn-secondary text-rust hover:bg-red-50 border-red-200 py-2 px-3.5 text-xs"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}

                    {/* Stage 2 Actions: Dept Head & Admin approvals */}
                    {req.status === 'Accepted' && (
                      <div className="px-5 pb-5 flex flex-col gap-2 pt-3 border-t border-line/60">
                        <div className="flex gap-2">
                          {/* Admin Approve Button */}
                          {user?.role === 'Admin' && !req.admin_approved && (
                            <button
                              onClick={() => handleAction(req.id, 'approve')}
                              className="flex-1 btn btn-primary flex items-center justify-center gap-1.5 py-2 text-xs bg-brand hover:bg-brand/90"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve (Admin)
                            </button>
                          )}

                          {/* Dept Head Approve Button */}
                          {user?.role === 'Department Head' && isMyDeptRequester && !req.dept_head_approved && (
                            <button
                              onClick={() => handleAction(req.id, 'approve')}
                              className="flex-1 btn btn-primary flex items-center justify-center gap-1.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-755"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve (Dept Head)
                            </button>
                          )}
                          
                          {/* Reject button for managers/heads */}
                          {(user?.role === 'Admin' || user?.role === 'Asset Manager' || (user?.role === 'Department Head' && isMyDeptRequester)) && (
                            <button 
                              onClick={() => handleAction(req.id, 'reject')}
                              className="btn btn-secondary text-rust hover:bg-red-50 border-red-200 py-2 px-3 text-xs flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE RESOURCE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleCreateRequest} 
              className="relative w-full max-w-lg bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-2 pb-3 border-b border-line">
                <h3 className="font-extrabold text-xl text-ink">Request New Resource</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-rust text-xs font-semibold flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Resource Name</label>
                  <input 
                    type="text" required value={reqName} onChange={(e) => {setReqName(e.target.value); setFormError('');}}
                    placeholder="e.g. iPad Pro M4, Conference Room TV" className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Estimated Cost ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><DollarSign className="w-4 h-4"/></span>
                    <input 
                      type="number" step="0.01" required value={reqCost} onChange={(e) => {setReqCost(e.target.value); setFormError('');}}
                      placeholder="0.00" className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Location of Use</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><MapPin className="w-4 h-4"/></span>
                    <input 
                      type="text" required value={reqLocation} onChange={(e) => {setReqLocation(e.target.value); setFormError('');}}
                      placeholder="e.g. HQ IT Office" className="input-field pl-9"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="label">Detailed Application (Why do you need it?)</label>
                  <textarea 
                    required value={reqReason} onChange={(e) => {setReqReason(e.target.value); setFormError('');}}
                    placeholder="Provide a detailed explanation of the hardware requirements..." rows="3"
                    className="input-field h-auto py-3"
                  />
                </div>

                <div className="col-span-2">
                  <label className="label">Business Benefit (How it helps the company?)</label>
                  <textarea 
                    required value={reqBenefits} onChange={(e) => {setReqBenefits(e.target.value); setFormError('');}}
                    placeholder="Describe direct productivity boosts, visual efficiency or cost-savings..." rows="3"
                    className="input-field h-auto py-3"
                  />
                </div>

                {/* File Upload widget */}
                <div className="col-span-2">
                  <label className="label">Upload Resource Image / Photo Reference</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-brand transition flex flex-col items-center justify-center gap-2 relative bg-surface">
                    {reqImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={`http://127.0.0.1:8000${reqImage}`} 
                          alt="Resource Preview" 
                          className="max-h-36 rounded-lg object-contain border border-line"
                        />
                        <button 
                          type="button" 
                          onClick={() => setReqImage('')}
                          className="btn btn-secondary py-1 px-3 text-xs text-rust border-red-105 hover:bg-red-50"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500">
                          {uploading ? "Uploading file..." : "Drag and drop or browse files"}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceRequests;
