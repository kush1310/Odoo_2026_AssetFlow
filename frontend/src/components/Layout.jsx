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
  FileText,
  BarChart2,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';

const Layout = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { addToast } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();

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
    { name: 'Allocations', path: '/allocations', icon: KeyRound, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Bookings', path: '/bookings', icon: CalendarDays, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Resource Requests', path: '/resource-requests', icon: FileText, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Audits', path: '/audits', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Activity Logs', path: '/logs', icon: Activity, roles: ['Admin'] },
    { name: 'My Profile', path: '/profile', icon: UserIcon, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(user?.role));
  const unreadCount = notifications.filter(n => !n.read_status).length;
  
  // Find current page title for breadcrumb
  const currentNav = allowedItems.find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-line flex items-center justify-between px-6 py-3.5 shadow-sm [background-color:var(--bg-header)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 text-gray-500 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 text-gray-500 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand rounded-md transition-colors"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div className="flex flex-col ml-2">
            <span className="text-lg font-bold tracking-tight text-ink flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" />
              AssetFlow
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-ink rounded-full hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-ink rounded-full hover:bg-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white [ring-color:var(--bg-header)]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden [background-color:var(--bg-panel)]"
                >
                  <div className="px-4 py-3 border-b border-line font-semibold text-sm flex justify-between items-center bg-surface">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-3">
                        <Bell className="w-8 h-8 opacity-20" />
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => markAsRead(notif.id)}
                          className={`px-4 py-3 hover:bg-surface border-b border-line cursor-pointer transition flex flex-col gap-1 ${!notif.read_status ? 'bg-surface border-l-2 border-l-brand' : ''}`}
                        >
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{notif.type}</span>
                          <p className={`text-sm ${!notif.read_status ? 'font-medium text-ink' : 'text-gray-500'} leading-relaxed`}>{notif.message}</p>
                          <span className="text-[10px] text-gray-400">{new Date(notif.created_date).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-gray-200 [background-color:var(--border-color)]"></div>

          {/* Profile user */}
          <div className="flex items-center gap-3">
            <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition group">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-ink leading-tight group-hover:text-brand transition-colors">{user?.name}</span>
                <span className="text-xs font-medium tracking-wide text-brand">{user?.role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold shadow-sm ring-1 ring-brand/20 group-hover:ring-brand transition-all overflow-hidden">
                {user?.profile_picture ? (
                  <img src={`http://127.0.0.1:8000${user.profile_picture}`} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || <UserIcon className="w-5 h-5" />
                )}
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 ml-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static transition-all duration-300 ease-in-out z-30
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          bg-white border-r border-line flex flex-col justify-between py-6 [background-color:var(--bg-sidebar)]
        `}>
          <div className="flex flex-col gap-6 px-3 h-full overflow-y-auto">
            <div className="flex items-center justify-between px-3 lg:hidden mb-2">
              <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5 relative">
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={sidebarCollapsed ? item.name : undefined}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-item ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand' : ''}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {!sidebarCollapsed && (
            <div className="px-6 border-t border-line pt-6 mt-4">
              <div className="flex flex-col gap-1 text-[11px] text-gray-400 font-medium">
                <span>AssetFlow Enterprise</span>
                <span>v2.0.0 (Premium UI)</span>
              </div>
            </div>
          )}
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 bg-surface overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
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
