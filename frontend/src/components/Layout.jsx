import React, { useState, useEffect, useRef } from 'react';
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
  BarChart2,
  ChevronDown
} from 'lucide-react';
import { useToast } from './Toast';

/**
 * NavLink
 *
 * Renders a single navigation anchor in the notch bar.
 * Highlights with brand color when the current route matches the link's path.
 *
 * @param  {string}  to        - React Router destination path
 * @param  {React.ComponentType} icon - Lucide icon component
 * @param  {string}  label     - Display label
 * @param  {boolean} isActive  - Whether this link matches the current route
 * @param  {Function} onClick  - Optional click handler (used to close mobile menu)
 * @returns {JSX.Element}
 */
const NavLink = ({ to, icon: Icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`group flex items-center gap-1.5 text-sm font-medium transition-colors whitespace-nowrap px-1 py-0.5 rounded
      ${isActive
        ? 'text-brand font-semibold'
        : 'text-gray-500 hover:text-ink'
      }`}
  >
    <Icon className={`w-4 h-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
    <span>{label}</span>
    {isActive && (
      <motion.span
        layoutId="nav-dot"
        className="ml-0.5 w-1 h-1 rounded-full bg-brand"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
  </Link>
);

/**
 * Layout
 *
 * Application shell using a notch-style top navigation bar.
 * The notch floats at the top with curved SVG corner joints connecting it
 * to the page background. All navigation, user actions, and notifications
 * live inside the notch. A slide-down mobile drawer handles small screens.
 *
 * @param  {React.ReactNode} children   - Page content rendered below the notch
 * @param  {object}          user       - Current authenticated user (id, name, role)
 * @param  {Function}        setUser    - Setter to clear auth state on logout
 * @returns {JSX.Element}
 */
const Layout = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { addToast } = useToast();

  // -----------------------------------------------------------------------
  // Notifications polling (every 10 seconds)
  // -----------------------------------------------------------------------
  const fetchNotifications = async () => {
    try {
      if (!user) return;
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // -----------------------------------------------------------------------
  // Auth actions
  // -----------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // -----------------------------------------------------------------------
  // Notification actions
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // Navigation items — split into left and right groups for the notch
  // -----------------------------------------------------------------------
  const allNavItems = [
    { name: 'Dashboard',           path: '/',            icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Org Setup',           path: '/org-setup',   icon: Settings,        roles: ['Admin'] },
    { name: 'Assets',              path: '/assets',      icon: Package,         roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Allocations',         path: '/allocations', icon: KeyRound,        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Bookings',            path: '/bookings',    icon: CalendarDays,    roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Maintenance',         path: '/maintenance', icon: Wrench,          roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { name: 'Audits',              path: '/audits',      icon: ClipboardCheck,  roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Reports',             path: '/reports',     icon: BarChart2,       roles: ['Admin', 'Asset Manager', 'Department Head'] },
    { name: 'Logs',                path: '/logs',        icon: Activity,        roles: ['Admin'] },
  ];

  const allowedItems = allNavItems.filter(item => item.roles.includes(user?.role));

  // Split allowed items roughly in half: left side | right side
  const midpoint = Math.ceil(allowedItems.length / 2);
  const leftItems  = allowedItems.slice(0, midpoint);
  const rightItems = allowedItems.slice(midpoint);

  const unreadCount = notifications.filter(n => !n.read_status).length;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-surface font-sans text-ink">

      {/* ================================================================
          NOTCH NAVBAR
          Structure: [Left bar] [Left corner] [Center notch] [Right corner] [Right bar]
          ================================================================ */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-stretch pointer-events-none">

        {/* Left side background bar (matches page bg) */}
        <div className="flex-1 h-10 bg-surface self-start pointer-events-none" />

        {/* ── Notch pill ── */}
        <div className="flex h-16 shrink-0 pointer-events-auto" style={{ filter: 'drop-shadow(0 4px 24px rgba(15,110,95,0.08)) drop-shadow(0 1px 4px rgba(0,0,0,0.06))' }}>

          {/* Left curved corner */}
          <div className="w-12 h-full relative shrink-0">
            <div
              className="absolute inset-0 bg-white border-b border-l border-line"
              style={{ clipPath: "path('M0 0 H48 V64 C24 64 24 40 0 40 Z')" }}
            />
            {/* Subtle corner outline */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 48 64" fill="none">
              <path d="M0 39.5 C24 39.5 24 63.5 48 63.5" stroke="#DFE3E9" strokeWidth="0.75" />
            </svg>
          </div>

          {/* Center notch content */}
          <div className="bg-white border-b border-line flex items-end pb-2 px-4 md:px-6 gap-4 min-w-0 shrink-0
                          max-w-[calc(100vw-96px)]">

            {/* Desktop left nav items */}
            <nav className="hidden lg:flex items-center gap-5 mb-1 shrink-0">
              {leftItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.name}
                  isActive={location.pathname === item.path}
                />
              ))}
            </nav>

            {/* Mobile hamburger (left side of notch) */}
            <button
              className="lg:hidden mb-1 p-1.5 rounded-md text-gray-500 hover:text-ink hover:bg-surface transition-colors"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo — centered anchor of the notch */}
            <div className="flex items-end justify-center shrink-0 mx-2 md:mx-4 mb-1">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-sm group-hover:bg-brand-deep transition-colors">
                  <Package className="w-4 h-4 text-white" />
                </span>
                <span className="hidden sm:block text-sm font-bold tracking-tight text-ink">AssetFlow</span>
              </Link>
            </div>

            {/* Desktop right nav items */}
            <nav className="hidden lg:flex items-center gap-5 mb-1 shrink-0">
              {rightItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.name}
                  isActive={location.pathname === item.path}
                />
              ))}
            </nav>

            {/* Right action group: Bell + User + Logout */}
            <div className="flex items-center gap-1 md:gap-2 mb-1 ml-auto shrink-0 pl-3 border-l border-line">

              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="relative p-2 rounded-full text-gray-500 hover:text-ink hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-2 h-2 bg-rust rounded-full ring-2 ring-white"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-line bg-surface flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-2 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-brand hover:underline font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-line">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-400">No new notifications.</div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => markAsRead(notif.id)}
                              className={`px-4 py-3 cursor-pointer hover:bg-surface transition-colors flex flex-col gap-1
                                ${!notif.read_status ? 'border-l-2 border-l-brand bg-brand/[0.03]' : ''}`}
                            >
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{notif.type}</span>
                              <p className={`text-xs leading-relaxed ${!notif.read_status ? 'font-medium text-ink' : 'text-gray-600'}`}>
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {new Date(notif.created_date).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User avatar + name (desktop) */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                  {user?.name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-ink max-w-[80px] truncate">{user?.name}</span>
                  <span className="text-[10px] font-medium text-brand uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-rust hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rust"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right curved corner */}
          <div className="w-12 h-full relative shrink-0">
            <div
              className="absolute inset-0 bg-white border-b border-r border-line"
              style={{ clipPath: "path('M0 0 H48 V40 C24 40 24 64 0 64 Z')" }}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 48 64" fill="none">
              <path d="M0 63.5 C24 63.5 24 39.5 48 39.5" stroke="#DFE3E9" strokeWidth="0.75" />
            </svg>
          </div>

        </div>
        {/* ── end notch pill ── */}

        {/* Right side background bar */}
        <div className="flex-1 h-10 bg-surface self-start pointer-events-none" />

      </header>

      {/* ================================================================
          MOBILE DROPDOWN MENU (slides down from notch)
          ================================================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-x-4 top-[72px] z-50 bg-white border border-line rounded-2xl shadow-2xl overflow-hidden lg:hidden"
            >
              {/* User info strip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-line">
                <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold ring-2 ring-white">
                  {user?.name?.charAt(0) || <UserIcon className="w-5 h-5" />}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-ink">{user?.name}</span>
                  <span className="text-xs font-medium text-brand uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col p-2">
                {allowedItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                        ${isActive
                          ? 'bg-brand/10 text-brand'
                          : 'text-gray-600 hover:bg-surface hover:text-ink'
                        }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout row */}
              <div className="border-t border-line p-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rust hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================
          PAGE CONTENT — offset below the 64px notch
          ================================================================ */}
      <main className="pt-20 min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        </div>
      </main>

    </div>
  );
};

export default Layout;
