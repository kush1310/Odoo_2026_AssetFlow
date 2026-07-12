import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, ShieldAlert, CheckCircle, ArrowLeft, Mail, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AssetTagChip from '../components/AssetTagChip';
import { useToast } from '../components/Toast';

const ForgotPassword = () => {
  const { addToast } = useToast();
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
      const successMsg = res.data.message || "Reset token has been generated.";
      setSuccess(successMsg);
      addToast(successMsg, "success");
      if (res.data.reset_token) {
        setDemoToken(res.data.reset_token);
      }
    } catch (err) {
      let errMsg = err.response?.data?.detail;
      if (typeof errMsg === 'object' && errMsg !== null) {
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(errMsg);
        }
      }
      errMsg = errMsg || "Email recovery failed. Please verify the email is registered.";
      setError(errMsg);
      addToast(errMsg, "error");
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
            Recover Your<br />Account Access
          </h2>
          <p className="text-teal-50/80 text-lg max-w-md leading-relaxed">
            Enter your registered work email to verify identity and generate a secure password reset token.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 right-10 flex flex-col gap-6 opacity-80 transform rotate-12">
          <AssetTagChip tag="RESET-AUTH" className="shadow-2xl scale-150 border border-teal-500/20 bg-slate-900/90" />
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
              Forgot Password
            </h1>
            <p className="text-sm text-slate-400 font-medium">Provide your account email address to receive a reset token</p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
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
          </AnimatePresence>

          {/* Success Alert / Demo Token */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-teal-50/50 border border-teal-200 text-brand-deep text-sm rounded-2xl flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 text-brand" />
                  <span className="font-bold">{success}</span>
                </div>
                {demoToken && (
                  <div className="mt-2 pt-3 border-t border-teal-200/50 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Demo Mode Token:</span>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-teal-200 font-mono select-all break-all my-2 font-bold text-slate-700">
                      {demoToken}
                    </div>
                    <Link
                      to={`/reset-password?token=${encodeURIComponent(demoToken)}`}
                      className="btn btn-primary w-full py-2 text-xs font-semibold shadow-sm"
                    >
                      Instantly Reset Password
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="label">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 mt-2 shadow-lg shadow-brand/10 text-base"
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
