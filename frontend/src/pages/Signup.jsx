import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Key, Mail, ShieldAlert, Eye, EyeOff, Package, User } from 'lucide-react';
import { motion } from 'framer-motion';
import AssetTagChip from '../components/AssetTagChip';

const Signup = () => {
  const navigate = useNavigate();
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
      setError(err.response?.data?.detail || "Registration failed. Please check your details.");
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
            Join your<br />organization.
          </h2>
          <p className="text-teal-50/80 text-lg max-w-md leading-relaxed">
            Create an employee account to request assets, book resources, and track your allocations.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/3 left-10 flex flex-col gap-6 opacity-80 transform -rotate-12">
          <AssetTagChip tag="AF-NEW" className="shadow-2xl scale-150 border border-teal-500/20 bg-slate-900/90" />
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
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Create Account
            </h1>
            <p className="text-sm text-slate-400 font-medium">Sign up creates an employee account. Admins assign roles later.</p>
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
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
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
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
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
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
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2 shadow-lg shadow-brand/10 text-base"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-100">
            <span>Already have an account? </span>
            <Link to="/login" className="text-brand hover:text-brand-deep font-bold transition">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
