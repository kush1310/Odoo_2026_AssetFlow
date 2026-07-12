import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
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
  PackageSearch
} from 'lucide-react';
import AssetTagChip from '../components/AssetTagChip';

// Count-up animation component with ease-out cubic
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200;
    
    // easeOutCubic
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(Math.floor(easeOut(progress) * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
};

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        // Calculate a mock "Total Assets" based on available + allocated + maintenance
        const data = res.data;
        data.total_assets = (data.available || 0) + (data.allocated || 0) + (data.under_maintenance || 0);
        setKpiData(data);
      } catch (err) {
        console.error("Failed to load dashboard KPIs.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading || !kpiData) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-96 lg:col-span-2 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col gap-6 max-w-7xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Banner */}
      <motion.div variants={item} className="page-header items-center">
        <div className="flex flex-col gap-1">
          <h2 className="page-title">Today's Overview</h2>
          <p className="page-subtitle">
            Welcome back, <span className="font-semibold text-ink">{user?.name}</span>. Here's your asset summary.
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'Employee' && (
            <Link to="/assets?register=true" className="btn btn-secondary">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Register Asset</span>
            </Link>
          )}
          <Link to="/bookings?new=true" className="btn btn-primary">
            <CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Book Resource</span>
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <motion.div variants={item} className="kpi-card kpi-card-teal cursor-pointer" onClick={() => navigate('/assets')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total</span>
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <PackageSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.total_assets} /></span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card kpi-card-green cursor-pointer" onClick={() => navigate('/assets')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Available</span>
            <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.available} /></span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card kpi-card-blue cursor-pointer" onClick={() => navigate('/allocations')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Allocated</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.allocated} /></span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card kpi-card-amber cursor-pointer" onClick={() => navigate('/maintenance')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Repair</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.under_maintenance} /></span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card kpi-card-purple cursor-pointer" onClick={() => navigate('/bookings')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Bookings</span>
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.active_bookings} /></span>
          </div>
        </motion.div>

        <motion.div variants={item} className="kpi-card cursor-pointer" onClick={() => navigate('/allocations')}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Pending</span>
            <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink tracking-tight"><AnimatedNumber value={kpiData.pending_transfers} /></span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Returns Widget */}
        <motion.div variants={item} className="card overflow-hidden flex flex-col lg:col-span-2 relative">
          {kpiData.overdue_list.length > 0 && (
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
          
          <div className="px-5 py-4 border-b border-line flex items-center justify-between [background-color:var(--bg-muted)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-ink text-sm">Overdue Returns</h3>
            </div>
            {kpiData.overdue_list.length > 0 && (
              <span className="badge badge-warning">
                {kpiData.overdue_list.length} Flagged
              </span>
            )}
          </div>

          <div className="flex-1 p-0 overflow-y-auto max-h-[22rem] flex flex-col">
            {kpiData.overdue_list.length === 0 ? (
              <div className="empty-state">
                <CheckCircle className="empty-state-icon text-green-500" />
                <span className="text-sm font-medium">All asset returns are on schedule.</span>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {kpiData.overdue_list.map(alloc => (
                  <div key={alloc.id} className="flex justify-between items-center p-4 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center gap-4">
                      <AssetTagChip tag={alloc.asset_tag} />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-ink">{alloc.asset_name}</span>
                        <span className="text-xs text-muted font-medium">Held by {alloc.employee_name} ({alloc.department_name})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        Due {alloc.expected_return_date}
                      </span>
                      <Link to="/allocations" className="text-[11px] font-bold text-brand hover:underline flex items-center tracking-wide uppercase">
                        View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="card flex flex-col">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2 [background-color:var(--bg-muted)]">
            <Activity className="w-5 h-5 text-muted" />
            <h3 className="font-bold text-ink text-sm">Recent Activity</h3>
          </div>
          <div className="flex-1 p-0 overflow-y-auto max-h-[22rem]">
            {kpiData.recent_activity?.length === 0 ? (
              <div className="empty-state">
                <span className="text-sm">No recent activity.</span>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {kpiData.recent_activity?.map(log => (
                  <div key={log.id} className="p-4 flex gap-3 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/10"></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-ink leading-snug">{log.description}</p>
                      <span className="text-[11px] font-semibold text-muted tracking-wide">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                        <span className="mx-1.5 opacity-50">•</span>
                        {log.user_name || 'System'}
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

export default Dashboard;
