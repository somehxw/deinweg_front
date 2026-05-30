export interface TeacherProfileDto {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  position?: "teacher" | "assistant";
  hourly_rate?: string | number | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface TeacherProfileUpdateDto {
  first_name?: string;
  last_name?: string;
}

export interface TeacherCurriculumPlanDto {
  id: string;
  school_class: string;
  teacher: string;
  planned_date: string;
  topic: string;
  notes_for_parents?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherLessonDto {
  id: string;
  school_class?: string;
  class_name?: string;
  starts_at?: string;
  week_day?: string | null;
  duration_minutes?: number;
  room?: string;
  topic?: string;
  status?: string;
}

export interface TeacherClassStudentDto {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface TeacherAttendanceDto {
  id: string;
  lesson: string;
  student: string;
  status: "present" | "absent" | "late" | "excused";
  comment?: string;
}

export interface TeacherAttendanceBulkItemDto {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  comment?: string;
}

export interface TeacherAttendanceBulkUpsertDto {
  items: TeacherAttendanceBulkItemDto[];
}

export interface TeacherAttendancePatchDto {
  status?: "present" | "absent" | "late" | "excused";
  comment?: string;
}

export interface TeacherFeedbackDto {
  id: string;
  lesson: string;
  student: string;
  teacher: string;
  text: string;
  created_at: string;
  lesson_topic?: string;
}

export interface TeacherFeedbackCreateDto {
  lesson: string;
  student: string;
  text: string;
}

export interface TeacherFeedbackUpdateDto {
  text?: string;
}
