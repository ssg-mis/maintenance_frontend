import {
  Complaint,
  ComplaintStats,
  ComplaintHistory,
  CreateComplaintInput,
  UpdateComplaintInput
} from '../types/complaint';

const API_BASE = 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  let token = '';
  try {
    const rawAuth = localStorage.getItem('auth-storage');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      token = parsed?.state?.token || '';
    }
  } catch (e) {
    // ignore
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const complaintService = {
  /**
   * Fetch KPI stats and badge counts
   */
  async getStats(company?: string): Promise<{ success: boolean; stats: ComplaintStats }> {
    const query = company && company !== 'All Companies' ? `?company=${encodeURIComponent(company)}` : '';
    const res = await fetch(`${API_BASE}/complaints/stats${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch complaint statistics');
    }
    return res.json();
  },

  /**
   * Fetch list of complaints with search, filters, pagination
   */
  async getComplaints(params: {
    status?: string;
    company?: string;
    technicianId?: string;
    technicianName?: string;
    beneficiary?: string;
    project?: string;
    district?: string;
    verificationStatus?: string;
    docVerificationStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    isApproved?: boolean;
    isInsurance?: boolean;
  } = {}): Promise<{
    success: boolean;
    total: number;
    count: number;
    page: number;
    totalPages: number;
    complaints: Complaint[];
  }> {
    const urlParams = new URLSearchParams();
    if (params.status && params.status !== 'All Statuses') urlParams.append('status', params.status);
    if (params.company && params.company !== 'All Companies') urlParams.append('company', params.company);
    if (params.technicianId) urlParams.append('technicianId', params.technicianId);
    if (params.technicianName) urlParams.append('technicianName', params.technicianName);
    if (params.beneficiary) urlParams.append('beneficiary', params.beneficiary);
    if (params.project) urlParams.append('project', params.project);
    if (params.district) urlParams.append('district', params.district);
    if (params.verificationStatus) urlParams.append('verificationStatus', params.verificationStatus);
    if (params.docVerificationStatus) urlParams.append('docVerificationStatus', params.docVerificationStatus);
    if (params.search) urlParams.append('search', params.search);
    if (params.page) urlParams.append('page', String(params.page));
    if (params.limit) urlParams.append('limit', String(params.limit));
    if (params.sortBy) urlParams.append('sortBy', params.sortBy);
    if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder);
    if (params.isApproved !== undefined) urlParams.append('isApproved', String(params.isApproved));
    if (params.isInsurance !== undefined) urlParams.append('isInsurance', String(params.isInsurance));

    const res = await fetch(`${API_BASE}/complaints?${urlParams.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch complaints');
    }
    return res.json();
  },

  /**
   * Fetch single complaint with history
   */
  async getComplaintById(id: string): Promise<{
    success: boolean;
    complaint: Complaint;
    history: ComplaintHistory[];
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch complaint details');
    }
    return res.json();
  },

  /**
   * Create new complaint
   */
  async createComplaint(data: CreateComplaintInput): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create complaint');
    }
    return res.json();
  },

  /**
   * Edit complaint details
   */
  async updateComplaint(id: string, data: UpdateComplaintInput): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update complaint');
    }
    return res.json();
  },

  /**
   * Assign complaint to technician
   */
  async assignComplaint(
    id: string,
    technician_id: number | null,
    technician_name: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ technician_id, technician_name, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign complaint');
    }
    return res.json();
  },

  /**
   * Verification decision
   */
  async verifyComplaint(
    id: string,
    decision: 'Verified' | 'Rejected' | 'Correction Needed',
    remarks?: string
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, remarks })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit verification');
    }
    return res.json();
  },

  /**
   * Document verification decision
   */
  async verifyDocument(
    id: string,
    decision: 'Verified' | 'Rejected' | 'Under Review',
    remarks?: string,
    approve: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/verify-document`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, remarks, approve })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to verify documents');
    }
    return res.json();
  },

  /**
   * Final Approval
   */
  async approveComplaint(
    id: string,
    remarks?: string,
    closeTicket: boolean = false
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ remarks, closeTicket })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to approve complaint');
    }
    return res.json();
  },

  /**
   * Technician progress update
   */
  async updateTechnicianProgress(
    id: string,
    technician_status: string,
    technician_notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/technician-update`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ technician_status, technician_notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update technician status');
    }
    return res.json();
  },

  /**
   * Alias for technician update accepting object payload
   */
  async technicianUpdate(
    id: string,
    payload: {
      technicianStatus?: string;
      technicianNotes?: string;
      completedDate?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/technician-update`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update technician progress');
    }
    return res.json();
  },

  /**
   * Get complaints assigned to logged-in user
   */
  async getMyTasks(): Promise<{
    success: boolean;
    count: number;
    complaints: Complaint[];
  }> {
    const res = await fetch(`${API_BASE}/complaints/technician/my-tasks`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch technician tasks');
    }
    return res.json();
  },

  /**
   * Get report summary
   */
  async getReportSummary(params: {
    startDate?: string;
    endDate?: string;
    company?: string;
    project?: string;
  } = {}): Promise<{
    success: boolean;
    byStatus: { status: string; count: string }[];
    byCompany: { company: string; count: string }[];
    byProject: { project_name: string; count: string }[];
    byMode: { mode_of_contact: string; count: string }[];
  }> {
    const urlParams = new URLSearchParams();
    if (params.startDate) urlParams.append('startDate', params.startDate);
    if (params.endDate) urlParams.append('endDate', params.endDate);
    if (params.company && params.company !== 'All Companies') urlParams.append('company', params.company);
    if (params.project) urlParams.append('project', params.project);

    const res = await fetch(`${API_BASE}/complaints/reports/summary?${urlParams.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch report summary');
    }
    return res.json();
  },

  /**
   * Fetch technicians from existing /api/team
   */
  async getTechnicians(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/team`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || data.team || [];
  },

  /**
   * Advanced Report Analytics (Part 8)
   */
  async getReportAnalytics(params: {
    startDate?: string;
    endDate?: string;
    company?: string;
  } = {}): Promise<{
    success: boolean;
    analytics: {
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
    };
  }> {
    const urlParams = new URLSearchParams();
    if (params.startDate) urlParams.append('startDate', params.startDate);
    if (params.endDate) urlParams.append('endDate', params.endDate);
    if (params.company && params.company !== 'All Companies') urlParams.append('company', params.company);

    const res = await fetch(`${API_BASE}/complaints/reports/analytics?${urlParams.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch report analytics');
    }
    return res.json();
  },

  /**
   * Approved Complaints Stats (Part 11)
   */
  async getApprovedStats(company?: string): Promise<{
    success: boolean;
    stats: {
      totalApproved: number;
      thisMonth: number;
      avgApprovalTime: string;
    };
  }> {
    const query = company && company !== 'All Companies' ? `?company=${encodeURIComponent(company)}` : '';
    const res = await fetch(`${API_BASE}/complaints/approved-stats${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch approved statistics');
    }
    return res.json();
  },

  /**
   * Reopen Complaint (Part 11)
   */
  async reopenComplaint(id: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    complaint: Complaint;
  }> {
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reopen complaint');
    }
    return res.json();
  }
};
