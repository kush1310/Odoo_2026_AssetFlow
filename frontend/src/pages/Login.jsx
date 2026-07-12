import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, Mail, ShieldAlert, Eye, EyeOff, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AssetTagChip from '../components/AssetTagChip';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email,
        password
      });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      localStorage.setItem('user', JSON.stringify({
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        id: res.data.id
      }));
      setUser({
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        id: res.data.id
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex relative overflow-hidden" data-no-transition>
      
      {/* Brand Panel (Left) */}
      <div className="hidden lg:flex w-[55%] bg-brand p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated Gradient Mesh */}
        <div className="mesh-bg">
          <motion.div 
            animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="mesh-blob bg-[#14B8A6] w-96 h-96 top-0 left-0" 
          />
          <motion.div 
            animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.5, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="mesh-blob bg-[#0D5D57] w-[30rem] h-[30rem] bottom-0 right-0" 
          />
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 text-white mb-12"
          >
            <Package className="w-10 h-10" />
            <span className="text-3xl font-bold tracking-tight font-sans">AssetFlow</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Enterprise Asset &<br />Resource Management
            </h2>
            <p className="text-[#CCFBF1] text-lg max-w-lg leading-relaxed font-medium">
              Streamline allocations, track maintenance, and manage your organization's physical resources from a single unified platform.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex gap-8"
          >
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">99.9%</span>
              <span className="text-sm font-semibold text-[#14B8A6] uppercase tracking-wider">Uptime</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">10k+</span>
              <span className="text-sm font-semibold text-[#14B8A6] uppercase tracking-wider">Assets Tracked</span>
            </div>
          </motion.div>
        </div>
        
        {/* Floating Asset Tags */}
        <div className="absolute top-1/4 right-12 flex flex-col gap-6 opacity-90 transform rotate-12 z-10 pointer-events-none">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, type: "spring" }}
          >
            <div className="bg-[#0F172A]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-[#2DD4BF]/30 text-[#2DD4BF] font-mono text-lg font-bold shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              [ AF-0114 ]
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, type: "spring" }}
            className="translate-x-16"
          >
            <div className="bg-[#0F172A]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-[#2DD4BF]/30 text-[#2DD4BF] font-mono text-base font-bold shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              [ AF-0062 ]
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8, type: "spring" }}
            className="-translate-x-8"
          >
            <div className="bg-[#0F172A]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-[#2DD4BF]/30 text-[#2DD4BF] font-mono text-sm font-bold shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              [ AF-0897 ]
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-[#CCFBF1]/70 text-sm font-medium">
          © {new Date().getFullYear()} AssetFlow Systems Inc.
        </div>
      </div>

      {/* Form Panel (Right) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 z-10 bg-surface">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md card glass p-8 sm:p-10 flex flex-col gap-8"
        >
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="text-sm text-secondary font-medium">Sign in to your enterprise account</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Work Email</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-brand transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field pl-11 shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-brand transition-colors">
                  <Key className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11 shadow-sm font-mono text-lg tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-ink focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-12 mt-4 text-base shadow-brand"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center text-sm font-medium text-secondary pt-6 border-t border-line">
            <span>New to AssetFlow? </span>
            <Link to="/signup" className="text-brand hover:underline font-bold">
              Create an account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
