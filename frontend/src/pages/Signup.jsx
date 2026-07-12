import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Key, ShieldCheck, ShieldAlert } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/auth/signup', {
        name,
        email,
        password
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-xs text-slate-400">Registers an Employee Account in the directory</p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Work Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-600/10"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Already have an account? </span>
          <Link to="/login" className="text-indigo-400 hover:underline font-medium">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
