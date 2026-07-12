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
  Wrench
} from 'lucide-react';
import { useToast } from '../components/Toast';

const reportTypes = [
  {
    id: 'inventory',
    title: 'Complete Inventory Extract',
    icon: FileSpreadsheet,
    desc: 'Export all assets including status, location, category, and acquisition details.',
    endpoint: '/assets'
  },
  {
    id: 'lifecycle',
    title: 'Asset Lifecycle & Status',
    icon: BarChart,
    desc: 'View asset distribution by status (Available, Allocated, Maintenance, Lost, Retired).',
    endpoint: '/assets'
  },
  {
    id: 'audit',
    title: 'Audit Discrepancy Report',
    icon: AlertTriangle,
    desc: 'Extract results from closed verification cycles, highlighting missing or damaged items.',
    endpoint: '/audits'
  },
  {
    id: 'maintenance',
    title: 'Maintenance Cost & Downtime',
    icon: Wrench,
    desc: 'Review historical repair logs, technician assignments, and priority distributions.',
    endpoint: '/maintenance'
  },
  {
    id: 'allocations',
    title: 'Custody & Allocation History',
    icon: History,
    desc: 'Complete log of asset custody transfers, return dates, and employee assignments.',
    endpoint: '/allocations'
  }
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState(reportTypes[0].id);
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const handleExportCSV = async (report) => {
    setIsExporting(true);
    try {
      // For simplicity in this demo, we fetch the base data and convert to CSV on client
      const res = await api.get(report.endpoint);
      const data = res.data;
      
      if (!data || data.length === 0) {
        addToast("No data available to export for this report.", "error");
        setIsExporting(false);
        return;
      }

      // Very simple JSON to CSV converter for demo
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => 
        Object.values(obj).map(val => {
          if (val === null || val === undefined) return '""';
          // escape quotes and wrap in quotes
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      );
      
      const csvString = [headers, ...rows].join('\n');
      
      // Trigger download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `AssetFlow_${report.id}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast(`Successfully exported ${report.title}.`, "success");
    } catch (err) {
      addToast(`Failed to generate report: ${err.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-line shadow-sm gap-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand" /> Analytics & Reporting
          </h2>
          <p className="text-sm text-gray-500">Generate CSV exports for auditing, compliance, and financial review.</p>
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
                  className={`flex items-center gap-3 p-3 rounded-xl transition text-left
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
        <div className="md:col-span-8 bg-white border border-line rounded-2xl p-6 md:p-10 shadow-sm flex flex-col justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {reportTypes.map(report => report.id === activeReport && (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center max-w-lg mx-auto gap-6"
              >
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-brand/10 mb-2">
                  <report.icon className="w-10 h-10 text-brand" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold text-ink">{report.title}</h3>
                  <p className="text-gray-500">{report.desc}</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 text-left w-full my-2">
                  <strong>Export Format:</strong> CSV (Comma Separated Values)<br/>
                  <strong>Data Source:</strong> Live system snapshot<br/>
                  <strong>Note:</strong> Sensitive information like employee passwords are automatically excluded from the raw data endpoints.
                </div>
                
                <button 
                  onClick={() => handleExportCSV(report)}
                  disabled={isExporting}
                  className="btn btn-primary w-full h-12 text-base shadow-brand/20 shadow-lg mt-2"
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileDown className="w-5 h-5 mr-2" />
                      Generate & Download CSV
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
