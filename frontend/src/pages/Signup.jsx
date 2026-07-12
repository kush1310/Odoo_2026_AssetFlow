import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GravityStars from '../components/ui/GravityStars';
import RippleButton from '../components/ui/RippleButton';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
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
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name:          formData.name,
        email:         formData.email,
        password:      formData.password,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
      });
      navigate('/login', { state: { message: 'Account created successfully. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    alert("Google SSO is simulated for this hackathon build.");
  };

  // Requirement status checks
  const hasEightChars = formData.password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

  const deptOptions = departments.map(d => ({ value: String(d.id), label: d.name }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F9FAFB] flex items-center justify-center p-4">
      {/* Premium subtle stars background */}
      <GravityStars starCount={50} starColor="#7F56D9" className="z-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[440px] bg-white border border-gray-100 rounded-2xl p-8 shadow-xl flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create an account
          </h1>
          <p className="text-sm text-gray-500">
            Start tracking assets inside your team.
          </p>
        </div>

        {/* Tab Group */}
        <div className="grid grid-cols-2 p-1 bg-gray-50 rounded-lg border border-gray-200/50">
          <div className="py-2 text-sm font-semibold text-gray-900 text-center bg-white rounded-md shadow-sm border border-gray-200/40">
            Sign up
          </div>
          <Link
            to="/login"
            className="py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 text-center rounded-md transition-colors"
          >
            Log in
          </Link>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-100 text-rust text-xs rounded-lg font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist — matches Image 2 */}
          <div className="flex flex-col gap-1.5 text-xs text-gray-500 mt-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasEightChars ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={hasEightChars ? 'text-gray-700 font-medium' : ''}>Must be at least 8 characters</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${hasSpecialChar ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={hasSpecialChar ? 'text-gray-700 font-medium' : ''}>Must contain one special character</span>
            </div>
          </div>

          {/* Department selection */}
          <div className="relative mt-1">
            <AnimatedSelect
              label="Department (optional)"
              placeholder="Select your department"
              options={deptOptions}
              value={formData.department_id}
              onChange={(val) => setFormData(prev => ({ ...prev, department_id: val }))}
            />
          </div>

          {/* Submit */}
          <RippleButton
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7F56D9] text-white hover:bg-[#693FD0] rounded-lg shadow-sm font-semibold transition-colors mt-2"
          >
            {loading ? 'Creating account...' : 'Get started'}
          </RippleButton>
        </form>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </button>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#7F56D9] hover:text-[#693FD0] hover:underline">
            Log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
