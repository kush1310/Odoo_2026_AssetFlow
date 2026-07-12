import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Mail, ShieldAlert, Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AssetTagChip from '../components/AssetTagChip';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDemoToken('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message || "A reset link has been generated.");
      if (res.data.reset_token) {
        setDemoToken(res.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
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
            Recover Your<br />Account Access
          </h2>
          <p className="text-brand-deep text-lg max-w-md">
            Enter your registered work email to verify identity and generate a secure password reset token.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 right-10 flex flex-col gap-4 opacity-70 transform rotate-12">
          <AssetTagChip tag="RESET-AUTH" className="shadow-2xl scale-150" />
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
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500">Provide your account email address to receive a reset token</p>
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
              className="p-4 bg-green-50 border border-brand text-brand text-sm rounded-lg flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-brand" />
                <span className="font-semibold">{success}</span>
              </div>
              {demoToken && (
                <div className="mt-2 pt-2 border-t border-brand/20 text-xs text-brand-deep">
                  <span className="font-bold">Demo Mode Token Detected:</span>
                  <div className="bg-white/80 p-2 rounded border border-brand/20 font-mono select-all break-all my-1.5 font-bold">
                    {demoToken}
                  </div>
                  <Link 
                    to={`/reset-password?token=${encodeURIComponent(demoToken)}`}
                    className="underline font-bold hover:text-brand text-brand-deep text-xs mt-1 block"
                  >
                    Click here to instantly reset password with this token
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {!success && (
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 mt-2 shadow-md shadow-brand/20 animate-pulse-slow"
              >
                {loading ? "Sending..." : "Request Reset Token"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
