export type EnrollmentRequestStatus =
  | "waiting"
  | "setw"
  | "set"
  | "pending"
  | "approved"
  | "rejected"
  | "needs_relink";

export interface EnrollmentRequestCreateDto {
  parent_email: string;
  parent_first_name: string;
  parent_last_name: string;
  phone?: string;
  preferred_locale?: string;
  student_first_name: string;
  student_last_name: string;
  student_birth_date: string;
  student_email?: string;
}

export interface EnrollmentRequestCreateResponseDto {
  id: string;
  status: EnrollmentRequestStatus;
  moderation_comment: string | null;
  updated_at: string;
}

export interface EnrollmentRequestStatusResponseDto {
  id: string;
  status: EnrollmentRequestStatus;
  moderation_comment: string | null;
  updated_at: string;
  access?: string;
  refresh?: string;
}
