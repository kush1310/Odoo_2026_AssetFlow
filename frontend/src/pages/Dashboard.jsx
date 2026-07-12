import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  PackageCheck, 
  PackageX, 
  Wrench, 
  Calendar, 
  ArrowLeftRight, 
  Clock, 
  PlusCircle, 
  CalendarPlus, 
  AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [resAssets, resAlloc, resBook, resMaint, resTrans] = await Promise.all([
          axios.get('http://localhost:8000/api/assets', { headers }),
          axios.get('http://localhost:8000/api/allocations', { headers }),
          axios.get('http://localhost:8000/api/bookings', { headers }),
          axios.get('http://localhost:8000/api/maintenance', { headers }),
          axios.get('http://localhost:8000/api/transfers', { headers })
        ]);

        setAssets(resAssets.data);
        setAllocations(resAlloc.data);
        setBookings(resBook.data);
        setMaintenance(resMaint.data);
        setTransfers(resTrans.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics.", err);
      }
    };
    fetchData();
  }, []);

  // Compute operational metrics
  const availableCount = assets.filter(a => a.status === 'Available').length;
  const allocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const maintenanceCount = maintenance.filter(m => m.status !== 'Resolved' && m.status !== 'Rejected').length;
  const activeBookingsCount = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
  const pendingTransfersCount = transfers.filter(t => t.state === 'Requested').length;

  // Filter out overdue returns
  const today = new Date().toISOString().split('T')[0];
  const overdueAllocations = allocations.filter(alloc => 
    alloc.state === 'approved' && 
    alloc.expected_return_date && 
    alloc.expected_return_date < today
  );
  
  const upcomingReturns = allocations.filter(alloc => 
    alloc.state === 'approved' && 
    (!alloc.expected_return_date || alloc.expected_return_date >= today)
  );

  // Chart dataset for category counts
  const categoryCounts = assets.reduce((acc, asset) => {
    const catName = asset.category_id === 1 ? 'Electronics' : asset.category_id === 2 ? 'Furniture' : 'Vehicles';
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  }));

  const COLORS = ['#6366f1', '#3b82f6', '#10b981'];

  // Usage trends (mocked timeline based on asset registration dates)
  const usageTrendData = [
    { name: 'Jan', Allocations: 4, Bookings: 2 },
    { name: 'Feb', Allocations: 7, Bookings: 5 },
    { name: 'Mar', Allocations: 9, Bookings: 6 },
    { name: 'Apr', Allocations: allocatedCount, Bookings: activeBookingsCount }
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-slate-400">Here is the operation summary for your role as <span className="text-indigo-400 font-semibold">{user?.role}</span>.</p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'Employee' && (
            <Link 
              to="/assets?register=true" 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Asset</span>
            </Link>
          )}
          <Link 
            to="/bookings?new=true" 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book Resource</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</span>
            <PackageCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-3xl font-bold text-white">{availableCount}</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allocated</span>
            <PackageX className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-3xl font-bold text-white">{allocatedCount}</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under repair</span>
            <Wrench className="w-5 h-5 text-yellow-500" />
          </div>
          <span className="text-3xl font-bold text-white">{maintenanceCount}</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bookings</span>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-3xl font-bold text-white">{activeBookingsCount}</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl col-span-2 lg:col-span-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transfers</span>
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-3xl font-bold text-white">{pendingTransfersCount}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Returns Widget (Highlighted) */}
        <div className="bg-slate-900 border border-red-950/60 rounded-2xl overflow-hidden flex flex-col lg:col-span-2 shadow-xl">
          <div className="px-5 py-4 bg-red-950/20 border-b border-red-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-sm">Critical Overdue Returns</h3>
            </div>
            <span className="bg-red-900/50 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-800">
              {overdueAllocations.length} Flagged
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto max-h-80 flex flex-col gap-4">
            {overdueAllocations.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center p-6 text-slate-500 text-xs">
                All asset returns are currently on schedule.
              </div>
            ) : (
              overdueAllocations.map(alloc => (
                <div key={alloc.id} className="flex justify-between items-center p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">Asset: {alloc.asset_id}</span>
                    <span className="text-[10px] text-slate-400">Custodian ID: {alloc.employee_id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-red-400 text-[11px] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Overdue Since {alloc.expected_return_date}
                    </span>
                    <span className="text-[10px] bg-red-900/40 text-red-300 border border-red-800 px-2 py-0.5 rounded-md">
                      Requires Action
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200">Asset Registry Share</h3>
          {pieData.length === 0 ? (
            <div className="flex-1 flex justify-center items-center text-slate-500 text-xs">
              No inventory registers available.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value} Assets</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
        <h3 className="font-bold text-sm text-slate-200">Operational Custody Trends</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageTrendData}>
              <defs>
                <linearGradient id="colorAlloc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="Allocations" stroke="#6366f1" fillOpacity={1} fill="url(#colorAlloc)" strokeWidth={2} />
              <Area type="monotone" dataKey="Bookings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBook)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
