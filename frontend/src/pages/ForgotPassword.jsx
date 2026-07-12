import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GravityStars from '../components/ui/GravityStars';
import RippleButton from '../components/ui/RippleButton';
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
      const errMsg = err.response?.data?.detail || "Email recovery failed. Please verify the email is registered.";
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F9FAFB] flex items-center justify-center p-4">
      {/* Premium subtle stars background */}
      <GravityStars starCount={40} starColor="#7F56D9" className="z-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[400px] bg-white border border-gray-100 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-6"
      >
        {/* Key Icon inside styled frame — matches Image 1 */}
        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center shadow-sm">
          <Key className="w-5 h-5 text-gray-700" />
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Forgot password?
          </h1>
          <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-rust text-xs rounded-lg font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert / Demo Token */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-4 bg-green-50 border border-green-100 text-brand text-xs rounded-xl flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4.5 h-4.5 shrink-0 text-green-600" />
                <span className="font-semibold">{success}</span>
              </div>
              {demoToken && (
                <div className="mt-2 pt-2 border-t border-green-200/50 text-[11px] text-brand-deep">
                  <span className="font-bold">Demo reset token:</span>
                  <div className="bg-white p-2 rounded border border-green-200 font-mono select-all break-all my-1.5 font-bold">
                    {demoToken}
                  </div>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(demoToken)}`}
                    className="underline font-bold hover:text-brand text-brand-deep mt-1 block"
                  >
                    Click to reset instantly using this token
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition-all"
              />
            </div>

            <RippleButton
              type="submit"
              variant="purple"
              size="lg"
              disabled={loading}
              className="w-full mt-1"
            >
              {loading ? 'Sending...' : 'Reset password'}
            </RippleButton>
          </form>
        )}

        {/* Back Link */}
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to log in
        </Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
