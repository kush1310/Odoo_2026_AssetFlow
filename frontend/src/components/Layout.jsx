import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Package, 
  KeyRound, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  Activity, 
  Bell, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:8000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Asset Registry', path: '/assets', icon: Package, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Allocations & Transfers', path: '/allocations', icon: KeyRound, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Bookings', path: '/bookings', icon: CalendarDays, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance board', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Auditing cycles', path: '/audits', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Activity logs', path: '/logs', icon: Activity, roles: ['Admin'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            AssetFlow
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Notifications bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read_status).length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 font-semibold text-sm flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-xs text-slate-400">{notifications.length} Pending</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">No new notifications.</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className="px-4 py-3 hover:bg-slate-800/50 border-b border-slate-800/50 cursor-pointer transition flex flex-col gap-1"
                      >
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{notif.type}</span>
                        <p className="text-xs text-slate-200 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-500">{new Date(notif.created_date).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile user */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
              {user?.name?.charAt(0) || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">{user?.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-full hover:bg-slate-800 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-0'} 
          lg:translate-x-0 lg:static transition-transform duration-255 ease-in-out z-30
          w-64 bg-slate-900 border-r border-slate-850 flex flex-col justify-between py-6
        `}>
          <div className="flex flex-col gap-8 px-4">
            <div className="flex items-center justify-between lg:hidden">
              <span className="font-semibold text-slate-400">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {allowedItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-6 border-t border-slate-800 pt-6">
            <div className="flex flex-col gap-1 text-[11px] text-slate-500">
              <span>Server Version: 1.0.0</span>
              <span>Standalone Node Mode</span>
            </div>
          </div>
        </aside>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 bg-slate-950 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
