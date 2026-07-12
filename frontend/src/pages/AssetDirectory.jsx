import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  History, 
  SlidersHorizontal, 
  Trash2, 
  Archive,
  QrCode,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

const AssetDirectory = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Register Modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetAcqDate, setAssetAcqDate] = useState('');
  const [assetAcqCost, setAssetAcqCost] = useState('');
  const [assetCondition, setAssetCondition] = useState('New');
  const [assetLocation, setAssetLocation] = useState('');
  const [assetShared, setAssetShared] = useState(false);

  // Detail Modal state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allocHistory, setAllocHistory] = useState([]);
  const [maintHistory, setMaintHistory] = useState([]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resAssets, resCats] = await Promise.all([
        axios.get('http://localhost:8000/api/assets', { headers }),
        axios.get('http://localhost:8000/api/categories', { headers })
      ]);
      setAssets(resAssets.data);
      setCategories(resCats.data);
    } catch (err) {
      setError("Failed to fetch inventory directory.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/assets', {
        name: assetName,
        category_id: parseInt(assetCategory),
        serial_number: assetSerial || null,
        acquisition_date: assetAcqDate,
        acquisition_cost: parseFloat(assetAcqCost),
        condition: assetCondition,
        location: assetLocation,
        shared_flag: assetShared
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Asset successfully registered in repository!");
      setShowRegModal(false);
      // Reset
      setAssetName('');
      setAssetCategory('');
      setAssetSerial('');
      setAssetAcqDate('');
      setAssetAcqCost('');
      setAssetCondition('New');
      setAssetLocation('');
      setAssetShared(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Asset registration failed.");
    }
  };

  const loadAssetHistory = async (assetId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resAlloc, resMaint] = await Promise.all([
        axios.get('http://localhost:8000/api/allocations', { headers }),
        axios.get('http://localhost:8000/api/maintenance', { headers })
      ]);
      setAllocHistory(resAlloc.data.filter(a => a.asset_id === assetId));
      setMaintHistory(resMaint.data.filter(m => m.asset_id === assetId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    loadAssetHistory(asset.id);
  };

  // Filtered Assets list
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = filterCategory ? asset.category_id === parseInt(filterCategory) : true;
    const matchesStatus = filterStatus ? asset.status === filterStatus : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Asset Registry Directory</h2>
          <p className="text-xs text-slate-400">Search hardware listings, verify lifecycle statuses, and view audit history.</p>
        </div>
        {user?.role !== 'Employee' && (
          <button 
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        )}
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

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-850 p-4 rounded-xl shadow-md">
        <div className="relative col-span-1 md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tag, name, serial or location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-200"
          />
        </div>

        <div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-400"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition text-slate-400"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
            <option value="Disposed">Disposed</option>
          </select>
        </div>
      </div>

      {/* ASSET GRID LIST */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Tag</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">No assets matching criteria found.</td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{asset.tag}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{asset.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {categories.find(c => c.id === asset.category_id)?.name || "Uncategorized"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-450">{asset.location}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold text-slate-350">{asset.condition}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border
                        ${asset.status === 'Available' ? 'bg-emerald-950/40 text-emerald-350 border-emerald-800' : ''}
                        ${asset.status === 'Allocated' ? 'bg-indigo-950/40 text-indigo-350 border-indigo-800' : ''}
                        ${asset.status === 'Reserved' ? 'bg-blue-950/40 text-blue-350 border-blue-800' : ''}
                        ${asset.status === 'Under Maintenance' ? 'bg-yellow-950/40 text-yellow-350 border-yellow-800' : ''}
                        ${asset.status === 'Lost' ? 'bg-red-950/40 text-red-350 border-red-800' : ''}
                        ${asset.status === 'Retired' || asset.status === 'Disposed' ? 'bg-slate-950/40 text-slate-450 border-slate-850' : ''}
                      `}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleRowClick(asset)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                        title="View Asset History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleRegister} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="font-bold text-base text-white">Register Asset</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-400">Asset Name</label>
                <input 
                  type="text" 
                  required 
                  value={assetName} 
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. Dell Latitude 5420"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Category</label>
                <select 
                  required
                  value={assetCategory} 
                  onChange={(e) => setAssetCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Serial Number</label>
                <input 
                  type="text" 
                  value={assetSerial} 
                  onChange={(e) => setAssetSerial(e.target.value)}
                  placeholder="e.g. SN-998811A"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Acquisition Date</label>
                <input 
                  type="date" 
                  required
                  value={assetAcqDate} 
                  onChange={(e) => setAssetAcqDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Acquisition Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={assetAcqCost} 
                  onChange={(e) => setAssetAcqCost(e.target.value)}
                  placeholder="e.g. 1200.00"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Condition</label>
                <select 
                  value={assetCondition} 
                  onChange={(e) => setAssetCondition(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-350"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Location</label>
                <input 
                  type="text" 
                  required
                  value={assetLocation} 
                  onChange={(e) => setAssetLocation(e.target.value)}
                  placeholder="e.g. Conference Room A"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 col-span-2 mt-2">
                <input 
                  type="checkbox" 
                  id="sharedFlag"
                  checked={assetShared}
                  onChange={(e) => setAssetShared(e.target.checked)}
                  className="w-4.5 h-4.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="sharedFlag" className="text-xs font-semibold text-slate-350 cursor-pointer">
                  Mark as shared/bookable resource (e.g. Meeting Space, Pool Vehicle)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowRegModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Register Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL & HISTORY MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wider uppercase">{selectedAsset.tag}</span>
                <h3 className="font-bold text-lg text-white">{selectedAsset.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Asset quick details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-850 rounded-xl text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">Serial</span>
                <span className="font-mono text-slate-300">{selectedAsset.serial_number || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">Cost</span>
                <span className="text-slate-300 font-semibold">${selectedAsset.acquisition_cost}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">Condition</span>
                <span className="text-slate-300">{selectedAsset.condition}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">Current Status</span>
                <span className="text-indigo-400 font-bold">{selectedAsset.status}</span>
              </div>
            </div>

            {/* History Tabs */}
            <div className="flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custody & Maintenance History</span>
              </div>

              <div className="flex flex-col gap-6">
                {/* Allocation History */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-300">Allocation Records</span>
                  {allocHistory.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No allocations recorded.</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {allocHistory.map(alloc => (
                        <div key={alloc.id} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850/60 rounded-lg text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-350">Custodian ID: {alloc.employee_id}</span>
                            <span className="text-[10px] text-slate-500">Assigned: {alloc.allocation_date}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold
                            ${alloc.state === 'returned' ? 'text-slate-400' : 'text-emerald-400'}
                          `}>
                            {alloc.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maintenance History */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-300">Maintenance & Repairs</span>
                  {maintHistory.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No repairs logged.</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {maintHistory.map(maint => (
                        <div key={maint.id} className="flex justify-between items-center p-3 bg-slate-950/30 border border-slate-850/60 rounded-lg text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-350">{maint.issue_description}</span>
                            <span className="text-[10px] text-slate-500">Priority: {maint.priority}</span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase">{maint.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDirectory;
