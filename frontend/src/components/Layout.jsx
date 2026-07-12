import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BarChart2,
  FolderOpen,
  Folder,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Search,
  ChevronDown,
  ExternalLink,
  ClipboardCheck,
  Activity,
  KeyRound,
  Bell
} from 'lucide-react';
import { useToast } from './Toast';
import NotificationStack from './ui/NotificationStack';
import RippleButton from './ui/RippleButton';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from './ui/AlertDialog';

const Layout = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foldersOpen, setFoldersOpen] = useState(true);
  
  const { addToast } = useToast();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!user) return;
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Focus search input on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications on click outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans text-ink">

      {/* ================================================================
          1. SINGLE SIDEBAR - Desktop Viewports (Matches User Image)
          ================================================================ */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0 p-5 justify-between shrink-0 select-none">
        
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          
          {/* Top Search bar with ⌘K shortcut */}
          <form onSubmit={handleSearchSubmit} className="relative w-full shrink-0">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand placeholder-gray-400 transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <kbd className="absolute right-2.5 top-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded-md">
              ⌘K
            </kbd>
          </form>

          {/* Navigation Links list */}
          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1 -mr-2 scrollbar-thin">
            
            {/* Dashboard Link */}
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${location.pathname === '/' 
                  ? 'bg-gray-50 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <span>Dashboard</span>
            </Link>

            {/* Asset Directory Link */}
            {user?.role === 'Admin' && (
              <Link
                to="/assets"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${location.pathname === '/assets' 
                    ? 'bg-gray-50 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
              >
                <FolderOpen className="w-5 h-5 shrink-0" />
                <span>Asset Directory</span>
              </Link>
            )}

            {/* Custody Allocations Link */}
            {user?.role === 'Admin' && (
              <Link
                to="/allocations"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${location.pathname === '/allocations' 
                    ? 'bg-gray-50 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
              >
                <KeyRound className="w-5 h-5 shrink-0" />
                <span>Custody Allocations</span>
              </Link>
            )}

            {user?.role === 'Admin' && <hr className="my-2 border-gray-200" />}

            {/* Operations Dropdown */}
            {user?.role === 'Admin' && (
              <div>
                <button
                  onClick={() => setFoldersOpen(!foldersOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50/50 hover:text-gray-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 shrink-0" />
                    <span>Asset Operations</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${foldersOpen ? 'transform rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {foldersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex flex-col pl-6 mt-1 gap-1 border-l border-gray-100 ml-5"
                    >
                      <Link
                        to="/bookings"
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all
                          ${location.pathname === '/bookings' ? 'text-brand font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        Resource Bookings
                      </Link>
                      <Link
                        to="/audits"
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all
                          ${location.pathname === '/audits' ? 'text-brand font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        Physical Audits
                      </Link>
                      <Link
                        to="/logs"
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all
                          ${location.pathname === '/logs' ? 'text-brand font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        System Logs
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user?.role === 'Admin' && <hr className="my-2 border-gray-200" />}

            {/* Reports & Analytics Link */}
            {user?.role === 'Admin' && (
              <Link
                to="/reports"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${location.pathname === '/reports' 
                    ? 'bg-gray-50 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
              >
                <PieChart className="w-5 h-5 shrink-0" />
                <span>Reports & Analytics</span>
              </Link>
            )}

            {/* Org Setup Link */}
            {user?.role === 'Admin' && (
              <Link
                to="/org-setup"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${location.pathname === '/org-setup' 
                    ? 'bg-gray-50 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span>Org Setup</span>
              </Link>
            )}

            {/* Maintenance Kanban Link */}
            {user?.role === 'Admin' && (
              <Link
                to="/maintenance"
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${location.pathname === '/maintenance' 
                    ? 'bg-gray-50 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 shrink-0" />
                  <span>Maintenance Kanban</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            )}

            {/* Profile Settings Link */}
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${location.pathname === '/profile' 
                  ? 'bg-gray-50 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                }`}
            >
              <UserIcon className="w-5 h-5 shrink-0 text-gray-500" />
              <span>Profile Settings</span>
            </Link>

            {/* Help & FAQ Support Link with Online Badge */}
            <Link
              to="/help"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${location.pathname === '/help' 
                  ? 'bg-gray-50 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span>Help & Support</span>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Online
              </span>
            </Link>

          </nav>
        </div>

        {/* Bottom Section: Profile + Notifications + Logout */}
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
          
          {/* Notifications Trigger */}
          <div className="relative w-full" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50/50 hover:text-gray-900 transition-all
                ${showNotifications ? 'bg-gray-50 text-gray-900' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 shrink-0 text-gray-500" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-rust text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Portal */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 bottom-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Notifications</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 max-h-[250px] overflow-y-auto">
                    <NotificationStack
                      notifications={notifications}
                      onMarkRead={markAsRead}
                      onMarkAllRead={markAllRead}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Footer Card */}
          <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200/50 rounded-xl p-3">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand font-bold text-sm uppercase">{user?.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-xs font-bold text-gray-900 truncate">{user?.name}</span>
                <span className="text-[10px] text-brand font-semibold uppercase mt-0.5 tracking-wider truncate">
                  {user?.role}
                </span>
              </div>
            </Link>

            {/* Logout Confirm Trigger */}
            <AlertDialog>
              <AlertDialogTrigger>
                <button
                  className="text-gray-400 hover:text-rust transition-colors p-1"
                  title="Sign out"
                >
                  <LogOut className="w-4.5 h-4.5 shrink-0" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogPopup from="bottom" className="sm:max-w-[420px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will sign you out of your current session.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
          </div>

        </div>
      </aside>

      {/* ================================================================
          2. MOBILE HEADER & NAVIGATION - Mobile Viewports
          ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="md:hidden sticky top-0 z-40 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 rounded-xl text-gray-500 hover:bg-surface"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <Link to="/" className="flex items-center">
            <span className="text-lg font-bold text-brand">AssetFlow</span>
          </Link>

          <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-brand font-bold text-xs uppercase">{user?.name?.charAt(0)}</span>
            )}
          </Link>
        </header>

        {/* Mobile menu dropdown drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm md:hidden top-16"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="fixed inset-x-0 top-16 z-40 bg-white border-b border-gray-200 shadow-xl md:hidden p-4 flex flex-col gap-4 max-h-[calc(100vh-64px)] overflow-y-auto"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Navigation Links</span>
                  <nav className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Dashboard', path: '/', icon: Home, visible: true },
                      { name: 'Asset Directory', path: '/assets', icon: FolderOpen, visible: user?.role === 'Admin' },
                      { name: 'Custody Allocations', path: '/allocations', icon: KeyRound, visible: user?.role === 'Admin' },
                      { name: 'Resource Bookings', path: '/bookings', icon: ClipboardCheck, visible: user?.role === 'Admin' },
                      { name: 'Physical Audits', path: '/audits', icon: ClipboardCheck, visible: user?.role === 'Admin' },
                      { name: 'System Logs', path: '/logs', icon: Activity, visible: user?.role === 'Admin' },
                      { name: 'Reports & Analytics', path: '/reports', icon: BarChart2, visible: user?.role === 'Admin' },
                      { name: 'Org Setup', path: '/org-setup', icon: Settings, visible: user?.role === 'Admin' },
                      { name: 'Profile Settings', path: '/profile', icon: UserIcon, visible: true },
                      { name: 'Help & Support', path: '/help', icon: HelpCircle, visible: true },
                      { name: 'Maintenance Kanban', path: '/maintenance', icon: ExternalLink, visible: user?.role === 'Admin' }
                    ].filter(item => item.visible).map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-semibold
                            ${isActive ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:bg-surface'}`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                      <span className="text-brand font-bold text-xs uppercase">{user?.name?.charAt(0)}</span>
                    </div>
                    <span className="text-xs font-bold text-ink">{user?.name}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rust hover:bg-red-50 transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogPopup from="bottom" className="sm:max-w-[420px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will sign you out of your current session.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                          Sign out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogPopup>
                  </AlertDialog>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ================================================================
            3. MAIN CONTENT PANEL
            ================================================================ */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-surface">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
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
