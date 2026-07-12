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
  FileCheck,
  Loader2
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
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const handleExport = async (report) => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'csv') {
        const res = await api.get(report.endpoint);
        const data = res.data;
        
        if (!data || data.length === 0) {
          addToast("No data available to export for this report.", "error");
          setIsExporting(false);
          return;
        }

        // Robust JSON to CSV converter (handles nested objects safely)
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => 
          Object.values(obj).map(val => {
            if (val === null || val === undefined) return '""';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          }).join(',')
        );
        const csvString = [headers, ...rows].join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `AssetFlow_${report.id}_report_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        const res = await api.get(`${report.endpoint}?export=${selectedFormat}`, { responseType: 'blob' });
        const typeMap = {
          pdf: 'application/pdf',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        const blob = new Blob([res.data], { type: typeMap[selectedFormat] });
        triggerDownload(blob, `AssetFlow_${report.id}_report_${new Date().toISOString().split('T')[0]}.${selectedFormat}`);
      }
      addToast(`Successfully exported ${report.title} as ${selectedFormat.toUpperCase()}.`, "success");
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

  const currentReport = reportTypes.find(r => r.id === activeReport);

  // Auto-correct selectedFormat if active report doesn't support it
  React.useEffect(() => {
    if (currentReport && !currentReport.formats.includes(selectedFormat)) {
      setSelectedFormat(currentReport.formats[0]);
    }
  }, [activeReport]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="page-header items-center shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="page-title flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand" /> Analytics & Reporting
          </h2>
          <p className="page-subtitle">Generate compliance, lifecycle, and utilization reports in multiple formats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sidebar / List of Reports */}
        <div className="md:col-span-4 card p-4 h-fit">
          <h3 className="font-bold text-ink text-sm mb-4 px-2">Available Reports</h3>
          <div className="flex flex-col gap-1.5">
            {reportTypes.map(report => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition text-left w-full
                    ${isActive ? 'bg-[var(--bg-active)] shadow-sm ring-1 ring-brand/20' : 'hover:bg-[var(--bg-hover)]'}
                  `}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white dark:bg-brand/20 text-brand shadow-sm' : 'bg-[var(--bg-muted)] text-muted'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? 'text-brand' : 'text-secondary'}`}>
                    {report.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Detail Panel */}
        <div className="md:col-span-8 card p-6 md:p-10 flex flex-col justify-center min-h-[440px]">
          <AnimatePresence mode="wait">
            {reportTypes.map(report => report.id === activeReport && (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-center max-w-lg mx-auto gap-8 w-full"
              >
                <div className="w-20 h-20 bg-[var(--bg-muted)] rounded-full flex items-center justify-center border-4 border-[var(--bg-panel)] shadow-lg shadow-brand/10 mb-2">
                  <report.icon className="w-10 h-10 text-brand" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold text-ink tracking-tight">{report.title}</h3>
                  <p className="text-secondary leading-relaxed">{report.desc}</p>
                </div>
                
                <div className="w-full flex flex-col gap-3 text-left bg-[var(--bg-muted)] p-5 rounded-2xl border border-line">
                  <label className="label">Select Export Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    {report.formats.map(fmt => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedFormat(fmt)}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-bold transition uppercase tracking-wide text-center
                          ${selectedFormat === fmt 
                            ? 'bg-brand/10 border-brand text-brand shadow-sm ring-1 ring-brand/30' 
                            : 'bg-[var(--bg-panel)] border-line text-secondary hover:bg-[var(--bg-hover)]'
                          }
                        `}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-xs text-blue-800 dark:text-blue-300 text-left w-full">
                  <div className="grid grid-cols-1 gap-1.5 mb-2">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> <strong>Export Format:</strong> {selectedFormat.toUpperCase()}</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> <strong>Data Source:</strong> Live system snapshot</span>
                    {selectedFormat !== 'csv' && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> <strong>Generator:</strong> Backend report engine</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-500/20 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-blue-500" />
                    <span><strong>Note:</strong> Sensitive information like employee passwords are automatically excluded from the raw data endpoints.</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleExport(report)}
                  disabled={isExporting}
                  className="btn btn-primary w-full h-12 text-base shadow-brand shadow-lg"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Generate & Download {selectedFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Reports;
