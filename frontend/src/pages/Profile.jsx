import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  KeyRound, 
  Edit3, 
  Check, 
  Lock, 
  CalendarDays, 
  Package, 
  AlertCircle,
  Clock,
  ArrowRight,
  Upload
} from 'lucide-react';
import { useToast } from '../components/Toast';
import AssetTagChip from '../components/AssetTagChip';

const Profile = ({ user, setUser }) => {
  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'custody'

  // Profile Edit Form States
  const [name, setName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const imageUrl = uploadRes.data.url;

      const profileRes = await api.put('/auth/profile', {
        name: user.name,
        profile_picture: imageUrl
      });

      const updatedUser = { 
        ...user, 
        profile_picture: profileRes.data.profile_picture 
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      addToast("Profile picture updated successfully!", "success");
    } catch (err) {
      addToast("Failed to upload profile picture.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadData = async () => {
    try {
      const [resDepts, resAllocs, resBookings] = await Promise.all([
        api.get('/departments'),
        api.get('/allocations'),
        api.get('/bookings')
      ]);

      setDepartments(resDepts.data);
      // Filter allocations to only show active ones (approved or overdue)
      setAllocations(resAllocs.data.filter(a => a.state === 'approved' || a.state === 'overdue'));
      // Only keep bookings that are not cancelled
      setBookings(resBookings.data.filter(b => b.status !== 'Cancelled'));
    } catch (err) {
      console.error("Failed to load profile data", err);
      addToast("Failed to load some profile information.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Find department name by id
  const departmentName = departments.find(d => d.id === user?.department_id)?.name || 'N/A';

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Name cannot be empty.", "error");
      return;
    }
    if (name.trim().length < 2) {
      addToast("Name must be at least 2 characters.", "error");
      return;
    }

    setSavingName(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim() });
      const updatedUser = { ...user, name: res.data.name };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditingName(false);
      addToast("Profile name updated successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to update profile name.", "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      addToast("Password changed successfully!", "success");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || "Failed to change password. Please check your current password.");
      addToast("Password change failed.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      {/* PROFILE HEADER BADGE */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative group w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center font-extrabold text-3xl shadow-sm border border-brand/20 shrink-0 overflow-hidden cursor-pointer">
          {uploadingAvatar ? (
            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : user?.profile_picture ? (
            <img 
              src={`http://127.0.0.1:8000${user.profile_picture}`} 
              alt={user.name} 
              className="w-full h-full object-cover group-hover:opacity-40 transition" 
            />
          ) : (
            <span className="group-hover:opacity-20 transition">{user?.name?.charAt(0).toUpperCase()}</span>
          )}
          
          {!uploadingAvatar && (
            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-[10px] font-bold text-white">
              <Upload className="w-4 h-4 mb-0.5" />
              <span>Change</span>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
        </div>
        <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{user?.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-xs font-semibold text-brand">
              <Shield className="w-3.5 h-3.5" />
              {user?.role}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600">
              <Building2 className="w-3.5 h-3.5" />
              {departmentName}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Logged in as {user?.email}</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-line gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'profile' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Personal Info & Security
        </button>
        <button
          onClick={() => setActiveTab('custody')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'custody' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          My Custody & Bookings
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* PERSONAL DETAILS CARD */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-brand" /> Personal Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1 bg-surface p-4 rounded-xl border border-line">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Full Name</span>
                    {isEditingName ? (
                      <form onSubmit={handleUpdateName} className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input-field py-1 px-3 text-sm"
                          required
                          disabled={savingName}
                        />
                        <button 
                          type="submit" 
                          disabled={savingName}
                          className="btn btn-primary px-3 py-1 flex items-center justify-center"
                        >
                          {savingName ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setName(user?.name || ''); setIsEditingName(false); }}
                          className="btn btn-secondary px-3 py-1"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-ink">{user?.name}</span>
                        <button 
                          onClick={() => setIsEditingName(true)}
                          className="text-gray-400 hover:text-brand transition"
                          title="Edit Name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email (Read Only) */}
                  <div className="flex flex-col gap-1 bg-surface p-4 rounded-xl border border-line">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Email Address</span>
                    <div className="flex items-center justify-between mt-1 text-gray-500">
                      <span className="text-sm font-medium">{user?.email}</span>
                      <Mail className="w-4 h-4 opacity-50" />
                    </div>
                  </div>

                  {/* Role (Read Only) */}
                  <div className="flex flex-col gap-1 bg-surface p-4 rounded-xl border border-line">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Role Authority</span>
                    <div className="flex items-center justify-between mt-1 text-gray-500">
                      <span className="text-sm font-semibold text-brand">{user?.role}</span>
                      <Shield className="w-4 h-4 opacity-50 text-brand" />
                    </div>
                  </div>

                  {/* Department (Read Only) */}
                  <div className="flex flex-col gap-1 bg-surface p-4 rounded-xl border border-line">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Department</span>
                    <div className="flex items-center justify-between mt-1 text-gray-500">
                      <span className="text-sm font-medium">{departmentName}</span>
                      <Building2 className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECURITY / PASSWORD CHANGE CARD */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 mb-2">
                  <KeyRound className="w-5 h-5 text-brand" /> Login & Security
                </h3>

                <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
                  {passwordError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-rust text-xs font-semibold flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{passwordError}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                        className="input-field pl-10"
                        placeholder="••••••••"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                        className="input-field pl-10"
                        placeholder="Min 8 characters"
                      />
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                        className="input-field pl-10"
                        placeholder="••••••••"
                      />
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-fit mt-2"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Update Password
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custody"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* MY CUSTODY ALLOCATIONS */}
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand" /> Items in Custody
                  </h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                    {allocations.length} Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[500px] p-0 divide-y divide-line">
                  {allocations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-gray-200" />
                      No assets currently allocated to you.
                    </div>
                  ) : (
                    allocations.map(alloc => (
                      <div key={alloc.id} className="p-5 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-slate-500">{alloc.asset_name}</span>
                            <div className="mt-1">
                              <AssetTagChip tag={alloc.asset_tag || 'UNK'} />
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                            ${alloc.state === 'overdue' ? 'bg-red-50 text-rust border-red-200' : 'bg-green-50 text-green-700 border-green-200'}
                          `}>
                            {alloc.state}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Allocated: {alloc.allocation_date}
                          </span>
                          {alloc.expected_return_date && (
                            <span>Due: {alloc.expected_return_date}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* MY BOOKINGS */}
              <div className="bg-white border border-slate-100 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-brand" /> My Bookings
                  </h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                    {bookings.length} Active
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[500px] p-0 divide-y divide-line">
                  {bookings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
                      <CalendarDays className="w-8 h-8 text-gray-200" />
                      No bookings scheduled.
                    </div>
                  ) : (
                    bookings.map(book => {
                      const start = new Date(book.start_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      const end = new Date(book.end_time).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={book.id} className="p-5 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-500">{book.asset_name}</span>
                              <span className="text-[10px] text-gray-400 italic">"{book.purpose}"</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                              ${book.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${book.status === 'Ongoing' ? 'bg-brand/10 text-brand border-brand/20' : ''}
                              ${book.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            `}>
                              {book.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-2">
                            <CalendarDays className="w-3.5 h-3.5 text-brand" />
                            <span>{start} - {end}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Profile;
