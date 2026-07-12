import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ShieldAlert, Eye, EyeOff, CheckCircle2, User, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GravityStars from '../components/ui/GravityStars';
import RippleButton from '../components/ui/RippleButton';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import { useToast } from '../components/Toast';
import { LoadingIndicator } from "../components/application/loading-indicator/loading-indicator";

const Signup = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/auth/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department_id: formData.department_id ? parseInt(formData.department_id) : null
      });
      // Redirect to login after successful signup
      navigate('/login', { state: { message: "Account created successfully. Please log in." } });
    } catch (err) {
      let errMsg = err.response?.data?.detail;
      if (typeof errMsg === 'object' && errMsg !== null) {
        if (Array.isArray(errMsg)) {
          errMsg = errMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
        } else {
          errMsg = JSON.stringify(errMsg);
        }
      }
      errMsg = errMsg || 'Registration failed. Please check your details.';
      setError(errMsg);
      addToast(errMsg, 'error');
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
              <LoadingIndicator type="dot-circle" size="md" label="Creating Account..." />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create an account
          </h1>
          <p className="text-sm text-gray-500">
            Start tracking assets inside your team.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 text-[#E11D48] text-sm rounded-2xl flex items-center gap-3"
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="label">Department</label>
            <select
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select your department...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Work Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">Minimum 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 mt-2 shadow-lg shadow-brand/10 text-base"
            style={{ backgroundColor: '#7F56D9', color: 'white' }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-100">
          <span>Already have an account? </span>
          <Link to="/login" className="text-[#7F56D9] hover:text-[#693ec9] font-bold transition">
            Log in
          </Link>
        </div>

        <div className="text-center text-[10px] text-gray-400 mt-2">
          © {new Date().getFullYear()} AssetFlow Systems Inc.
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
