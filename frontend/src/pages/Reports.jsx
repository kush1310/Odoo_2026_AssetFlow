import React, { useState } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  BarChart, 
  FileDown,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Wrench,
  FileCheck
} from 'lucide-react';
import { useToast } from '../components/Toast';

const reportTypes = [
  {
    id: 'utilization',
    title: 'Department Asset Utilization',
    icon: BarChart,
    desc: 'Analyze resource allocation density and active custody ratios across all departments.',
    endpoint: '/reports/utilization',
    formats: ['xlsx', 'pdf', 'csv']
  },
  {
    id: 'maintenance-freq',
    title: 'Maintenance Frequency',
    icon: Wrench,
    desc: 'Review breakdown frequency, repair status, and total requests per asset.',
    endpoint: '/reports/maintenance-frequency',
    formats: ['xlsx', 'pdf', 'csv']
  },
  {
    id: 'alloc-summary',
    title: 'Custody & Allocation Summary',
    icon: History,
    desc: 'Detailed custodian mapping, physical locations, and allocation records.',
    endpoint: '/reports/allocation-summary',
    formats: ['xlsx', 'pdf', 'csv']
  },
  {
    id: 'bookings-heatmap',
    title: 'Booking Heatmap',
    icon: FileSpreadsheet,
    desc: 'Analyze temporal distribution of resource booking density by day and hour.',
    endpoint: '/reports/booking-heatmap',
    formats: ['xlsx', 'csv']
  },
  {
    id: 'inventory-extract',
    title: 'Raw Inventory Extract',
    icon: FileDown,
    desc: 'Complete database export of all tracked physical assets and specifications.',
    endpoint: '/assets',
    formats: ['csv']
  },
  {
    id: 'audits-extract',
    title: 'Raw Verification Cycles',
    icon: FileCheck,
    desc: 'Historical records of all audit checks, including missing or damaged assets.',
    endpoint: '/audits',
    formats: ['csv']
  }
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState(reportTypes[0].id);
  const [isExporting, setIsExporting] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const { addToast } = useToast();

  const currentReport = reportTypes.find(r => r.id === activeReport);

  const handleExport = async (report, format) => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        const res = await api.get(report.endpoint);
        const data = Array.isArray(res.data) ? res.data : (res.data.data && Array.isArray(res.data.data) ? res.data.data : []);
        
        if (!data || data.length === 0) {
          addToast("No data available to export for this report.", "error");
          setIsExporting(false);
          return;
        }

        // Safe JSON to CSV converter (filters out nested objects/relations)
        const firstItem = data[0];
        const scalarKeys = Object.keys(firstItem).filter(key => {
          const val = firstItem[key];
          return val === null || val === undefined || typeof val !== 'object';
        });
        
        const headers = scalarKeys.join(',');
        const rows = data.map(obj => 
          scalarKeys.map(key => {
            const val = obj[key];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(',')
        );
        const csvString = [headers, ...rows].join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `AssetFlow_${report.id}_report_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        const res = await api.get(`${report.endpoint}?export=${format}`, { responseType: 'blob' });
        const typeMap = {
          pdf: 'application/pdf',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        const blob = new Blob([res.data], { type: typeMap[format] });
        triggerDownload(blob, `AssetFlow_${report.id}_report_${new Date().toISOString().split('T')[0]}.${format}`);
      }
      addToast(`Successfully exported ${report.title} as ${format.toUpperCase()}.`, "success");
    } catch (err) {
      addToast(`Failed to generate report: ${err.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    if (!currentReport) return;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      setPreviewData([]);
      try {
        const res = await api.get(currentReport.endpoint);
        const data = Array.isArray(res.data) ? res.data : (res.data.data && Array.isArray(res.data.data) ? res.data.data : []);
        setPreviewData(data.slice(0, 10)); // preview first 10 rows
      } catch (err) {
        console.error("Failed to load report preview", err);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, [activeReport]);

  const getPreviewHeaders = (item) => {
    if (!item) return [];
    return Object.keys(item).filter(key => {
      const val = item[key];
      return val === null || val === undefined || typeof val !== 'object';
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand" /> Analytics & Reporting
          </h2>
          <p className="text-sm text-gray-500">Generate compliance, lifecycle, and utilization reports in multiple formats.</p>
        </div>

        {/* Top-Right Download Dropdown */}
        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowDownloadDropdown(prev => !prev)}
            disabled={isExporting}
            className="btn btn-primary w-full md:w-auto flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 shrink-0" />
            )}
            <span>{isExporting ? "Exporting..." : "Download Report"}</span>
          </button>
          
          {showDownloadDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDownloadDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-line rounded-xl shadow-xl z-20 overflow-hidden py-1">
                {currentReport?.formats.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setShowDownloadDropdown(false);
                      handleExport(currentReport, fmt);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold hover:bg-surface text-ink flex items-center gap-2 transition"
                  >
                    <FileDown className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Export as {fmt.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sidebar / List of Reports */}
        <div className="md:col-span-4 bg-white border border-line rounded-2xl p-4 shadow-sm h-fit">
          <h3 className="font-bold text-ink text-sm mb-4 px-2">Available Reports</h3>
          <div className="flex flex-col gap-2">
            {reportTypes.map(report => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition text-left w-full
                    ${isActive ? 'bg-surface border border-line shadow-sm' : 'hover:bg-gray-50 border border-transparent'}
                  `}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white text-brand border border-line shadow-sm' : 'bg-surface text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? 'text-brand' : 'text-ink'}`}>
                    {report.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Detail Panel */}
        <div className="md:col-span-8 bg-white border border-line rounded-2xl p-6 md:p-8 shadow-sm flex flex-col min-h-[400px]">
          <AnimatePresence mode="wait">
            {reportTypes.map(report => report.id === activeReport && (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 w-full"
              >
                <div className="flex items-center gap-4 border-b border-line pb-4 text-left">
                  <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-line shadow-sm">
                    <report.icon className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{report.title}</h3>
                    <p className="text-xs text-gray-500">{report.desc}</p>
                  </div>
                </div>

                {/* Inline Preview Table */}
                <div className="flex flex-col gap-3 w-full text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview Table (Top 10 Records)</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                      Live Data
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-inner max-h-[300px] overflow-y-auto">
                    {previewLoading ? (
                      <div className="flex justify-center items-center py-16">
                        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : previewData.length === 0 ? (
                      <div className="py-16 text-center text-gray-500 text-xs">
                        No records found in this report query.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-surface border-b border-line sticky top-0 z-10">
                          <tr className="text-gray-500 font-semibold uppercase tracking-wider">
                            {getPreviewHeaders(previewData[0]).map(h => (
                              <th key={h} className="py-2.5 px-4 bg-surface border-b border-line whitespace-nowrap">{h.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line bg-white">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface transition-colors">
                              {getPreviewHeaders(row).map(h => (
                                <td key={h} className="py-2.5 px-4 font-medium text-ink whitespace-nowrap">
                                  {String(row[h] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 text-left">
                  <strong>Export Information:</strong> Use the "Download Report" dropdown at the top-right to save this data as CSV, Excel (XLSX), or PDF format.
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Reports;
