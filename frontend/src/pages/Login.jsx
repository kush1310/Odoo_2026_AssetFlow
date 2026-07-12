import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, Mail, ShieldAlert, Eye, EyeOff, Package, Zap, Shield, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GravityStars from '../components/ui/GravityStars';
import RippleButton from '../components/ui/RippleButton';
import AssetTagChip from '../components/AssetTagChip';

/**
 * Login
 *
 * Entry authentication screen for AssetFlow.
 * Features a full-screen GravityStars canvas background, a glassmorphism
 * login card, and a right-side brand panel with floating decorative elements.
 *
 * @param  {Function} setUser - App-level auth state setter; called on successful login
 * @returns {JSX.Element}
 */
const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * handleSubmit
   *
   * Submits credentials to POST /api/auth/login. On success, stores the
   * JWT access token, refresh token, and user profile in localStorage,
   * then lifts user state and navigates to the dashboard.
   * On failure, displays the sanitized error from the server.
   *
   * @param  {React.FormEvent} e - Form submission event
   * @validates email (RFC 5322 via type="email"), password (non-empty)
   * @redirects /dashboard on success; shows inline error on failure
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      localStorage.setItem('user', JSON.stringify({
        email: res.data.email,
        name:  res.data.name,
        role:  res.data.role,
        id:    res.data.id,
      }));
      setUser({ email: res.data.email, name: res.data.name, role: res.data.role, id: res.data.id });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Package,   label: 'Asset Registry',     desc: 'Track every device, furniture, and vehicle' },
    { icon: Shield,    label: 'Role-Based Access',   desc: 'Granular permissions per team member' },
    { icon: BarChart2, label: 'Live Analytics',      desc: 'Real-time custody and utilization insights' },
    { icon: Zap,       label: 'Instant Allocations', desc: 'One-click asset custody transfers' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface flex">

      {/* ── Gravity Stars — full-screen background ── */}
      <GravityStars starCount={120} starColor="#0F6E5F" className="z-0" />

      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex w-[52%] relative z-10 flex-col justify-between p-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-ink">AssetFlow</span>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl font-bold text-ink leading-tight tracking-tight"
          >
            Enterprise Asset<br />
            <span className="text-brand">Management,</span><br />
            Simplified.
          </motion.h1>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-white/70 backdrop-blur-sm border border-line rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">{label}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Floating asset tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 animate-float-slow"
          >
            <AssetTagChip tag="AF-0114" />
            <AssetTagChip tag="AF-0062" />
            <AssetTagChip tag="AF-0897" />
          </motion.div>
        </div>

        <p className="text-xs text-gray-400">© {new Date().getFullYear()} AssetFlow Systems Inc. All rights reserved.</p>
      </div>

      {/* ── Right: Login Form Card ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Glass card */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl shadow-brand/5 flex flex-col gap-6">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 justify-center">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-ink text-lg">AssetFlow</span>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-500">Sign in to your organization account</p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 text-rust text-sm rounded-xl">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="label">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="input-field pl-10 bg-white/80"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs text-brand hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10 bg-white/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-ink focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <RippleButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </RippleButton>
            </form>

            <div className="text-center text-sm text-gray-500 pt-2 border-t border-line/60">
              New here?{' '}
              <Link to="/signup" className="text-brand font-semibold hover:underline">
                Create an account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Login;
