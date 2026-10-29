import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  MapPin,
  User,
  SlidersHorizontal,
  Search,
  Check,
  TrendingUp,
  Percent
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { useComplaintContext } from '../../context/ComplaintContext';
import toast from 'react-hot-toast';

interface ReportAnalytics {
  total: number;
  resolved: number;
  pending: number;
  inProgress: number;
  avgResolutionTime: string;
  topDistrict: string;
  topTechnician: string;
  resolutionRate: number;
  districtBreakdown: {
    district: string;
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  }[];
}

const ComplaintReport: React.FC = () => {
  const { selectedCompany, refreshTrigger } = useComplaintContext();
  const [loading, setLoading] = useState(true);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search in district breakdown
  const [districtSearch, setDistrictSearch] = useState('');

  // Columns visibility
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    district: true,
    total: true,
    resolved: true,
    pending: true,
    resolutionRate: true
  });

  // Analytics data
  const [data, setData] = useState<ReportAnalytics>({
    total: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    avgResolutionTime: '0 days',
    topDistrict: 'N/A',
    topTechnician: 'N/A',
    resolutionRate: 0,
    districtBreakdown: []
  });

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getReportAnalytics({
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
        company: selectedCompany
      });
      if (res?.analytics) {
        setData(res.analytics);
      }
    } catch (err: any) {
      toast.error('Failed to load report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedCompany, refreshTrigger]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadAnalytics();
  };

  const handleExportCSV = () => {
    try {
      if (data.districtBreakdown.length === 0) {
        toast.error('No report data available to export');
        return;
      }

      const headers = ['District', 'Total Complaints', 'Resolved', 'Pending', 'Resolution Rate %'];
      const rows = data.districtBreakdown.map((d) => [
        `"${d.district}"`,
        d.total,
        d.resolved,
        d.pending,
        `${d.resolutionRate}%`
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `complaint_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report CSV exported successfully!');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const filteredDistricts = data.districtBreakdown.filter((d) =>
    d.district.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Filter by Date Range:
            </span>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Complaints */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data.total}
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">Complaints</div>
        </div>

        {/* Resolved */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Resolved
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {data.resolved}
          </div>
          <div className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Completed</div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Pending
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {data.pending}
          </div>
          <div className="text-[10px] text-amber-600/80 font-medium mt-0.5">Open & Queue</div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {data.inProgress}
          </div>
          <div className="text-[10px] text-blue-600/80 font-medium mt-0.5">Under Field Work</div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Avg Resolution
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {data.avgResolutionTime}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Turnaround Time</div>
        </div>

        {/* Top District */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Top District
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate" title={data.topDistrict}>
            {data.topDistrict}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Max Grievances</div>
        </div>

        {/* Top Technician */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Top Tech
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate" title={data.topTechnician}>
            {data.topTechnician}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Max Resolved</div>
        </div>
      </div>

      {/* Resolution Rate Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Overall Resolution Rate
            </h3>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {data.resolutionRate}%
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, data.resolutionRate))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>0%</span>
          <span>{data.resolved} resolved of {data.total} complaints</span>
          <span>100% Target</span>
        </div>
      </div>

      {/* District-wise Breakdown Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Header controls */}
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              District-wise Breakdown
            </h3>
            <p className="text-[11px] text-slate-400">
              Aggregated grievance performance across all operating administrative districts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full sm:w-44 text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Column control */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumns(!showColumns)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>

              {showColumns && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 z-30 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Toggle Columns
                  </div>
                  {Object.keys(visibleColumns).map((colKey) => (
                    <label
                      key={colKey}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(colKey as keyof typeof visibleColumns)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{colKey.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading real-time district statistics from database...
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No district performance data found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.district && <th className="px-5 py-3">District</th>}
                  {visibleColumns.total && <th className="px-5 py-3">Total</th>}
                  {visibleColumns.resolved && <th className="px-5 py-3">Resolved</th>}
                  {visibleColumns.pending && <th className="px-5 py-3">Pending</th>}
                  {visibleColumns.resolutionRate && (
                    <th className="px-5 py-3">Resolution %</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredDistricts.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {visibleColumns.district && (
                      <td className="px-5 py-3 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                        {item.district}
                      </td>
                    )}
                    {visibleColumns.total && (
                      <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {item.total}
                      </td>
                    )}
                    {visibleColumns.resolved && (
                      <td className="px-5 py-3 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.resolved}
                      </td>
                    )}
                    {visibleColumns.pending && (
                      <td className="px-5 py-3 whitespace-nowrap font-semibold text-amber-600 dark:text-amber-400">
                        {item.pending}
                      </td>
                    )}
                    {visibleColumns.resolutionRate && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${item.resolutionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            {item.resolutionRate}%
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintReport;
