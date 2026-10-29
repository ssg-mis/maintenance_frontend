import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Plus,
  Loader2,
  X,
  Clock,
  User,
  Building,
  Calendar,
  FileText
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

const ComplaintVerification: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Search fields specified in prompt: Beneficiary, Technician
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [searchTechnician, setSearchTechnician] = useState('');

  // Column visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    actions: true,
    plannedAt: true,
    delay: true,
    complaintId: true,
    beneficiary: true,
    technician: true,
    completedDate: true,
    decision: true,
    remarks: true,
    createdAt: true
  });

  // Verification Decision Modal State
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [decision, setDecision] = useState<'Verified' | 'Rejected' | 'Correction Needed'>('Verified');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load complaints from PostgreSQL database
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getComplaints({
        company: selectedCompany,
        limit: 200
      });
      setComplaints(res.complaints);
    } catch (err: any) {
      toast.error('Failed to load verification records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, refreshTrigger]);

  // Two tabs separation:
  // Two tabs separation:
  // Pending Verification: complaints requiring field verification decision or re-verification after correction
  // Verified Tasks: complaints with completed verification decision (Verified or Rejected)
  const pendingList = complaints.filter((c) => {
    // Already verified or rejected never belongs in pending verification
    if (c.verification_status === 'Verified' || c.verification_status === 'Rejected') {
      return false;
    }
    // Fully approved or closed tickets do not require pending verification
    if (c.status === 'Closed' || c.status === 'Approved' || c.is_approved) {
      return false;
    }
    // Keep pending when verification action or correction re-verification is genuinely required
    return (
      c.verification_status === 'Correction Needed' ||
      c.verification_status === 'Pending' ||
      c.status === 'Under Verification'
    );
  });

  const verifiedList = complaints.filter(
    (c) => c.verification_status === 'Verified' || c.verification_status === 'Rejected'
  );

  const currentList = activeTab === 'pending' ? pendingList : verifiedList;

  // Filter based on search inputs
  const filteredList = currentList.filter((c) => {
    const benMatch =
      !searchBeneficiary.trim() ||
      (c.beneficiary_name || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.id_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase());

    const techMatch =
      !searchTechnician.trim() ||
      (c.assigned_technician_name || '').toLowerCase().includes(searchTechnician.toLowerCase());

    return benMatch && techMatch;
  });

  const handleOpenDecision = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setVerificationRemarks(complaint.verification_remarks || '');
    if (
      complaint.verification_status === 'Correction Needed' ||
      complaint.verification_status === 'Rejected' ||
      complaint.verification_status === 'Verified'
    ) {
      setDecision(complaint.verification_status as 'Verified' | 'Rejected' | 'Correction Needed');
    } else {
      setDecision('Verified');
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;

    setIsSubmitting(true);
    try {
      await complaintService.verifyComplaint(activeComplaint.id, decision, verificationRemarks);
      toast.success(
        `Complaint ${activeComplaint.auto_complaint_id} recorded as ${decision} successfully!`
      );
      setActiveComplaint(null);
      setVerificationRemarks('');
      triggerRefresh();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to persist verification decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/complaints/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>

        {/* Tab Switcher: Pending Verification & Verified Tasks */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pending Verification</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'pending'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'verified'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Verified Tasks</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'verified'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {verifiedList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Filters: Beneficiary, Technician */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search beneficiary..."
              value={searchBeneficiary}
              onChange={(e) => setSearchBeneficiary(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technician..."
              value={searchTechnician}
              onChange={(e) => setSearchTechnician(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Header controls */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'pending' ? 'Tasks Pending Verification' : 'Verified Tasks Records'}
            </span>
            <span className="text-xs text-slate-400">
              ({filteredList.length} records)
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 z-30 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
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

        {/* Table Content */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading verification tasks from database...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No verification records found.
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
                  {visibleColumns.technician && <th className="px-4 py-3">Technician</th>}
                  {visibleColumns.completedDate && <th className="px-4 py-3">Completed Date</th>}
                  {visibleColumns.decision && <th className="px-4 py-3">Verification Decision</th>}
                  {visibleColumns.remarks && <th className="px-4 py-3">Remarks</th>}
                  {visibleColumns.createdAt && <th className="px-4 py-3">Created At</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredList.map((complaint) => {
                  const delayInfo = calculateDelay(
                    complaint.planned_at || complaint.complaint_date,
                    complaint.completed_date
                  );

                  return (
                    <tr
                      key={complaint.id}
                      className={`transition-colors ${getStatusRowStyle(complaint.status)}`}
                    >
                      {/* Actions */}
                      {visibleColumns.actions && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activeTab === 'pending' ? (
                            <button
                              onClick={() => handleOpenDecision(complaint)}
                              className={`px-3 py-1 font-semibold text-[11px] rounded border transition-colors ${
                                complaint.verification_status === 'Correction Needed'
                                  ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {complaint.verification_status === 'Correction Needed' ? 'Review / Re-verify' : 'Verify'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenDecision(complaint)}
                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              View / Edit
                            </button>
                          )}
                        </td>
                      )}

                      {/* Planned At */}
                      {visibleColumns.plannedAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(complaint.planned_at || complaint.created_at)}
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
                          {complaint.auto_complaint_id}
                        </td>
                      )}

                      {/* Beneficiary */}
                      {visibleColumns.beneficiary && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {complaint.beneficiary_name || 'N/A'}
                        </td>
                      )}

                      {/* Technician */}
                      {visibleColumns.technician && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {complaint.assigned_technician_name ? (
                            <span className="text-slate-800 dark:text-slate-200">
                              {complaint.assigned_technician_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      )}

                      {/* Completed Date */}
                      {visibleColumns.completedDate && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(complaint.completed_date || complaint.technician_updated_at)}
                        </td>
                      )}

                      {/* Verification Decision */}
                      {visibleColumns.decision && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              complaint.verification_status === 'Correction Needed'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : complaint.verification_status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : complaint.verification_status === 'Rejected'
                                ? 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800'
                                : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {complaint.verification_status || 'Pending'}
                          </span>
                        </td>
                      )}

                      {/* Remarks */}
                      {visibleColumns.remarks && (
                        <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={complaint.verification_remarks || complaint.technician_notes || ''}>
                          {complaint.verification_remarks || complaint.technician_notes || '-'}
                        </td>
                      )}

                      {/* Created At */}
                      {visibleColumns.createdAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDateTime(complaint.created_at)}
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

      {/* Verification Decision Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Verify Completed Task
                </h3>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Task Details Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Complaint ID:</span>
                  <span className="font-bold text-blue-600">{activeComplaint.auto_complaint_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Company & Project:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {activeComplaint.company} — {activeComplaint.project_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {activeComplaint.beneficiary_name || 'N/A'} ({activeComplaint.district || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Technician:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {activeComplaint.assigned_technician_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Technician Work Notes:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {activeComplaint.technician_notes || 'No work notes provided'}
                  </span>
                </div>
                {activeComplaint.verification_status && activeComplaint.verification_status !== 'Pending' && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Saved Decision:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      activeComplaint.verification_status === 'Correction Needed'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : activeComplaint.verification_status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}>
                      {activeComplaint.verification_status}
                      {activeComplaint.verified_by ? ` (by ${activeComplaint.verified_by})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Decision Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Verification Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('Verified')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'Verified'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('Correction Needed')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'Correction Needed'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Correction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('Rejected')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'Rejected'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Verification Remarks & Quality Findings
                </label>
                <textarea
                  rows={3}
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Enter audit remarks, quality checks, or reasons for correction/rejection..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Save Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintVerification;
