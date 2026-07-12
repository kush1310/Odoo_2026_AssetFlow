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
      let errMsg = err.response?.data?.detail;
      if (typeof errMsg === 'object' && errMsg !== null) {
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(errMsg);
        }
      }
      setError(errMsg || "Password reset failed. The token may be invalid or expired.");
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
            Create Your New<br />Secure Password
          </h2>
          <p className="text-brand-deep text-lg max-w-md">
            Choose a strong password containing at least 8 characters. Avoid using simple words or recycling passwords.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/3 left-10 flex flex-col gap-4 opacity-70 transform -rotate-12">
          <AssetTagChip tag="SECURE-KEY" className="shadow-2xl scale-150" />
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
          <div className="flex flex-col gap-2">
            <Link to="/login" className="text-xs text-gray-500 hover:text-brand flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500">Provide the token and configure a new password</p>
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

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-brand text-brand text-sm rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 shrink-0 text-brand" />
              <div className="flex flex-col">
                <span className="font-semibold">{success}</span>
                <span className="text-xs text-gray-600 mt-0.5">Redirecting you to login...</span>
              </div>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 mt-2 shadow-md shadow-brand/20"
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
