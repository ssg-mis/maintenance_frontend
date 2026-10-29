export interface ComplaintDocument {
  name: string;
  url: string;
  size?: string;
  uploadedAt?: string;
}

export interface Complaint {
  id: string;
  auto_complaint_id: string;
  company: string;
  business_name: string;
  beneficiary_name?: string;
  id_number?: string;
  contact_number?: string;
  village?: string;
  block?: string;
  district?: string;
  project_name: string;
  nature_of_complaint: string;
  description?: string;
  complaint_date: string;
  mode_of_contact: 'call' | 'mail' | 'Whatapp' | string;
  status:
    | 'Open'
    | 'Assigned'
    | 'In Progress'
    | 'Under Verification'
    | 'Doc Verification'
    | 'Approved'
    | 'Completed'
    | 'Closed'
    | 'Insurance'
    | 'Rejected';
  assigned_technician_id?: number | null;
  assigned_technician_name?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  technician_notes?: string | null;
  technician_status?: 'Pending' | 'In Progress' | 'Resolved' | 'Cannot Repair';
  technician_updated_at?: string | null;
  is_insurance: boolean;
  insurance_details?: Record<string, any>;
  verification_status: 'Pending' | 'Verified' | 'Rejected' | 'Correction Needed';
  verified_by?: string | null;
  verified_at?: string | null;
  verification_remarks?: string | null;
  document_verification_status: 'Pending' | 'Verified' | 'Rejected' | 'Under Review';
  doc_verified_by?: string | null;
  doc_verified_at?: string | null;
  doc_verification_remarks?: string | null;
  is_approved: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_remarks?: string | null;
  documents?: ComplaintDocument[] | string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  planned_at?: string | null;
  completed_date?: string | null;
  closed_date?: string | null;
}

export interface ComplaintHistory {
  id: number;
  complaint_id: string;
  action: string;
  performed_by: string;
  performed_by_name?: string;
  details?: string;
  previous_state?: any;
  new_state?: any;
  created_at: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  pendingComplaints: number;
  completedComplaints: number;
  insuranceComplaints: number;
  docVerification?: {
    pending: number;
    verified: number;
    totalReviewed: number;
  };
  monthChange: {
    total: string;
    pending: string;
    completed: string;
    insurance: string;
  };
  badges: {
    assignComplaint: number;
    tracker: number;
    documentVerification: number;
    verification: number;
  };
  companies: string[];
}

export interface CreateComplaintInput {
  company: string;
  business_name?: string;
  beneficiary_name?: string;
  id_number?: string;
  contact_number?: string;
  village?: string;
  block?: string;
  district?: string;
  project_name: string;
  nature_of_complaint: string;
  description?: string;
  complaint_date?: string;
  mode_of_contact?: string;
  is_insurance?: boolean;
  insurance_details?: Record<string, any>;
  documents?: ComplaintDocument[];
}

export interface UpdateComplaintInput {
  company?: string;
  business_name?: string;
  beneficiary_name?: string;
  id_number?: string;
  contact_number?: string;
  village?: string;
  block?: string;
  district?: string;
  project_name?: string;
  nature_of_complaint?: string;
  description?: string;
  complaint_date?: string;
  mode_of_contact?: string;
  status?: string;
  is_insurance?: boolean;
  insurance_details?: Record<string, any>;
  documents?: ComplaintDocument[];
}
