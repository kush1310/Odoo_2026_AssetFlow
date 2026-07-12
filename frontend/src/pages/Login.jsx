import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ShieldAlert, Eye, EyeOff, Activity, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { LoadingIndicator } from "../components/application/loading-indicator/loading-indicator";
import GravityStars from '../components/ui/GravityStars';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLoginResponse = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        credential: response.credential
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
      setError(err.response?.data?.detail || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "148457849994-fqjcj2hdmops0t4flvoh27aa7hopdmpi.apps.googleusercontent.com",
          callback: handleGoogleLoginResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    initializeGoogle();

    const interval = setInterval(() => {
      if (window.google) {
        initializeGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

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
      addToast("Successfully logged in!", "success");
      navigate('/');
    } catch (err) {
      let errMsg = err.response?.data?.detail;
      if (typeof errMsg === 'object' && errMsg !== null) {
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(errMsg);
        }
      }
      errMsg = errMsg || 'Authentication failed. Please verify credentials.';
      setError(errMsg);
      addToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F9FAFB] flex items-center justify-center p-4">
      {/* Premium subtle star field background */}
      <GravityStars starCount={50} starColor="#7F56D9" className="z-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[440px] bg-white border border-gray-100 rounded-2xl p-8 shadow-xl flex flex-col gap-6 overflow-hidden"
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex items-center justify-center z-50"
            >
              <LoadingIndicator type="dot-circle" size="md" label="Authenticating..." />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-[#7F56D9]">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-2">
            AssetFlow Login
          </h1>
          <p className="text-sm text-gray-500">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="label">Work Email</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#7F56D9] transition-colors">
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
              <Link to="/forgot-password" className="text-xs font-semibold text-[#7F56D9] hover:underline">Forgot password?</Link>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-[#7F56D9] transition-colors">
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
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-900 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-12 mt-4 text-base shadow-brand"
            style={{ backgroundColor: '#7F56D9', color: 'white' }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold">Or continue with</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        <div id="googleSignInDiv" className="w-full flex justify-center"></div>

        <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-100">
          <span>New here? </span>
          <Link to="/signup" className="text-[#7F56D9] hover:text-[#693ec9] font-bold transition">
            Create an account
          </Link>
        </div>

        <div className="text-center text-[10px] text-gray-400 mt-2">
          © {new Date().getFullYear()} AssetFlow Systems Inc.
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
