import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, Mail, ShieldAlert, Eye, EyeOff, Package } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-surface flex">
      {/* Brand Panel (Left) */}
      <div className="hidden lg:flex w-1/2 bg-brand p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-8">
            <Package className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight font-sans">AssetFlow</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Enterprise Asset &<br />Resource Management
          </h2>
          <p className="text-brand-deep text-lg max-w-md">
            Streamline allocations, track maintenance, and manage your organization's physical resources from a single unified platform.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 right-10 flex flex-col gap-4 opacity-70 transform rotate-12">
          <AssetTagChip tag="AF-0114" className="shadow-2xl scale-150" />
          <AssetTagChip tag="AF-0062" className="shadow-2xl scale-125 translate-x-12" />
          <AssetTagChip tag="AF-0897" className="shadow-2xl scale-110 -translate-x-8" />
        </div>

        <div className="relative z-10 text-brand-deep text-sm font-medium">
          © {new Date().getFullYear()} AssetFlow Systems Inc.
        </div>
      </div>

      {/* Form Panel (Right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-line rounded-2xl p-8 shadow-xl flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-rust text-rust text-sm rounded-lg flex items-center gap-3"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Work Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-ink focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 mt-2 shadow-md shadow-brand/20"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-4 border-t border-line">
            <span>New here? </span>
            <Link to="/signup" className="text-brand hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
