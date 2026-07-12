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
  UserCheck 
} from 'lucide-react';
import RippleButton from '../components/ui/RippleButton';

const Profile = ({ user, setUser }) => {
  const { addToast } = useToast();
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
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
          profile_picture: res.data.profile_picture || ''
        });
      } catch (err) {
        addToast("Failed to retrieve profile data.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate 5MB file limit
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addToast("Image size must be less than 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, profile_picture: reader.result }));
      addToast("Profile image loaded successfully.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put('/auth/profile', {
        name: profileData.name,
        phone: profileData.phone,
        gender: profileData.gender,
        dob: profileData.dob || null,
        company_username: profileData.company_username,
        profile_picture: profileData.profile_picture
      });

      addToast("Profile details updated successfully!", "success");
      
      // Update local storage user credentials
      const updatedUser = {
        ...user,
        name: res.data.name
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      addToast("Failed to update profile.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row gap-8 items-center border-b border-line pb-6 mb-6">
        {/* Avatar Upload Container */}
        <div className="relative group w-32 h-32 rounded-full border border-line bg-surface overflow-hidden flex items-center justify-center cursor-pointer shrink-0">
          {profileData.profile_picture ? (
            <img 
              src={profileData.profile_picture} 
              alt="Profile avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
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
        </div>

        <div className="flex flex-col gap-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-ink">{profileData.name || "Enterprise Employee"}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 justify-center md:justify-start">
            <ShieldCheck className="w-4 h-4 text-brand" />
            Role: <span className="font-semibold uppercase text-brand tracking-wider">{user?.role}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Max upload size: 5MB (PNG/JPG)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <h3 className="font-bold text-sm text-ink uppercase tracking-wider border-l-2 border-brand pl-2">Profile Details</h3>
        
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
  );
};

export default Profile;
