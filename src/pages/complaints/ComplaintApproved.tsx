import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  Search,
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  FileCheck2,
  RotateCcw,
  SlidersHorizontal,
  X,
  AlertTriangle,
  FolderCheck
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import {
  formatDate,
  formatDateTime,
  calculateDelay,
  getStatusRowStyle,
  getStatusBadgeStyle
} from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

interface ApprovedStats {
  totalApproved: number;
  thisMonth: number;
  avgApprovalTime: string;
}

const ComplaintApproved: React.FC = () => {
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ApprovedStats>({
    totalApproved: 0,
    thisMonth: 0,
    avgApprovalTime: '0 days'
  });
  const [loading, setLoading] = useState(true);

  // Search by ID, name, or district
  const [searchTerm, setSearchTerm] = useState('');

  // Column visibility
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    actions: true,
    plannedAt: true,
    delay: true,
    complaintId: true,
    beneficiary: true,
    district: true,
    technician: true,
    closedDate: true,
    createdAt: true,
    processedAt: true,
    status: true
  });

  // Reopen Modal
  const [reopeningComplaint, setReopeningComplaint] = useState<Complaint | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        complaintService.getComplaints({
          company: selectedCompany,
          isApproved: true,
          limit: 200
        }),
        complaintService.getApprovedStats(selectedCompany)
      ]);
      setComplaints(compRes.complaints);
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }
    } catch {
      toast.error('Failed to load approved complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, refreshTrigger]);

  // Filter based on search (ID, name, or district)
  const filteredComplaints = complaints.filter((c) => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    return (
      (c.auto_complaint_id || '').toLowerCase().includes(s) ||
      (c.beneficiary_name || '').toLowerCase().includes(s) ||
      (c.district || '').toLowerCase().includes(s) ||
      (c.village || '').toLowerCase().includes(s)
    );
  });

  const handleOpenReopen = (complaint: Complaint) => {
    setReopeningComplaint(complaint);
    setReopenReason('');
  };

  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningComplaint) return;

    setIsReopening(true);
    try {
      await complaintService.reopenComplaint(
        reopeningComplaint.id,
        reopenReason || 'Reopened by administrative supervisor'
      );
      toast.success(`Complaint ${reopeningComplaint.auto_complaint_id} reopened successfully!`);
      setReopeningComplaint(null);
      triggerRefresh();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reopen complaint');
    } finally {
      setIsReopening(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      {/* Three Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Approved */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">Total Approved</span>
            <ShieldCheck className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalApproved}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                All-time approved complaints
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              Verified & Closed
            </span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">This Month</span>
            <Calendar className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.thisMonth}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Processed in current month
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
              Current Period
            </span>
          </div>
        </div>

        {/* Average Approval Time */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">Average Approval Time</span>
            <Clock className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.avgApprovalTime}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Turnaround from creation to approval
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
              SLA Standard
            </span>
          </div>
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Approved Grievance Registry
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredComplaints.length} certified records)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search by ID, Name, or District */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, name, or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Columns Toggle */}
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
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 z-30 space-y-1">
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
            Loading approved complaints from database...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No approved complaints found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.actions && <th className="px-4 py-3">Actions</th>}
                  {visibleColumns.plannedAt && <th className="px-4 py-3">Planned At</th>}
                  {visibleColumns.delay && <th className="px-4 py-3">Delay</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.beneficiary && <th className="px-4 py-3">Beneficiary</th>}
                  {visibleColumns.district && <th className="px-4 py-3">District</th>}
                  {visibleColumns.technician && <th className="px-4 py-3">Technician</th>}
                  {visibleColumns.closedDate && <th className="px-4 py-3">Closed Date</th>}
                  {visibleColumns.createdAt && <th className="px-4 py-3">Created At</th>}
                  {visibleColumns.processedAt && <th className="px-4 py-3">Processed At</th>}
                  {visibleColumns.status && <th className="px-4 py-3">Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredComplaints.map((c) => {
                  const delayInfo = calculateDelay(
                    c.planned_at || c.complaint_date,
                    c.closed_date || c.completed_date
                  );

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${getStatusRowStyle(c.status)}`}
                    >
                      {/* Actions: Reopen */}
                      {visibleColumns.actions && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenReopen(c)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold text-[11px] rounded border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        </td>
                      )}

                      {/* Planned At */}
                      {visibleColumns.plannedAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(c.planned_at || c.created_at)}
                        </td>
                      )}

                      {/* Delay */}
                      {visibleColumns.delay && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {delayInfo.isDelayed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                              {delayInfo.text}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              On time
                            </span>
                          )}
                        </td>
                      )}

                      {/* Complaint ID */}
                      {visibleColumns.complaintId && (
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                          {c.auto_complaint_id}
                        </td>
                      )}

                      {/* Beneficiary */}
                      {visibleColumns.beneficiary && (
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {c.beneficiary_name || 'N/A'}
                        </td>
                      )}

                      {/* District */}
                      {visibleColumns.district && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {c.district || c.village || '-'}
                        </td>
                      )}

                      {/* Technician */}
                      {visibleColumns.technician && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {c.assigned_technician_name || 'Unassigned'}
                        </td>
                      )}

                      {/* Closed Date */}
                      {visibleColumns.closedDate && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(c.closed_date || c.completed_date)}
                        </td>
                      )}

                      {/* Created At */}
                      {visibleColumns.createdAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDateTime(c.created_at)}
                        </td>
                      )}

                      {/* Processed At */}
                      {visibleColumns.processedAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDateTime(c.approved_at || c.updated_at)}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyle(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reopen Action Modal */}
      {reopeningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Reopen Approved Complaint
                </h3>
              </div>
              <button
                onClick={() => setReopeningComplaint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-blue-600">
                  {reopeningComplaint.auto_complaint_id} — {reopeningComplaint.company}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Beneficiary: {reopeningComplaint.beneficiary_name} ({reopeningComplaint.district})
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Note: Reopening this complaint resets its status to Open and re-initiates the workflow for technician review.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Reopening <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="State the customer escalation or defect reason for reopening this complaint..."
                  required
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReopeningComplaint(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReopening || !reopenReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isReopening ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Confirm Reopen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintApproved;
