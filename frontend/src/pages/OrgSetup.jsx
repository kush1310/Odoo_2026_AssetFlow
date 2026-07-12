import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Tag, 
  Users, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  UserCog, 
  Power,
  ChevronRight
} from 'lucide-react';

const OrgSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals / Form states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptParent, setDeptParent] = useState('');
  const [deptManager, setDeptManager] = useState('');

  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');

  const [promotionUser, setPromotionUser] = useState(null);
  const [promoteRole, setPromoteRole] = useState('Employee');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resDepts, resCats, resEmps] = await Promise.all([
        axios.get('http://localhost:8000/api/departments', { headers }),
        axios.get('http://localhost:8000/api/categories', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers })
      ]);

      setDepartments(resDepts.data);
      setCategories(resCats.data);
      setEmployees(resEmps.data);
    } catch (err) {
      setError("Failed to load organization settings.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/departments', {
        name: deptName,
        code: deptCode,
        parent_department_id: deptParent ? parseInt(deptParent) : null,
        manager_id: deptManager ? parseInt(deptManager) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Department successfully created!");
      setShowDeptModal(false);
      // Reset
      setDeptName('');
      setDeptCode('');
      setDeptParent('');
      setDeptManager('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create department.");
    }
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/categories', {
        name: catName,
        code: catCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Asset Category successfully created!");
      setShowCatModal(false);
      setCatName('');
      setCatCode('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create category.");
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/employees/${promotionUser.id}/promote`, {
        role: promoteRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Successfully promoted ${promotionUser.name} to ${promoteRole}!`);
      setPromotionUser(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update employee role.");
    }
  };

  const toggleUserStatus = async (userRecord) => {
    setError('');
    setSuccess('');
    const targetStatus = userRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/employees/${userRecord.id}/status`, {
        status: targetStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Successfully set status of ${userRecord.name} to ${targetStatus}!`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to alter status.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Organization Setup</h2>
          <p className="text-xs text-slate-400">Configure departments, asset categories, and promote/deactivate employee accounts.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/45 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/45 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1.5">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition
            ${activeTab === 'departments' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'}
          `}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition
            ${activeTab === 'categories' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'}
          `}
        >
          <Tag className="w-4 h-4" />
          <span>Asset Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition
            ${activeTab === 'employees' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'}
          `}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl">
        {activeTab === 'departments' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200">Department Directory</h3>
              <button 
                onClick={() => setShowDeptModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Department</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Parent Dept</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500">No departments configured.</td>
                    </tr>
                  ) : (
                    departments.map(dept => (
                      <tr key={dept.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{dept.code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{dept.name}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {departments.find(d => d.id === dept.parent_department_id)?.name || "None"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border
                            ${dept.status === 'Active' 
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                              : 'bg-slate-950/40 text-slate-400 border-slate-850'}
                          `}>
                            {dept.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-200">Asset Category Management</h3>
              <button 
                onClick={() => setShowCatModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-3 py-6 text-center text-slate-500 text-xs">No asset categories configured.</div>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="p-4 bg-slate-955 border border-slate-800 rounded-xl flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">{cat.code}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-md">
                      {cat.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-sm text-slate-200">Employee Directory & Access Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Work Email</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{emp.name}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{emp.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border
                          ${emp.status === 'Active' 
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' 
                            : 'bg-red-950/40 text-red-300 border-red-800'}
                        `}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setPromotionUser(emp); setPromoteRole(emp.role); }}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg font-medium transition"
                          title="Change Role"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>Role</span>
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(emp)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium border transition
                            ${emp.status === 'Active'
                              ? 'bg-red-950/30 text-red-400 border-red-900/60 hover:bg-red-950/50'
                              : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/50'}
                          `}
                          title={emp.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{emp.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleCreateDept} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create New Department</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Department Name</label>
              <input 
                type="text" 
                required 
                value={deptName} 
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Information Technology"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Department Code</label>
              <input 
                type="text" 
                required 
                value={deptCode} 
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="e.g. DEPT-IT"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Parent Department (Optional)</label>
              <select 
                value={deptParent} 
                onChange={(e) => setDeptParent(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">No Parent (Top Level)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Department Head (Optional)</label>
              <select 
                value={deptManager} 
                onChange={(e) => setDeptManager(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">No Manager Assigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Save Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleCreateCat} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Asset Category</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Category Name</label>
              <input 
                type="text" 
                required 
                value={catName} 
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Office Hardware"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Category Code</label>
              <input 
                type="text" 
                required 
                value={catCode} 
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="e.g. HW"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROMOTION DIALOG */}
      {promotionUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handlePromote} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Update System Role</h3>
            <p className="text-xs text-slate-400">Change permissions for employee <span className="text-slate-200 font-semibold">{promotionUser.name}</span>.</p>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-semibold text-slate-400">Select Role</label>
              <select 
                value={promoteRole} 
                onChange={(e) => setPromoteRole(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="Employee">Employee (Default)</option>
                <option value="Department Head">Department Head</option>
                <option value="Asset Manager">Asset Manager</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setPromotionUser(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Update Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrgSetup;
