import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import { Key, ShieldAlert, Package, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AssetTagChip from '../components/AssetTagChip';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to auto-populate token from URL query params
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        new_password: newPassword
      });
      setSuccess("Your password has been successfully reset.");
      setTimeout(() => {
        navigate('/login', { state: { message: "Password updated successfully. Please log in with your new password." } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Password reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex bg-grid-pattern relative overflow-hidden">
      {/* Decorative Glow Orb */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-light/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Panel (Left) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-deep via-brand to-brand p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle grid pattern in panel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-sm">
              <Package className="w-6 h-6 text-brand-light" />
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">AssetFlow</span>
          </div>
          <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Create Your New<br />Secure Password
          </h2>
          <p className="text-teal-50/80 text-lg max-w-md leading-relaxed">
            Choose a strong password containing at least 8 characters. Avoid using simple words or recycling passwords.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/3 left-10 flex flex-col gap-6 opacity-80 transform -rotate-12">
          <AssetTagChip tag="SECURE-KEY" className="shadow-2xl scale-150 border border-teal-500/20 bg-slate-900/90" />
        </div>

        <div className="relative z-10 text-teal-100/50 text-xs font-semibold tracking-wider">
          © {new Date().getFullYear()} ASSETFLOW SYSTEMS. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Form Panel (Right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-10 shadow-2xl flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <Link to="/login" className="text-xs text-slate-400 hover:text-brand flex items-center gap-1 mb-2 font-bold transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Reset Password
            </h1>
            <p className="text-sm text-slate-400 font-medium">Provide the token and configure a new password</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 text-rust text-sm rounded-2xl flex items-center gap-3"
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-teal-50/50 border border-teal-200 text-brand text-sm rounded-2xl flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 shrink-0 text-brand animate-bounce" />
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">{success}</span>
                <span className="text-xs text-slate-450 mt-0.5 font-medium">Redirecting you to login...</span>
              </div>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label">Reset Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the code token"
                  className="input-field font-mono text-sm"
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Minimum 8 characters</p>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 mt-2 shadow-lg shadow-brand/10 text-base"
              >
                {loading ? "Resetting..." : "Update Password"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
