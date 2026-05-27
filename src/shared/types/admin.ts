import { EnrollmentRequestStatus } from "./enrollment";

export type StudentStatus = "active" | "expelled" | "withdrawn";
export type LessonStatus = "planned" | "completed" | "cancelled" | "rescheduled";
export type RelationType = "mother" | "father" | "guardian" | "other";
export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface AdminEnrollmentItemDto {
  id: string;
  created_at: string;
  updated_at: string;
  status: EnrollmentRequestStatus;
  parent_email: string;
  parent_first_name: string;
  parent_last_name: string;
  student_first_name: string;
  student_last_name: string;
  student_birth_date: string;
  student_email?: string | null;
  preferred_locale?: string | null;
  phone?: string | null;
  moderation_comment?: string | null;
}

export interface AdminEnrollmentListPaginatedDto {
  results: AdminEnrollmentItemDto[];
}

export interface AdminParentStudentLinkDto {
  id: string;
  parent: string;
  student: string;
  relation_type: RelationType;
  is_primary?: boolean;
}

export interface AdminStudentItemDto {
  id: string;
  user: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  status: StudentStatus;
  enrolled_at: string;
  current_class: string;
  parent_links: AdminParentStudentLinkDto[];
}

export interface AdminStudentProfileDto extends AdminStudentItemDto {}

export interface AdminStudentListPaginatedDto {
  results: AdminStudentItemDto[];
}

export interface AdminParentItemDto {
  id: string;
  user: string;
  user_email: string;
  first_name: string;
  last_name: string;
  phone: string;
  preferred_locale: string;
  email_subscribed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminParentProfileDto extends AdminParentItemDto {}

export interface AdminParentListPaginatedDto {
  results: AdminParentItemDto[];
}

export interface AdminSchoolClassDto {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSchoolClassCreateDto {
  name: string;
  description?: string;
  active?: boolean;
}

export interface AdminSchoolClassUpdateDto {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface TeacherProfileShortDto {
  id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  position: "teacher" | "assistant";
}

export interface AdminLessonDto {
  id: string;
  school_class: string;
  class_name: string;
  curriculum_plan?: string | null;
  teacher?: string | null;
  teacher_info?: TeacherProfileShortDto | null;
  assistant?: string | null;
  assistant_info?: TeacherProfileShortDto | null;
  starts_at: string;
  week_day?: WeekDay | "" | null;
  duration_minutes: number;
  ends_at: string;
  status: LessonStatus;
  room?: string;
  topic?: string;
  notes?: string;
  rescheduled_from_lesson?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminLessonCreateDto {
  school_class: string;
  curriculum_plan?: string | null;
  teacher?: string | null;
  assistant?: string | null;
  starts_at: string;
  week_day?: WeekDay | "";
  duration_minutes: number;
  status?: LessonStatus;
  room?: string;
  topic?: string;
  notes?: string;
  rescheduled_from_lesson?: string | null;
}

export interface AdminLessonUpdateDto extends Partial<AdminLessonCreateDto> {}

export interface AdminStudentClassAssignmentDto {
  id: string;
  student: string;
  school_class: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
}

export interface AdminStudentClassAssignmentCreateDto {
  school_class: string;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
}

export interface AdminStudentClassAssignmentUpdateDto {
  school_class?: string;
  start_date?: string;
  end_date?: string | null;
  is_current?: boolean;
}

export interface AdminParentStudentLinkCreateDto {
  parent: string;
  student: string;
  relation_type: RelationType;
  is_primary?: boolean;
}

export interface AdminParentStudentLinkUpdateDto {
  parent?: string;
  student?: string;
  relation_type?: RelationType;
  is_primary?: boolean;
}
