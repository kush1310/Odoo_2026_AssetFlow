import React, { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  Camera, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  UserCheck,
  Shield, 
  Building2, 
  KeyRound, 
  Edit3, 
  Check, 
  Lock, 
  CalendarDays, 
  Package, 
  Clock,
  ArrowRight,
  Upload
} from 'lucide-react';
import RippleButton from '../components/ui/RippleButton';
import AssetTagChip from '../components/AssetTagChip';
import { AnimatePresence, motion } from 'framer-motion';

const Profile = ({ user, setUser }) => {
  const { addToast } = useToast();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'custody'

  // Profile Edit Form States
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Other',
    dob: '',
    company_username: '',
    employee_id_tag: '',
    profile_picture: ''
  });

  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfileData({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          gender: res.data.gender || 'Other',
          dob: res.data.dob || '',
          company_username: res.data.company_username || '',
          employee_id_tag: res.data.employee_id_tag || '',
          profile_picture: res.data.profile_picture ? (res.data.profile_picture.startsWith('http') ? res.data.profile_picture : `http://127.0.0.1:8000${res.data.profile_picture}`) : ''
        });
      } catch (err) {
        addToast("Failed to retrieve profile data.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate 5MB file limit
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addToast("Image size must be less than 5MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const imageUrl = `http://127.0.0.1:8000${uploadRes.data.url}`;
      setProfileData(prev => ({ ...prev, profile_picture: imageUrl }));
      addToast("Profile picture uploaded successfully!", "success");
    } catch (err) {
      addToast("Failed to upload profile picture.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Strips backend prefix if it is set as full url
      const relativePath = profileData.profile_picture.replace("http://127.0.0.1:8000", "");
      const res = await api.put('/auth/profile', {
        name: profileData.name,
        phone: profileData.phone,
        gender: profileData.gender,
        dob: profileData.dob || null,
        company_username: profileData.company_username,
        profile_picture: relativePath
      });

      addToast("Profile details updated successfully!", "success");
      
      // Update local storage user credentials
      const updatedUser = {
        ...user,
        name: res.data.name,
        profile_picture: res.data.profile_picture
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      addToast("Failed to update profile.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        old_password: currentPassword,
        new_password: newPassword
      });
      addToast("Password changed successfully!", "success");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const departmentName = departments.find(d => d.id === user?.department_id)?.name || "General Department";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      {/* PROFILE HEADER BADGE */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Avatar Upload Container */}
        <div className="relative group w-32 h-32 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center cursor-pointer shrink-0">
          {uploadingAvatar ? (
            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profileData.profile_picture ? (
            <img 
              src={profileData.profile_picture} 
              alt="Profile avatar" 
              className="w-full h-full object-cover group-hover:opacity-40 transition"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400 group-hover:opacity-40 transition" />
          )}
          {!uploadingAvatar && (
            <label className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <span className="text-[10px] font-semibold text-white mt-1">Upload Photo</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{profileData.name || "Enterprise Employee"}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-xs font-semibold text-brand">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role: <span className="font-semibold uppercase tracking-wider">{user?.role}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600">
              <Building2 className="w-3.5 h-3.5" />
              {departmentName}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Logged in as {profileData.email}</p>
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-brand" /> Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      value={profileData.name} 
                      onChange={handleInputChange} 
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="phone" 
                        placeholder="+1 (555) 000-0000"
                        value={profileData.phone} 
                        onChange={handleInputChange} 
                        className="input-field pl-9"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Gender</label>
                    <select 
                      name="gender" 
                      value={profileData.gender} 
                      onChange={handleInputChange} 
                      className="input-field"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Date of Birth</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="dob" 
                        value={profileData.dob} 
                        onChange={handleInputChange} 
                        className="input-field pl-9"
                      />
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Company Username</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="company_username" 
                        placeholder="username@company"
                        value={profileData.company_username} 
                        onChange={handleInputChange} 
                        className="input-field pl-9"
                      />
                      <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-ink uppercase tracking-wider border-l-2 border-rust pl-2 mt-4">Corporate Info (ReadOnly)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-line">
                  <div>
                    <label className="label text-gray-500">Corporate Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        disabled 
                        readOnly
                        value={profileData.email} 
                        className="input-field bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed pl-9"
                      />
                      <Mail className="w-4 h-4 text-gray-300 absolute left-3 top-3.5" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Email is managed by system administrator and cannot be modified.
                    </p>
                  </div>

                  <div>
                    <label className="label text-gray-500">Employee ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        disabled 
                        readOnly
                        value={profileData.employee_id_tag || "EMP-XXXX"} 
                        className="input-field bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed pl-9"
                      />
                      <Briefcase className="w-4 h-4 text-gray-300 absolute left-3 top-3.5" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Corporate tag key is immutable.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-line mt-4">
                  <RippleButton 
                    type="submit" 
                    variant="primary" 
                    disabled={submitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? "Saving Changes..." : "Save Profile Details"}
                  </RippleButton>
                </div>
              </form>
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
    </div>
  );
};

export default Profile;
