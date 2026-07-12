import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import { 
  PackageCheck, 
  PackageX, 
  Wrench, 
  Calendar, 
  ArrowLeftRight, 
  Clock, 
  PlusCircle, 
  CalendarPlus, 
  AlertTriangle,
  Activity,
  ChevronRight,
  CheckCircle,
  Play,
  Check,
  User,
  Plus,
  Loader2,
  ListTodo,
  X
} from 'lucide-react';
import AssetTagChip from '../components/AssetTagChip';
import RippleButton from '../components/ui/RippleButton';
import { useToast } from '../components/Toast';

// Count-up animation component
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ROUTER VIEWPORT
// ══════════════════════════════════════════════════════════════════════════════
const Dashboard = ({ user }) => {
  if (user?.role === 'Technician') {
    return <TechnicianDashboard user={user} />;
  }
  if (user?.role === 'Employee') {
    return <EmployeeDashboard user={user} />;
  }
  return <AdminDashboard user={user} />;
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. ADMIN / MANAGER VIEWPORT
// ══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        setKpiData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  if (loading || !kpiData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div className="flex flex-col gap-8 max-w-7xl mx-auto" variants={container} initial="hidden" animate="show">
      {/* Welcome Banner */}
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-line p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Today's Overview</h2>
          <p className="text-sm text-gray-500">Welcome back, {user?.name}. Here's what's happening with your resources.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <Link to="/assets?register=true" className="btn btn-secondary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4 mr-2" />
            Register Asset
          </Link>
          <Link to="/allocations?transfer=true" className="btn btn-secondary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Raise Custody Request
          </Link>
          <Link to="/bookings?new=true" className="btn btn-primary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book Resource
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</span>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.available} /></span>
        </motion.div>
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate('/allocations')}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated</span>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.allocated} /></span>
        </motion.div>
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate('/maintenance')}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Under Repair</span>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.under_maintenance} /></span>
        </motion.div>
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate('/bookings')}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Bookings</span>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.active_bookings} /></span>
        </motion.div>
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl col-span-2 lg:col-span-1 flex flex-col gap-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => navigate('/allocations')}>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Transfers</span>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.pending_transfers} /></span>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="bg-white border-l-4 border-l-amber border-y border-r border-line rounded-xl overflow-hidden flex flex-col lg:col-span-2 shadow-sm relative">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-orange-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber" />
              <h3 className="font-bold text-ink text-sm">Overdue Returns</h3>
            </div>
          </div>
          <div className="flex-1 p-0 overflow-y-auto max-h-80 flex flex-col">
            {kpiData.overdue_list.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8 text-gray-500 text-sm">
                <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
                All asset returns are currently on schedule.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {kpiData.overdue_list.map(alloc => (
                  <div key={alloc.id} className="flex justify-between items-center p-4 hover:bg-surface transition">
                    <div className="flex items-center gap-4">
                      <AssetTagChip tag={alloc.asset_tag} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-ink">{alloc.asset_name}</span>
                        <span className="text-xs text-gray-500">Held by {alloc.employee_name} ({alloc.department_name})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-amber text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Due {new Date(alloc.expected_return_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white border border-line rounded-xl flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-ink text-sm">Recent Activity</h3>
          </div>
          <div className="flex-1 p-0 overflow-y-auto max-h-80">
            {kpiData.recent_activity?.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No recent activity.</div>
            ) : (
              <div className="divide-y divide-line">
                {kpiData.recent_activity?.map(log => (
                  <div key={log.id} className="p-4 flex gap-3 hover:bg-surface transition">
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-ink leading-snug">{log.description}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                        {' · '}{log.user_name || 'System'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. EMPLOYEE VIEWPORT
// ══════════════════════════════════════════════════════════════════════════════
const EmployeeDashboard = ({ user }) => {
  const [allocations, setAllocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Form State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAsset, setTransferAsset] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const { addToast } = useToast();

  const fetchEmployeeData = async () => {
    try {
      const [resAllocs, resBookings, resTransfers, resAssets, resEmployees] = await Promise.all([
        api.get('/allocations'),
        api.get('/bookings'),
        api.get('/transfers'),
        api.get('/assets'),
        api.get('/employees')
      ]);
      setAllocations(resAllocs.data);
      setBookings(resBookings.data);
      setTransfers(resTransfers.data);
      setAssets(resAssets.data);
      setEmployees(resEmployees.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferAsset || !transferTarget || !transferReason.trim()) {
      addToast("Please fill in all fields.", "error");
      return;
    }
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
      fetchEmployeeData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Transfer request failed.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-line p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">My Resource Custody</h2>
          <p className="text-sm text-gray-500">Welcome, {user?.name}. View your active custody assets and reservation timelines.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => setShowTransferModal(true)}
            className="btn btn-secondary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Request Transfer
          </button>
          <Link to="/bookings?new=true" className="btn btn-primary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book Resource
          </Link>
        </div>
      </div>

      {/* Custody Assets List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <PackageCheck className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-base text-ink">My Allocated Assets</h3>
        </div>
        {allocations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <PackageX className="w-12 h-12 text-gray-200" />
            <p className="text-sm">You do not hold any allocated assets currently.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Allocated On</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Return Custody Instruction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {allocations.map(alloc => {
                  const isOverdue = alloc.state === 'overdue' || (alloc.expected_return_date && new Date(alloc.expected_return_date) < new Date());
                  return (
                    <tr key={alloc.id} className="hover:bg-surface/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand">{alloc.asset_tag}</td>
                      <td className="py-3.5 px-4 font-semibold">{alloc.asset_name}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {new Date(alloc.allocation_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td className="py-3.5 px-4">
                        {alloc.expected_return_date ? (
                          <span className={`font-semibold flex items-center gap-1.5 ${isOverdue ? 'text-rust' : 'text-gray-600'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(alloc.expected_return_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                          </span>
                        ) : (
                          <span className="text-gray-400">Ongoing Custody</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                          ${isOverdue 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                          }
                        `}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">
                        Please hand back this resource to the <span className="font-bold text-ink">Asset Manager</span> at the HQ inventory depot before unassigning.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custody Transfers List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <ArrowLeftRight className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-base text-ink">My Custody Transfers</h3>
        </div>
        {transfers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <ArrowLeftRight className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No custody transfers recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-surface/50 transition">
                    <td className="py-3.5 px-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <AssetTagChip tag={t.asset_tag} />
                        <span>{t.asset_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{t.source_holder_name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{t.target_holder_name}</td>
                    <td className="py-3.5 px-4 text-gray-500 italic">"{t.reason}"</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                        ${t.state === 'Requested' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        ${t.state === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${t.state === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}>
                        {t.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Bookings List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <Calendar className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-base text-ink">My Upcoming Bookings</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Calendar className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No bookings scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Reservation Date Range</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {bookings.filter(b => b.status !== 'Cancelled').map(book => {
                  const start = new Date(book.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                  const end = new Date(book.end_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                  return (
                    <tr key={book.id} className="hover:bg-surface/50 transition">
                      <td className="py-3.5 px-4 font-semibold">{book.asset_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-600">{start === end ? start : `${start} - ${end}`}</td>
                      <td className="py-3.5 px-4 text-gray-500 italic">"{book.purpose}"</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                          ${book.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                          ${book.status === 'Ongoing' ? 'bg-brand/10 text-brand border-brand/20' : ''}
                          ${book.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        `}>
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REQUEST TRANSFER MODAL */}
      <AnimatePresence>
        {showTransferModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-10"
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
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. TECHNICIAN VIEWPORT
// ══════════════════════════════════════════════════════════════════════════════
const TechnicianDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null); // Task to resolve
  const [resNotes, setResNotes] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Transfer Form State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAsset, setTransferAsset] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  
  const { addToast } = useToast();

  const loadDashboardData = async () => {
    try {
      const [resTasks, resAllocs, resBookings, resTransfers, resAssets, resEmployees] = await Promise.all([
        api.get('/maintenance'),
        api.get('/allocations'),
        api.get('/bookings'),
        api.get('/transfers'),
        api.get('/assets'),
        api.get('/employees')
      ]);
      setTasks(resTasks.data.filter(t => t.technician_id === user.id));
      setAllocations(resAllocs.data);
      setBookings(resBookings.data);
      setTransfers(resTransfers.data);
      setAssets(resAssets.data);
      setEmployees(resEmployees.data);
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStart = async (taskId) => {
    try {
      await api.post(`/maintenance/${taskId}/start`);
      addToast("Task started! Status changed to In Progress.", "success");
      loadDashboardData();
    } catch (err) {
      addToast("Failed to start repair task.", "error");
    }
  };

  const handleExtend = async (taskId) => {
    try {
      await api.post(`/maintenance/${taskId}/extend`, { extension_minutes: 20 });
      addToast("Time extended by 20 minutes. Subsequent tasks shifted.", "success");
      loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to extend work duration.", "error");
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resNotes.trim()) {
      addToast("Please provide resolution notes.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/maintenance/${selectedTask.id}/resolve`, {
        resolution_notes: resNotes,
        parts_replaced: partsReplaced || "None"
      });
      addToast("Task successfully resolved! Asset is now Available.", "success");
      setSelectedTask(null);
      setResNotes('');
      setPartsReplaced('');
      loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to resolve task.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferAsset || !transferTarget || !transferReason.trim()) {
      addToast("Please fill in all fields.", "error");
      return;
    }
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
      loadDashboardData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Transfer request failed.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  // Calculate daily occupied time: 45 minutes baseline per task (excluding completed/rejected)
  const pendingTasks = tasks.filter(t => t.status !== 'Resolved' && taskStatusNotRejected(t.status));
  const totalOccupiedMinutes = pendingTasks.reduce((acc, t) => acc + (t.duration_minutes || 45), 0);
  const totalHours = Math.floor(totalOccupiedMinutes / 60);
  const remainingMins = totalOccupiedMinutes % 60;

  function taskStatusNotRejected(status) {
    return status !== 'Rejected';
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Welcome & KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-line p-6 rounded-2xl shadow-sm">
        <div className="md:col-span-2 flex flex-col gap-1 justify-center">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Technician Daily Schedule</h2>
          <p className="text-sm text-gray-500">Welcome, {user?.name}. Here are your assigned maintenance tickets for today.</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-line flex flex-col justify-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Occupied Time Today</span>
          <span className="text-2xl font-bold text-brand mt-1">
            {totalHours > 0 ? `${totalHours}h ` : ''}{remainingMins}m
          </span>
          <span className="text-[10px] text-gray-400 mt-1">Estimated duration of work scheduled today.</span>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-base text-ink">My Assigned Maintenance Work</h3>
          </div>
          <span className="text-xs bg-brand/10 text-brand px-2.5 py-1 rounded-md font-bold">
            {pendingTasks.length} Pending Actions
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Wrench className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No maintenance requests assigned to you today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((task) => {
              const isInProgress = task.status === 'In Progress';
              const isResolved = task.status === 'Resolved';
              const duration = task.duration_minutes || 45;
              
              return (
                <div 
                  key={task.id} 
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                    ${isInProgress 
                      ? 'bg-brand/[0.02] border-brand shadow-md shadow-brand/5' 
                      : isResolved 
                        ? 'bg-gray-50/50 border-gray-200 opacity-75' 
                        : 'bg-white border-line hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase
                        ${task.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        ${task.priority === 'Low' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      `}>
                        {task.priority} Priority
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-400">
                        {task.scheduled_time ? new Date(task.scheduled_time).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}) : 'Unscheduled'}
                      </span>
                    </div>
                    <h4 className="font-bold text-ink text-base flex items-center gap-2 mt-0.5">
                      <AssetTagChip tag={task.asset_tag} />
                      {task.asset_name}
                    </h4>
                    <p className="text-sm text-gray-600 italic">"{task.issue_description}"</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>Scheduled Duration: <strong className="text-gray-700">{duration} minutes</strong></span>
                      {task.parts_replaced && task.parts_replaced !== 'None' && (
                        <span>Parts: <strong className="text-gray-700">{task.parts_replaced}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end border-t border-line md:border-0 pt-3 md:pt-0 mt-1 md:mt-0">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                      ${task.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                      ${task.status === 'In Progress' ? 'bg-brand/10 text-brand border-brand/20 animate-pulse' : ''}
                      ${task.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    `}>
                      {task.status}
                    </span>

                    {task.status === 'Assigned' && (
                      <RippleButton onClick={() => handleStart(task.id)} variant="primary" className="text-xs py-1.5 h-9 shrink-0 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Start Repair
                      </RippleButton>
                    )}

                    {isInProgress && (
                      <div className="flex gap-2">
                        <RippleButton onClick={() => handleExtend(task.id)} variant="secondary" className="text-xs py-1.5 h-9 shrink-0 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Extend (+20m)
                        </RippleButton>
                        <RippleButton onClick={() => setSelectedTask(task)} variant="primary" className="text-xs py-1.5 h-9 shrink-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Resolve
                        </RippleButton>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custody Assets List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-brand" />
            <h3 className="font-bold text-base text-ink">My Allocated Assets</h3>
          </div>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="btn btn-secondary shadow-sm whitespace-nowrap flex items-center justify-center shrink-0 text-xs py-1.5 h-9"
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Request Transfer
          </button>
        </div>
        {allocations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <PackageX className="w-12 h-12 text-gray-200" />
            <p className="text-sm">You do not hold any allocated assets currently.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Allocated On</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Return Custody Instruction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {allocations.map(alloc => {
                  const isOverdue = alloc.state === 'overdue' || (alloc.expected_return_date && new Date(alloc.expected_return_date) < new Date());
                  return (
                    <tr key={alloc.id} className="hover:bg-surface/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand">{alloc.asset_tag}</td>
                      <td className="py-3.5 px-4 font-semibold">{alloc.asset_name}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {new Date(alloc.allocation_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td className="py-3.5 px-4">
                        {alloc.expected_return_date ? (
                          <span className={`font-semibold flex items-center gap-1.5 ${isOverdue ? 'text-rust' : 'text-gray-600'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(alloc.expected_return_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                          </span>
                        ) : (
                          <span className="text-gray-400">Ongoing Custody</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                          ${isOverdue 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                          }
                        `}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">
                        Please hand back this resource to the <span className="font-bold text-ink">Asset Manager</span> at the HQ inventory depot before unassigning.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custody Transfers List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <ArrowLeftRight className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-base text-ink">My Custody Transfers</h3>
        </div>
        {transfers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <ArrowLeftRight className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No custody transfers recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-surface/50 transition">
                    <td className="py-3.5 px-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <AssetTagChip tag={t.asset_tag} />
                        <span>{t.asset_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{t.source_holder_name}</td>
                    <td className="py-3.5 px-4 text-gray-600">{t.target_holder_name}</td>
                    <td className="py-3.5 px-4 text-gray-500 italic">"{t.reason}"</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                        ${t.state === 'Requested' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        ${t.state === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${t.state === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}>
                        {t.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Bookings List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-line">
          <Calendar className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-base text-ink">My Upcoming Bookings</h3>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Calendar className="w-12 h-12 text-gray-200" />
            <p className="text-sm">No bookings scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface border-b border-line text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Reservation Date Range</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white text-ink">
                {bookings.filter(b => b.status !== 'Cancelled').map(book => {
                  const start = new Date(book.start_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                  const end = new Date(book.end_time).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                  return (
                    <tr key={book.id} className="hover:bg-surface/50 transition">
                      <td className="py-3.5 px-4 font-semibold">{book.asset_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-600">{start === end ? start : `${start} - ${end}`}</td>
                      <td className="py-3.5 px-4 text-gray-500 italic">"{book.purpose}"</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider
                          ${book.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                          ${book.status === 'Ongoing' ? 'bg-brand/10 text-brand border-brand/20' : ''}
                          ${book.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        `}>
                          {book.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLUTION FEEDBACK MODAL */}
      <AnimatePresence>
        {selectedTask && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/65 backdrop-blur-md"
              onClick={() => setSelectedTask(null)}
            />
            
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleResolve} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-brand" /> Repair Checkout Feedback
                </h3>
                <button type="button" onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              <div>
                <label className="label">What actions have you taken to resolve the issue?</label>
                <textarea 
                  required value={resNotes} onChange={(e) => setResNotes(e.target.value)}
                  placeholder="Describe resolution notes..." rows="3"
                  className="input-field h-auto py-2"
                />
              </div>

              <div>
                <label className="label">Parts Replaced, Added, or Removed (Optional)</label>
                <input 
                  type="text" value={partsReplaced} onChange={(e) => setPartsReplaced(e.target.value)}
                  placeholder="e.g. Replaced internal battery, added 8GB RAM"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setSelectedTask(null)}>Cancel</RippleButton>
                <RippleButton type="submit" variant="primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Confirm Resolved"}
                </RippleButton>
              </div>
            </motion.form>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* REQUEST TRANSFER MODAL */}
      <AnimatePresence>
        {showTransferModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-10"
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
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
