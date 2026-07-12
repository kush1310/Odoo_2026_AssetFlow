import React, { useState, useEffect } from 'react';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  History, 
  SlidersHorizontal, 
  Trash2, 
  Archive,
  QrCode,
  CheckCircle,
  AlertTriangle,
  X,
  MapPin,
  Tag,
  DollarSign,
  Activity,
  PackageSearch,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../components/Toast';
import AssetTagChip from '../components/AssetTagChip';

const AssetDirectory = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [showQRModal, setShowQRModal] = useState(false);
  const [simulatedTag, setSimulatedTag] = useState('');

  // Register Modal state (We'll use a styled modal for registration)
  const [showRegModal, setShowRegModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetAcqDate, setAssetAcqDate] = useState('');
  const [assetAcqCost, setAssetAcqCost] = useState('');
  const [assetCondition, setAssetCondition] = useState('New');
  const [assetLocation, setAssetLocation] = useState('');
  const [assetShared, setAssetShared] = useState(false);
  const [assetDept, setAssetDept] = useState('');
  const [assetImage, setAssetImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Detail Drawer state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [allocHistory, setAllocHistory] = useState([]);
  const [maintHistory, setMaintHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sell Asset state
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  const [sellBuyer, setSellBuyer] = useState('');
  const [sellNotes, setSellNotes] = useState('');
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState('');

  const loadData = async () => {
    try {
      const [resAssets, resCats, resDepts] = await Promise.all([
        api.get('/assets'),
        api.get('/categories'),
        api.get('/departments')
      ]);
      setAssets(resAssets.data);
      setCategories(resCats.data);
      setDepartments(resDepts.data);
    } catch (err) {
      addToast("Failed to fetch inventory directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAssetImage(res.data.url);
      addToast("Asset image uploaded successfully!", "success");
    } catch (err) {
      addToast("Failed to upload asset image.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', {
        name: assetName,
        category_id: parseInt(assetCategory),
        serial_number: assetSerial || null,
        acquisition_date: assetAcqDate,
        acquisition_cost: parseFloat(assetAcqCost),
        condition: assetCondition,
        location: assetLocation,
        shared_flag: assetShared,
        image: assetImage || null,
        department_id: assetDept ? parseInt(assetDept) : null
      });
      addToast("Asset successfully registered in repository!", "success");
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
      setAssetDept('');
      setAssetImage('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Asset registration failed.", "error");
    }
  };

  const handleSellAsset = async (e) => {
    e.preventDefault();
    setSellError('');
    if (!sellPrice || parseFloat(sellPrice) < 0) {
      setSellError("Please enter a valid selling price.");
      return;
    }
    if (!sellBuyer.trim()) {
      setSellError("Please enter the buyer's name.");
      return;
    }
    setSelling(true);
    try {
      await api.post(`/assets/${selectedAsset.id}/sell`, {
        sell_price: parseFloat(sellPrice),
        buyer: sellBuyer.trim(),
        notes: sellNotes.trim() || null
      });
      addToast("Asset marked as sold successfully!", "success");
      setShowSellModal(false);
      setSelectedAsset(null); // Close detail drawer
      setSellPrice('');
      setSellBuyer('');
      setSellNotes('');
      loadData(); // Reload directory
    } catch (err) {
      setSellError(err.response?.data?.detail || "Disposal request failed.");
      addToast(err.response?.data?.detail || "Failed to sell asset.", "error");
    } finally {
      setSelling(false);
    }
  };

  const loadAssetHistory = async (assetId) => {
    setHistoryLoading(true);
    try {
      const [resAlloc, resMaint] = await Promise.all([
        api.get('/allocations'),
        api.get('/maintenance')
      ]);
      setAllocHistory(resAlloc.data.filter(a => a.asset_id === assetId));
      setMaintHistory(resMaint.data.filter(m => m.asset_id === assetId));
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    loadAssetHistory(asset.id);
  };

  const downloadQR = () => {
    if (!selectedAsset) return;
    const svg = document.getElementById("qr-svg-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-${selectedAsset.tag}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    addToast(`QR Code for ${selectedAsset.tag} downloaded successfully.`, "success");
  };

  const printQR = () => {
    if (!selectedAsset) return;
    const svg = document.getElementById("qr-svg-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${selectedAsset.tag}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
            .label { margin-top: 15px; font-weight: bold; font-size: 16px; font-family: monospace; letter-spacing: 0.05em; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div style="transform: scale(1.5); display: flex; flex-direction: column; align-items: center;">
            ${svgData}
            <div class="label">${selectedAsset.tag}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter logic
  // Fuzzy match helper function
  const fuzzyMatch = (text, query) => {
    if (!query) return true;
    if (!text) return false;
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase();
    let queryIdx = 0;
    for (let charIdx = 0; charIdx < cleanText.length; charIdx++) {
      if (cleanText[charIdx] === cleanQuery[queryIdx]) {
        queryIdx++;
        if (queryIdx === cleanQuery.length) return true;
      }
    }
    return false;
  };

  // Filter logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      fuzzyMatch(asset.name, searchQuery) ||
      fuzzyMatch(asset.tag, searchQuery) ||
      (asset.serial_number && fuzzyMatch(asset.serial_number, searchQuery)) ||
      fuzzyMatch(asset.location, searchQuery);
    const matchesCategory = filterCategory === 'All' ? true : asset.category_id === parseInt(filterCategory);
    const matchesStatus = filterStatus === 'All' ? true : asset.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const allStatuses = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Asset Directory</h2>
          <p className="text-sm text-slate-400 font-medium">Search hardware listings, verify lifecycle statuses, and view audit history.</p>
        </div>
        {user?.role !== 'Employee' && (
          <button 
            onClick={() => setShowRegModal(true)}
            className="btn btn-primary whitespace-nowrap relative z-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register New Asset
          </button>
        )}
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-line p-5 rounded-2xl shadow-sm flex flex-col gap-5">
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tag, name, serial or location..."
              className="input-field pl-10 h-12 text-base"
            />
          </div>
          <RippleButton 
            type="button" 
            variant="secondary"
            onClick={() => setShowQRModal(true)} 
            className="flex items-center gap-2 px-4 border border-line rounded-xl"
          >
            <QrCode className="w-5.5 h-5.5 text-gray-500" />
            <span className="hidden sm:inline">Scan QR</span>
          </RippleButton>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterCategory('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
                  ${filterCategory === 'All' ? 'bg-brand text-white border-brand shadow-sm' : 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100'}
                `}
              >
                All
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setFilterCategory(c.id.toString())}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
                    ${filterCategory === c.id.toString() ? 'bg-brand text-white border-brand shadow-sm' : 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100'}
                  `}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-l-0 lg:border-l border-slate-100 lg:pl-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilterStatus('All')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
                  ${filterStatus === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100'}
                `}
              >
                All
              </button>
              {allStatuses.map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border
                    ${filterStatus === status ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-650 border-slate-100 hover:bg-slate-100'}
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ASSET GRID LIST */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Tag</th>
                  <th className="py-3.5 px-4">Asset Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <AnimatePresence>
                  {filteredAssets.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                          <PackageSearch className="w-10 h-10 text-gray-300" />
                          <p>No assets matching your criteria found.</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredAssets.map(asset => (
                      <motion.tr 
                        key={asset.id} 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-surface transition cursor-pointer group"
                        onClick={() => handleRowClick(asset)}
                      >
                        <td className="py-3 px-4"><AssetTagChip tag={asset.tag} /></td>
                        <td className="py-3 px-4 font-semibold text-ink group-hover:text-brand transition">{asset.name}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs font-medium">
                          {categories.find(c => c.id === asset.category_id)?.name || "Uncategorized"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {asset.location}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border
                            ${asset.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${asset.status === 'Allocated' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${asset.status === 'Reserved' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                            ${asset.status === 'Under Maintenance' ? 'bg-amber/10 text-amber border-amber/20' : ''}
                            ${asset.status === 'Lost' ? 'bg-red-50 text-rust border-red-200' : ''}
                            ${asset.status === 'Retired' || asset.status === 'Disposed' ? 'bg-gray-100 text-gray-500 border-gray-200' : ''}
                          `}>
                            {asset.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowRegModal(false)}
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleRegister} 
              className="relative w-full max-w-2xl bg-white border border-line rounded-2xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-2 border-b border-line pb-4">
                <h3 className="font-bold text-xl text-ink">Register New Asset</h3>
                <button type="button" onClick={() => setShowRegModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="label">Asset Name</label>
                  <input 
                    type="text" required value={assetName} onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. MacBook Pro M3 16-inch" className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select 
                    required value={assetCategory} onChange={(e) => setAssetCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Serial Number</label>
                  <input 
                    type="text" value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)}
                    placeholder="e.g. SN-998811A" className="input-field font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="label">Acquisition Date</label>
                  <input 
                    type="date" required value={assetAcqDate} onChange={(e) => setAssetAcqDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Acquisition Cost ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><DollarSign className="w-4 h-4"/></span>
                    <input 
                      type="number" step="0.01" required value={assetAcqCost} onChange={(e) => setAssetAcqCost(e.target.value)}
                      placeholder="0.00" className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Condition</label>
                  <select 
                    value={assetCondition} onChange={(e) => setAssetCondition(e.target.value)}
                    className="input-field"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="label">Location</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><MapPin className="w-4 h-4"/></span>
                    <input 
                      type="text" required value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)}
                      placeholder="e.g. HQ IT Storage" className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Owner Department (Optional)</label>
                  <select 
                    value={assetDept} onChange={(e) => setAssetDept(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-3 col-span-2 mt-2 p-4 bg-surface rounded-xl border border-line">
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" id="sharedFlag" checked={assetShared} onChange={(e) => setAssetShared(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="sharedFlag" className="text-sm font-semibold text-ink cursor-pointer">
                      Mark as shared/bookable resource
                    </label>
                    <span className="text-xs text-gray-500">Allow this item to be booked for short-term use (e.g. Projector, Pool Car, Meeting Space).</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="label">Upload Asset Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-brand transition flex flex-col items-center justify-center gap-2 relative bg-surface">
                    {assetImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={`http://127.0.0.1:8000${assetImage}`} 
                          alt="Asset Preview" 
                          className="max-h-36 rounded-lg object-contain border border-line"
                        />
                        <button 
                          type="button" 
                          onClick={() => setAssetImage('')}
                          className="btn btn-secondary py-1 px-3 text-xs text-rust border-red-105 hover:bg-red-50"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500">
                          {uploadingImage ? "Uploading file..." : "Drag and drop or browse files"}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-line mt-2">
                <button type="button" onClick={() => setShowRegModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Asset</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL SIDE DRAWER */}
      <AnimatePresence>
        {selectedAsset && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-line overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-line flex justify-between items-start bg-surface/50">
                <div className="flex flex-col gap-1.5">
                  <AssetTagChip tag={selectedAsset.tag} />
                  <h3 className="text-xl font-bold text-ink leading-tight">{selectedAsset.name}</h3>
                </div>
                <button onClick={() => setSelectedAsset(null)} className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* QR Code and Quick Stats */}
                <div className="flex gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white border border-line rounded-xl shadow-sm">
                      <QRCodeSVG 
                        id="qr-svg-code"
                        value={`${window.location.origin}/assets?search=${selectedAsset.tag}`}
                        size={80}
                        level={"L"}
                        includeMargin={false}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={downloadQR}
                        className="text-[10px] text-brand hover:underline font-bold"
                      >
                        Download
                      </button>
                      <span className="text-[10px] text-gray-300">|</span>
                      <button 
                        onClick={printQR}
                        className="text-[10px] text-brand hover:underline font-bold"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex justify-between items-center border-b border-line pb-2">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Status</span>
                      <span className="text-sm font-bold text-brand">{selectedAsset.status}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-line pb-2">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Condition</span>
                      <span className="text-sm font-medium text-ink">{selectedAsset.condition}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-line pb-2">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Serial</span>
                      <span className="text-sm font-mono text-ink">{selectedAsset.serial_number || "N/A"}</span>
                    </div>
                    {selectedAsset.department_name && (
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase">Department</span>
                        <span className="text-sm font-medium text-ink">{selectedAsset.department_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAsset.image && (
                  <div className="w-full h-48 bg-slate-50 border border-line rounded-xl overflow-hidden shadow-sm">
                    <img 
                      src={`http://127.0.0.1:8000${selectedAsset.image}`} 
                      alt={selectedAsset.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* History Section */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-ink border-b border-line pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand" /> Lifecycle History
                  </h4>
                  
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 relative">
                      {/* Timeline line */}
                      <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-line z-0"></div>
                      
                      {allocHistory.length === 0 && maintHistory.length === 0 ? (
                        <p className="text-sm text-gray-500 italic pl-10 z-10 bg-white py-1">No lifecycle events recorded yet.</p>
                      ) : (
                        <>
                          {/* We could sort these chronologically, but for demo we just show allocs then maints */}
                          {allocHistory.map((alloc, idx) => (
                            <div key={`alloc-${idx}`} className="relative pl-10 flex flex-col gap-1 z-10">
                              <div className="absolute left-[9px] top-1 w-3 h-3 rounded-full bg-brand ring-4 ring-white"></div>
                              <span className="text-sm font-semibold text-ink">
                                {alloc.state === 'approved' || alloc.state === 'returned' ? 'Allocated to' : 'Requested by'} User {alloc.employee_id}
                              </span>
                              <div className="flex justify-between items-center mt-1 p-3 bg-surface rounded-lg border border-line">
                                <span className="text-xs text-gray-500">Date: {alloc.allocation_date || 'Pending'}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">{alloc.state}</span>
                              </div>
                            </div>
                          ))}

                          {maintHistory.map((maint, idx) => (
                            <div key={`maint-${idx}`} className="relative pl-10 flex flex-col gap-1 z-10">
                              <div className="absolute left-[9px] top-1 w-3 h-3 rounded-full bg-amber ring-4 ring-white"></div>
                              <span className="text-sm font-semibold text-ink">Maintenance Logged</span>
                              <div className="flex flex-col gap-2 mt-1 p-3 bg-orange-50/50 rounded-lg border border-amber/20">
                                <span className="text-sm text-ink">{maint.issue_description}</span>
                                <div className="flex justify-between items-center pt-2 border-t border-amber/10">
                                  <span className="text-[10px] uppercase font-bold text-amber">Priority: {maint.priority}</span>
                                  <span className="text-[10px] uppercase font-bold text-gray-500">{maint.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Actions */}
              {user?.role !== 'Employee' && (
                <div className="p-4 border-t border-line bg-surface/50 flex gap-3">
                  <button className="flex-1 btn btn-secondary text-brand hover:bg-brand/5 border-brand/20">
                    Edit Asset
                  </button>
                  {selectedAsset.status !== 'Disposed' && selectedAsset.status !== 'Allocated' && (
                    <button 
                      onClick={() => setShowSellModal(true)}
                      className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 flex items-center justify-center gap-1.5 px-4"
                    >
                      <DollarSign className="w-4.5 h-4.5" />
                      Sell Asset
                    </button>
                  )}
                  <button className="btn btn-secondary text-rust hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR CODE SCANNER MODAL */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setShowQRModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-xl z-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink">Simulated QR Code Scanner</h3>
                <button type="button" onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-ink">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-brand/50">
                {/* Scan Grid Overlay Animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent animate-pulse" />
                <div className="absolute left-0 right-0 h-0.5 bg-brand shadow-lg shadow-brand/50 animate-bounce top-1/4" style={{ animationDuration: '3s' }} />
                
                <QrCode className="w-16 h-16 text-brand/80 animate-pulse relative z-10" />
                <span className="text-xs font-bold text-brand uppercase tracking-widest mt-3 relative z-10 animate-pulse">Pulsing Scan Laser Grid</span>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="label">Select Scannable Asset Tag</label>
                <div className="relative">
                  <AnimatedSelect
                    label="Choose tag to simulate scan"
                    placeholder="Choose tag to simulate scan"
                    options={assets.map(a => ({ value: a.tag, label: `${a.tag} - ${a.name} (${a.status})` }))}
                    value={simulatedTag}
                    onChange={setSimulatedTag}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <RippleButton type="button" variant="secondary" onClick={() => setShowQRModal(false)}>Cancel</RippleButton>
                <RippleButton 
                  type="button" 
                  variant="primary" 
                  disabled={!simulatedTag}
                  onClick={async () => {
                    try {
                      await api.post('/assets/qr-log', { tag: simulatedTag });
                      setSearchQuery(simulatedTag);
                      addToast(`Successfully scanned asset ${simulatedTag}! Scanned event registered in database.`, "success");
                      setShowQRModal(false);
                      setSimulatedTag('');
                    } catch (err) {
                      addToast("Failed to register scan event.", "error");
                    }
                  }}
                >
                  Trigger QR Scan
                </RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetDirectory;
