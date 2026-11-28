export type AdminReportItemStatus = 'open' | 'in_progress' | 'resolved';

// N11: "Loại sự cố" — real triage categories instead of free text only.
export type AdminReportIssueType = 'question_error' | 'display_bug' | 'system_error' | 'other';

export interface OwnerRef {
  _id: string;
  email: string;
  fullName: string;
}

export interface AdminReportItem {
  _id: string;
  /** Populated with {_id,email,fullName} on the admin list; a plain id string elsewhere. */
  owner: string | OwnerRef;
  title: string;
  content: string;
  status: AdminReportItemStatus;
  // B10: admin triage reply, shown back to the student.
  adminResponse: string | null;
  respondedAt: string | null;
  // N11: issue type, free-text location, and an optional screenshot.
  issueType: AdminReportIssueType;
  location: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportItemFilters {
  page?: number;
  limit?: number;
  status?: AdminReportItemStatus;
}

export interface CreateAdminReportItemInput {
  title: string;
  content: string;
  issueType?: AdminReportIssueType;
  location?: string;
  attachment?: File;
}
