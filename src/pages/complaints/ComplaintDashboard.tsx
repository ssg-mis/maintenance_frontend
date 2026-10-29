import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import toast from 'react-hot-toast';

const ComplaintDashboard: React.FC = () => {
  const { selectedCompany, setSelectedCompany, companies, refreshTrigger, triggerRefresh } = useComplaintContext();
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch real statistics and complaint table records
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      complaintService.getStats(selectedCompany),
      complaintService.getComplaints({
        company: selectedCompany,
        status: statusFilter,
        search: searchQuery,
        limit: 100
      })
    ])
      .then(([statsRes, complaintsRes]) => {
        if (!mounted) return;
        setStats(statsRes.stats);
        setComplaints(complaintsRes.complaints);
        setTotalRecords(complaintsRes.total);
      })
      .catch((err) => {
        if (!mounted) return;
        toast.error('Failed to load dashboard data');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedCompany, statusFilter, searchQuery, refreshTrigger]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Determine row styling based on status matching reference screenshot
  const getRowClassName = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'closed' || s === 'completed') {
      return 'bg-[#f2fbf6] dark:bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-[#e6f7ee] dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-100';
    }
    if (s === 'open') {
      return 'bg-[#fefde8] dark:bg-amber-950/20 border-l-4 border-l-amber-400 hover:bg-[#fef9c3] dark:hover:bg-amber-950/30 text-slate-800 dark:text-slate-100';
    }
    if (s === 'assigned' || s === 'in progress') {
      return 'bg-[#f0f7ff] dark:bg-blue-950/20 border-l-4 border-l-blue-500 hover:bg-[#e0efff] dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-100';
    }
    return 'bg-white dark:bg-slate-900 border-l-4 border-l-slate-300 dark:border-l-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-100';
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Company Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Complaint Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time complaint tracking, metrics, and resolution status overview.
          </p>
        </div>

        {/* Company Dropdown Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company:</span>
          <div className="relative">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs cursor-pointer appearance-none"
            >
              {companies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dashboard Statistic Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
            <span className="font-semibold text-sm tracking-wide">Total Complaints</span>
            <Clock className="w-4 h-4 opacity-90" />
          </div>
          <div className="p-5">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.totalComplaints ?? (loading ? '...' : 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {stats?.monthChange?.total || '+12%'}
              </span>
              <span>Compared to last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
            <span className="font-semibold text-sm tracking-wide">Pending Complaints</span>
            <AlertTriangle className="w-4 h-4 opacity-90" />
          </div>
          <div className="p-5">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.pendingComplaints ?? (loading ? '...' : 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center text-red-500 dark:text-red-400 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {stats?.monthChange?.pending || '-5%'}
              </span>
              <span>Compared to last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Completed Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
            <span className="font-semibold text-sm tracking-wide">Completed Complaints</span>
            <CheckCircle2 className="w-4 h-4 opacity-90" />
          </div>
          <div className="p-5">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.completedComplaints ?? (loading ? '...' : 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {stats?.monthChange?.completed || '+18%'}
              </span>
              <span>Compared to last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Insurance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
            <span className="font-semibold text-sm tracking-wide">Insurance</span>
            <Shield className="w-4 h-4 opacity-90" />
          </div>
          <div className="p-5">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats?.insuranceComplaints ?? (loading ? '...' : 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {stats?.monthChange?.insurance || '+8%'}
              </span>
              <span>Compared to last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Tracker Table Container matching screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Complaint Tracker
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({totalRecords} records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status dropdown filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Insurance">Insurance</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-64 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Refresh button */}
            <button
              onClick={triggerRefresh}
              title="Refresh Data"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Auto Complaint ID</th>
                <th className="py-3 px-4">Complaint Date</th>
                <th className="py-3 px-4">ID Number</th>
                <th className="py-3 px-4">Beneficiary Name</th>
                <th className="py-3 px-4">Contact Number</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Block</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4 min-w-[280px]">Nature of Complaint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading complaint records from database...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No complaints found matching the criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors text-[13px] ${getRowClassName(item.status)}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {item.auto_complaint_id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(item.complaint_date)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {item.id_number || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {item.beneficiary_name || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.contact_number || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.village || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.block || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {item.district || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {item.project_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md line-clamp-2">
                      {item.nature_of_complaint}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDashboard;
