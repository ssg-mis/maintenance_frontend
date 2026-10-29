import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Loader2,
  SlidersHorizontal,
  Plus,
  Search,
  X,
  ShieldCheck,
  AlertCircle,
  FolderCheck,
  ExternalLink
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint, ComplaintDocument, ComplaintStats } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import {
  formatDate,
  formatDateTime,
  calculateDelay,
  getStatusRowStyle,
  getStatusBadgeStyle
} from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

const ComplaintDocVerification: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Search fields specified in prompt: Beneficiary, District
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  // Column visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    company: true,
    plannedAt: true,
    delay: true,
    complaintId: true,
    beneficiary: true,
    district: true,
    technician: true,
    closedDate: true,
    workNotes: true,
    createdAt: true
  });

  // Verify Documents Modal State
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [docDecision, setDocDecision] = useState<'Verified' | 'Rejected' | 'Under Review'>('Verified');
  const [isFinalApproval, setIsFinalApproval] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load complaints and summary stats from database
  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        complaintService.getComplaints({
          company: selectedCompany,
          limit: 200
        }),
        complaintService.getStats(selectedCompany)
      ]);
      setComplaints(compRes.complaints);
      setStats(statsRes.stats);
    } catch (err: any) {
      toast.error('Failed to load document verification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, refreshTrigger]);

  // Two tabs:
  // Pending Verification: document_verification_status IN ('Pending', 'Under Review')
  // Verified Documents: document_verification_status IN ('Verified', 'Rejected')
  const pendingDocsList = complaints.filter(
    (c) =>
      c.document_verification_status === 'Pending' ||
      c.document_verification_status === 'Under Review' ||
      c.status === 'Doc Verification'
  );

  const verifiedDocsList = complaints.filter(
    (c) =>
      c.document_verification_status === 'Verified' ||
      c.document_verification_status === 'Rejected'
  );

  const currentList = activeTab === 'pending' ? pendingDocsList : verifiedDocsList;

  // Filter based on search inputs
  const filteredList = currentList.filter((c) => {
    const benMatch =
      !searchBeneficiary.trim() ||
      (c.beneficiary_name || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.id_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase());

    const distMatch =
      !searchDistrict.trim() ||
      (c.district || '').toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (c.village || '').toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (c.block || '').toLowerCase().includes(searchDistrict.toLowerCase());

    return benMatch && distMatch;
  });

  // Top 3 summary cards calculated from database records
  const pendingDocCount = stats?.docVerification?.pending ?? pendingDocsList.length;
  const verifiedDocCount = stats?.docVerification?.verified ?? complaints.filter((c) => c.document_verification_status === 'Verified').length;
  // Total Reviewed: verified + rejected
  const totalReviewedCount = stats?.docVerification?.totalReviewed ?? complaints.filter((c) => c.document_verification_status === 'Verified' || c.document_verification_status === 'Rejected').length;

  const parseDocuments = (docs: any): ComplaintDocument[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  };

  const handleOpenDocModal = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setVerificationRemarks(complaint.doc_verification_remarks || '');
    if (
      complaint.document_verification_status === 'Verified' ||
      complaint.document_verification_status === 'Rejected' ||
      complaint.document_verification_status === 'Under Review'
    ) {
      setDocDecision(complaint.document_verification_status as 'Verified' | 'Rejected' | 'Under Review');
    } else {
      setDocDecision('Verified');
    }
    setIsFinalApproval(Boolean(complaint.is_approved));
  };

  const handleDocDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;

    setIsSubmitting(true);
    try {
      await complaintService.verifyDocument(
        activeComplaint.id,
        docDecision,
        verificationRemarks,
        docDecision === 'Verified' && activeComplaint.verification_status === 'Verified' ? isFinalApproval : false
      );
      toast.success(
        `Documents for ${activeComplaint.auto_complaint_id} saved as ${docDecision} successfully!`
      );
      setActiveComplaint(null);
      setVerificationRemarks('');
      triggerRefresh();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit document verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pending Doc Verification */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">
              Pending Doc Verification
            </span>
            <Clock className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {pendingDocCount}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Awaiting auditor sign-off
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              Action Required
            </span>
          </div>
        </div>

        {/* Card 2: Documents Verified */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">
              Documents Verified
            </span>
            <CheckCircle className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {verifiedDocCount}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Verified & approved records
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              Compliant
            </span>
          </div>
        </div>

        {/* Card 3: Total Reviewed (Rule: Verified + Rejected) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <span className="font-semibold text-xs tracking-wide">
              Total Reviewed
            </span>
            <FolderCheck className="w-4 h-4 text-blue-200" />
          </div>
          <div className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalReviewedCount}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Total completed audits (Approved + Rejected)
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
              Audited
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar & Tabs */}
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

        {/* Two Tabs: Pending Verification & Verified Documents */}
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
              {pendingDocsList.length}
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
            <span>Verified Documents</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'verified'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {verifiedDocsList.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2 Search Inputs: Beneficiary, District */}
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
              placeholder="Search district..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
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
              {activeTab === 'pending' ? 'Pending Document Verification' : 'Verified Documents Records'}
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
            Loading document verification records from database...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No document verification records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.action && <th className="px-4 py-3">Action</th>}
                  {visibleColumns.company && <th className="px-4 py-3">Company</th>}
                  {visibleColumns.plannedAt && <th className="px-4 py-3">Planned At</th>}
                  {visibleColumns.delay && <th className="px-4 py-3">Delay</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.beneficiary && <th className="px-4 py-3">Beneficiary</th>}
                  {visibleColumns.district && <th className="px-4 py-3">District</th>}
                  {visibleColumns.technician && <th className="px-4 py-3">Technician</th>}
                  {visibleColumns.closedDate && <th className="px-4 py-3">Closed Date</th>}
                  {visibleColumns.workNotes && <th className="px-4 py-3">Work Notes</th>}
                  {visibleColumns.createdAt && <th className="px-4 py-3">Created At</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredList.map((complaint) => {
                  const delayInfo = calculateDelay(
                    complaint.planned_at || complaint.complaint_date,
                    complaint.closed_date || complaint.completed_date
                  );

                  return (
                    <tr
                      key={complaint.id}
                      className={`transition-colors ${getStatusRowStyle(complaint.status)}`}
                    >
                      {/* Action */}
                      {visibleColumns.action && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activeTab === 'pending' ? (
                            <button
                              id={`verify-docs-btn-${complaint.id}`}
                              onClick={() => handleOpenDocModal(complaint)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-[11px] rounded border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              Verify Documents
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenDocModal(complaint)}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                View
                              </button>
                              {!complaint.is_approved && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await complaintService.approveComplaint(complaint.id, 'Approved via Document Verification');
                                      toast.success(`Complaint ${complaint.auto_complaint_id} approved!`);
                                      triggerRefresh();
                                      await loadData();
                                    } catch (err: any) {
                                      toast.error(err.message || 'Failed to approve');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] rounded border border-emerald-300 dark:border-emerald-700 transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Company */}
                      {visibleColumns.company && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                          {complaint.company}
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

                      {/* District */}
                      {visibleColumns.district && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {complaint.district || complaint.village || '-'}
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

                      {/* Closed Date */}
                      {visibleColumns.closedDate && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(complaint.closed_date || complaint.completed_date)}
                        </td>
                      )}

                      {/* Work Notes */}
                      {visibleColumns.workNotes && (
                        <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={complaint.technician_notes || complaint.description || ''}>
                          {complaint.technician_notes || complaint.description || '-'}
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

      {/* Verify Documents Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Document Audit & Verification
                </h3>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocDecisionSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Summary */}
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
              </div>

              {/* Uploaded Documents List */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Complaint Documents & Evidence
                </label>
                {(() => {
                  const docs = parseDocuments(activeComplaint.documents);
                  if (docs.length === 0) {
                    return (
                      <div className="p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                        No digital attachments uploaded with this complaint yet.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {docs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="truncate">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {doc.name || `Document-${idx + 1}`}
                              </p>
                              {doc.size && (
                                <p className="text-[10px] text-slate-400">{doc.size}</p>
                              )}
                            </div>
                          </div>
                          <a
                            href={doc.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Decision Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Document Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocDecision('Verified')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      docDecision === 'Verified'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocDecision('Under Review')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      docDecision === 'Under Review'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reviewing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocDecision('Rejected')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      docDecision === 'Rejected'
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-700 dark:text-red-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejected</span>
                  </button>
                </div>
              </div>

              {/* Final Approval Option */}
              {docDecision === 'Verified' && (
                <div
                  className={`p-3 rounded-xl border transition-colors ${
                    activeComplaint.verification_status === 'Verified'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-90'
                  }`}
                >
                  <label
                    className={`flex items-start gap-2.5 ${
                      activeComplaint.verification_status === 'Verified'
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                  >
                    <input
                      id="certify-approval-checkbox"
                      type="checkbox"
                      disabled={activeComplaint.verification_status !== 'Verified'}
                      checked={activeComplaint.verification_status === 'Verified' && isFinalApproval}
                      onChange={(e) => {
                        if (activeComplaint.verification_status === 'Verified') {
                          setIsFinalApproval(e.target.checked);
                        }
                      }}
                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5 disabled:opacity-50"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        Certify & Finalize Approval
                      </span>
                      {activeComplaint.verification_status === 'Verified' ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          Approve this grievance and move it to the Approved Registry.
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
                          Disabled: Field verification status is &quot;{activeComplaint.verification_status || 'Pending'}&quot;. Field verification must be &quot;Verified&quot; before final managerial approval can be granted.
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Auditor Remarks
                </label>
                <textarea
                  rows={3}
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Notes on warranty registration, proof accuracy, invoice validity..."
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
                  <span>Save Audit Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDocVerification;
