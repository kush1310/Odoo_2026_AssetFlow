import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, Mail, ShieldAlert, Eye, EyeOff, Package, User, Building2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GravityStars from '../components/ui/GravityStars';
import RippleButton from '../components/ui/RippleButton';
import AnimatedSelect from '../components/ui/AnimatedSelect';

/**
 * Signup
 *
 * Self-registration form for new employees. Loads department list from the
 * API for the department selector. On success, redirects to /login with a
 * success message. Accounts default to the "Employee" role — an Admin must
 * promote the user as needed.
 *
 * @returns {JSX.Element}
 * @validates name (non-empty), email (RFC 5322), password (min 8 chars), department (optional)
 * @redirects /login on success
 */
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

  /**
   * handleSubmit
   *
   * Posts form data to POST /api/auth/signup. On success, navigates to
   * /login with a success flash. On failure, renders server error inline.
   *
   * @param  {React.FormEvent} e
   * @validates All fields client-side before submission
   */
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

  const deptOptions = departments.map(d => ({ value: String(d.id), label: d.name }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface flex">

      {/* ── Gravity Stars ── */}
      <GravityStars starCount={100} starColor="#0F6E5F" className="z-0" />

      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex w-[48%] relative z-10 flex-col justify-between p-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-ink">AssetFlow</span>
        </div>

        <div className="flex flex-col gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold text-ink leading-tight"
          >
            Join your team<br />
            on <span className="text-brand">AssetFlow</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            {[
              { icon: UserCheck,  text: 'Request equipment and manage your allocations' },
              { icon: Building2,  text: 'Join your department and track shared resources' },
              { icon: Package,    text: 'Book meeting rooms and shared assets instantly' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-sm border border-line rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <p className="text-sm text-ink">{text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-xs text-gray-400">© {new Date().getFullYear()} AssetFlow Systems Inc.</p>
      </div>

      {/* ── Right: Signup Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl shadow-brand/5 flex flex-col gap-6">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 justify-center">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-ink text-lg">AssetFlow</span>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-ink tracking-tight">Create your account</h2>
              <p className="text-sm text-gray-500">
                Already have one?{' '}
                <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 text-rust text-sm rounded-xl">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Full name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="input-field pl-10 bg-white/80"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    className="input-field pl-10 bg-white/80"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="input-field pl-10 pr-10 bg-white/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-ink focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Department — AnimatedSelect */}
              <div className="relative">
                <AnimatedSelect
                  label="Department (optional)"
                  placeholder="Select your department"
                  options={deptOptions}
                  value={formData.department_id}
                  onChange={(val) => setFormData(prev => ({ ...prev, department_id: val }))}
                />
              </div>

              <RippleButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full mt-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </RippleButton>
            </form>

          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Signup;
