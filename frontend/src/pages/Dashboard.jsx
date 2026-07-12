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
  CheckCircle
} from 'lucide-react';
import AssetTagChip from '../components/AssetTagChip';

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

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        setKpiData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard KPIs.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, []);

  if (loading || !kpiData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="flex flex-col gap-8 max-w-7xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Banner */}
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-line p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink">Today's Overview</h2>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name}. Here's what's happening with your resources.
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'Employee' && (
            <Link to="/assets?register=true" className="btn btn-secondary shadow-sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Register Asset
            </Link>
          )}
          <Link to="/bookings?new=true" className="btn btn-primary shadow-sm">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book Resource
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</span>
            <div className="p-2 bg-green-50 text-brand rounded-lg group-hover:bg-brand group-hover:text-white transition">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.available} /></span>
        </motion.div>

        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate('/allocations')}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.allocated} /></span>
        </motion.div>

        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate('/maintenance')}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Under Repair</span>
            <div className="p-2 bg-amber/10 text-amber rounded-lg group-hover:bg-amber group-hover:text-white transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.under_maintenance} /></span>
        </motion.div>

        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate('/bookings')}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Bookings</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.active_bookings} /></span>
        </motion.div>

        <motion.div variants={item} className="bg-white border border-line p-5 rounded-2xl col-span-2 lg:col-span-1 flex flex-col gap-3 shadow-sm hover:shadow-md transition group cursor-pointer" onClick={() => navigate('/allocations')}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Transfers</span>
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-pink-600 group-hover:text-white transition">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-ink"><AnimatedNumber value={kpiData.pending_transfers} /></span>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Returns Widget */}
        <motion.div variants={item} className="bg-white border-l-4 border-l-amber border-y border-r border-line rounded-xl overflow-hidden flex flex-col lg:col-span-2 shadow-sm relative">
          {kpiData.overdue_list.length > 0 && (
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-1 bg-amber"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
          
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-orange-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber" />
              <h3 className="font-bold text-ink text-sm">Overdue Returns</h3>
            </div>
            {kpiData.overdue_list.length > 0 && (
              <span className="bg-amber/10 text-amber text-xs font-bold px-2.5 py-1 rounded-md border border-amber/20">
                {kpiData.overdue_list.length} Flagged for follow-up
              </span>
            )}
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
                        Due {alloc.expected_return_date}
                      </span>
                      <Link to="/allocations" className="text-xs text-brand hover:underline flex items-center">
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

export default Dashboard;
