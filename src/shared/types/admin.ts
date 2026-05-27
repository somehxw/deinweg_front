import { EnrollmentRequestStatus } from "./enrollment";

export interface AdminEnrollmentItemDto {
  id: string;
  created_at: string;
  updated_at: string;
  status: EnrollmentRequestStatus;
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone?: string | null;
  student_first_name: string;
  student_last_name: string;
  student_birth_date?: string | null;
}

export interface AdminEnrollmentListPaginatedDto {
  results: AdminEnrollmentItemDto[];
}

export interface AdminStudentItemDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  birth_date: string | null;
  parent_id: string | null;
  parent_first_name: string | null;
  parent_last_name: string | null;
}

export interface AdminStudentProfileDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  birth_date: string | null;
  parent: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

export interface AdminStudentListPaginatedDto {
  results: AdminStudentItemDto[];
}

export interface AdminParentItemDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  children_count: number;
}

export interface AdminParentChildItemDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  birth_date: string | null;
}

export interface AdminParentProfileDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  children: AdminParentChildItemDto[];
}

export interface AdminParentListPaginatedDto {
  results: AdminParentItemDto[];
}
