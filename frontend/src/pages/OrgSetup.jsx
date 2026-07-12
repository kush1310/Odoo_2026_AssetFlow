import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Tag, 
  Users, 
  Plus, 
  UserCog, 
  Power,
  Search,
  X
} from 'lucide-react';
import { useToast } from '../components/Toast';

const OrgSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

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
      const [resDepts, resCats, resEmps] = await Promise.all([
        api.get('/departments'),
        api.get('/categories'),
        api.get('/employees')
      ]);

      setDepartments(resDepts.data);
      setCategories(resCats.data);
      setEmployees(resEmps.data);
    } catch (err) {
      addToast("Failed to load organization settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', {
        name: deptName,
        code: deptCode,
        parent_department_id: deptParent ? parseInt(deptParent) : null,
        manager_id: deptManager ? parseInt(deptManager) : null
      });
      addToast("Department successfully created!", "success");
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptParent('');
      setDeptManager('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to create department.", "error");
    }
  };

  const handleCreateCat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
        name: catName,
        code: catCode
      });
      addToast("Asset Category successfully created!", "success");
      setShowCatModal(false);
      setCatName('');
      setCatCode('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to create category.", "error");
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${promotionUser.id}/promote`, {
        role: promoteRole
      });
      addToast(`Successfully promoted ${promotionUser.name} to ${promoteRole}!`, "success");
      setPromotionUser(null);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to update employee role.", "error");
    }
  };

  const toggleUserStatus = async (userRecord) => {
    const targetStatus = userRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/employees/${userRecord.id}/status`, {
        status: targetStatus
      });
      addToast(`Successfully set status of ${userRecord.name} to ${targetStatus}!`, "success");
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to alter status.", "error");
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'categories', label: 'Asset Categories', icon: Tag },
    { id: 'employees', label: 'Employee Directory', icon: Users },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Organization Setup</h2>
          <p className="text-sm text-slate-400 font-medium">Configure departments, asset categories, and manage employee access.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors
                ${isActive ? 'text-brand' : 'text-slate-500 hover:text-slate-900'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="org-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                  initial={false}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {activeTab === 'departments' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-ink">Department Directory</h3>
                    <button 
                      onClick={() => setShowDeptModal(true)}
                      className="btn btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Department
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-surface border-b border-line">
                        <tr className="text-gray-500 font-semibold">
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Parent Dept</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        {departments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-8 text-center text-gray-500">No departments configured.</td>
                          </tr>
                        ) : (
                          departments.map(dept => (
                            <tr key={dept.id} className="hover:bg-surface transition">
                              <td className="py-3 px-4 font-mono text-brand font-bold">{dept.code}</td>
                              <td className="py-3 px-4 font-semibold text-ink">{dept.name}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {departments.find(d => d.id === dept.parent_department_id)?.name || "None"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border
                                  ${dept.status === 'Active' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-gray-50 text-gray-500 border-gray-200'}
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
                    <h3 className="font-bold text-lg text-ink">Asset Categories</h3>
                    <button 
                      onClick={() => setShowCatModal(true)}
                      className="btn btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categories.length === 0 ? (
                      <div className="col-span-3 py-8 text-center text-gray-500 border border-dashed border-line rounded-xl">
                        No asset categories configured.
                      </div>
                    ) : (
                      categories.map(cat => (
                        <div key={cat.id} className="p-5 bg-surface border border-line rounded-xl flex justify-between items-start hover:shadow-sm transition">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-bold text-ink">{cat.name}</span>
                            <span className="text-xs font-mono font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded uppercase w-fit">
                              {cat.code}
                            </span>
                          </div>
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md font-medium">
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
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-ink">Employee Directory & Access</h3>
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search employees..." 
                        className="input-field pl-9 w-64"
                      />
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-surface border-b border-line">
                        <tr className="text-gray-500 font-semibold">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Work Email</th>
                          <th className="py-3 px-4">System Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        {employees.map(emp => (
                          <tr key={emp.id} className="hover:bg-surface transition">
                            <td className="py-3 px-4 font-semibold text-ink">{emp.name}</td>
                            <td className="py-3 px-4 text-gray-500">{emp.email}</td>
                            <td className="py-3 px-4">
                              <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md font-medium">
                                {emp.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border
                                ${emp.status === 'Active' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'}
                              `}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => { setPromotionUser(emp); setPromoteRole(emp.role); }}
                                className="btn btn-secondary px-2.5 py-1.5 text-xs"
                                title="Change Role"
                              >
                                <UserCog className="w-4 h-4 mr-1" />
                                Role
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(emp)}
                                className={`btn px-2.5 py-1.5 text-xs border
                                  ${emp.status === 'Active'
                                    ? 'bg-white text-rust border-red-200 hover:bg-red-50'
                                    : 'bg-white text-brand border-brand/20 hover:bg-brand/5'}
                                `}
                              >
                                <Power className="w-4 h-4 mr-1" />
                                {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* DEPARTMENT MODAL */}
      <AnimatePresence>
        {showDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowDeptModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleCreateDept} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Create New Department</h3>
                <button type="button" onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              
              <div>
                <label className="label">Department Name</label>
                <input 
                  type="text" 
                  required 
                  value={deptName} 
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Department Code</label>
                <input 
                  type="text" 
                  required 
                  value={deptCode} 
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. DEPT-IT"
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="label">Parent Department (Optional)</label>
                <select 
                  value={deptParent} 
                  onChange={(e) => setDeptParent(e.target.value)}
                  className="input-field"
                >
                  <option value="">No Parent (Top Level)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Department Head (Optional)</label>
                <select 
                  value={deptManager} 
                  onChange={(e) => setDeptManager(e.target.value)}
                  className="input-field"
                >
                  <option value="">No Manager Assigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Department
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORY MODAL */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowCatModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleCreateCat} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Create Asset Category</h3>
                <button type="button" onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              
              <div>
                <label className="label">Category Name</label>
                <input 
                  type="text" required value={catName} onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Office Hardware" className="input-field"
                />
              </div>

              <div>
                <label className="label">Category Code</label>
                <input 
                  type="text" required value={catCode} onChange={(e) => setCatCode(e.target.value)}
                  placeholder="e.g. HW" className="input-field font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* PROMOTION DIALOG */}
      <AnimatePresence>
        {promotionUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setPromotionUser(null)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handlePromote} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-ink">Update System Role</h3>
                  <p className="text-sm text-gray-500 mt-1">Change permissions for <span className="font-semibold text-ink">{promotionUser.name}</span>.</p>
                </div>
                <button type="button" onClick={() => setPromotionUser(null)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="mt-2">
                <label className="label">Select Role</label>
                <select 
                  value={promoteRole} 
                  onChange={(e) => setPromoteRole(e.target.value)}
                  className="input-field"
                >
                  <option value="Employee">Employee (Default)</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Asset Manager">Asset Manager</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setPromotionUser(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Role</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrgSetup;
