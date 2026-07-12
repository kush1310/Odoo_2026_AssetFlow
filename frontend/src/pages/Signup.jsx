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
    <div className="min-h-screen bg-surface flex">
      {/* Brand Panel (Left) */}
      <div className="hidden lg:flex w-1/2 bg-brand p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-8">
            <Package className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight font-sans">AssetFlow</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Join your<br />organization.
          </h2>
          <p className="text-brand-deep text-lg max-w-md">
            Create an employee account to request assets, book resources, and track your allocations.
          </p>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/3 left-10 flex flex-col gap-4 opacity-70 transform -rotate-12">
          <AssetTagChip tag="AF-NEW" className="shadow-2xl scale-150" />
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
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Create Account
            </h1>
            <p className="text-sm text-gray-500">Sign up creates an employee account. Admin roles are assigned later by an administrator.</p>
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="input-field pl-10"
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
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 mt-2 shadow-md shadow-brand/20"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-4 border-t border-line">
            <span>Already have an account? </span>
            <Link to="/login" className="text-brand hover:underline font-semibold">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
