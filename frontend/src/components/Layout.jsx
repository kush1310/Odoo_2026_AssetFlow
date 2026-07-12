import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  Settings,
  BarChart2
} from 'lucide-react';
import { useToast } from './Toast';

const Layout = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { addToast } = useToast();

  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({...n, read_status: true})));
    } catch (err) {
      console.error(err);
    }
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Organization Setup', path: '/org-setup', icon: Settings, roles: ['Admin'] },
    { name: 'Asset Directory', path: '/assets', icon: Package, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Allocations & Transfers', path: '/allocations', icon: KeyRound, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Bookings', path: '/bookings', icon: CalendarDays, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Activity Logs', path: '/logs', icon: Activity, roles: ['Admin'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(user?.role));
  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-line flex items-center justify-between px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span className="bg-brand text-white p-1 rounded font-mono text-sm">[AF]</span>
            AssetFlow
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Notifications bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-ink rounded-full hover:bg-surface transition focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rust rounded-full ring-2 ring-white" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-line font-semibold text-sm flex justify-between items-center bg-surface">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">No new notifications.</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => markAsRead(notif.id)}
                          className={`px-4 py-3 hover:bg-surface border-b border-line cursor-pointer transition flex flex-col gap-1 ${!notif.read_status ? 'bg-surface/50 border-l-2 border-l-brand' : ''}`}
                        >
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{notif.type}</span>
                          <p className={`text-sm ${!notif.read_status ? 'font-medium text-ink' : 'text-gray-600'} leading-relaxed`}>{notif.message}</p>
                          <span className="text-[10px] text-gray-400">{new Date(notif.created_date).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile user */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-ink">{user?.name}</span>
              <span className="text-xs font-semibold tracking-wider text-brand uppercase">{user?.role}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white">
              {user?.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 ml-2 text-gray-400 hover:text-rust rounded-full hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-rust"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out z-30
          w-64 bg-white border-r border-line flex flex-col justify-between py-6
        `}>
          <div className="flex flex-col gap-6 px-3">
            <div className="flex items-center justify-between px-3 lg:hidden">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 relative">
              {allowedItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors z-10
                      ${isActive ? 'text-brand' : 'text-gray-600 hover:text-ink hover:bg-surface'}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-brand/10 rounded-md z-0"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 z-10" />
                    <span className="z-10">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-6 border-t border-line pt-6">
            <div className="flex flex-col gap-1 text-[11px] text-gray-400">
              <span>AssetFlow Enterprise</span>
              <span>v2.0.0 (Hackathon Edition)</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 bg-surface overflow-y-auto overflow-x-hidden p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
