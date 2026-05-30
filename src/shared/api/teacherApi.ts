import { httpRequest } from "./httpClient";
import {
  TeacherAttendanceDto,
  TeacherAttendanceBulkUpsertDto,
  TeacherAttendancePatchDto,
  TeacherClassStudentDto,
  TeacherCurriculumPlanDto,
  TeacherFeedbackCreateDto,
  TeacherFeedbackDto,
  TeacherFeedbackUpdateDto,
  TeacherLessonDto,
  TeacherProfileDto,
  TeacherProfileUpdateDto
} from "../types/teacher";

export function getTeacherMeProfile(): Promise<TeacherProfileDto> {
  return httpRequest<TeacherProfileDto>("/api/v1/teacher/me/profile/", {
    method: "GET"
  });
}

export function updateTeacherMeProfile(
  payload: TeacherProfileUpdateDto
): Promise<TeacherProfileDto> {
  return httpRequest<TeacherProfileDto>("/api/v1/teacher/me/profile/", {
    method: "PATCH",
    body: payload
  });
}

export function getTeacherCurriculumPlans(): Promise<TeacherCurriculumPlanDto[]> {
  return httpRequest<TeacherCurriculumPlanDto[]>("/api/v1/teacher/curriculum-plans/", {
    method: "GET"
  });
}

export function getTeacherMeLessons(params?: {
  class_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}): Promise<TeacherLessonDto[]> {
  const query = new URLSearchParams();
  if (params?.class_id) query.set("class_id", params.class_id);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  if (params?.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return httpRequest<TeacherLessonDto[]>(`/api/v1/teacher/me/lessons/${suffix}`, {
    method: "GET"
  });
}

function mapTeacherFeedback(raw: TeacherFeedbackDto): TeacherFeedbackDto {
  return {
    ...raw,
    lesson_topic: raw.lesson_topic
  };
}

export async function getTeacherLessonFeedback(lessonId: string): Promise<TeacherFeedbackDto[]> {
  const response = await httpRequest<TeacherFeedbackDto[]>(`/api/v1/teacher/lessons/${lessonId}/feedback/`, {
    method: "GET"
  });
  return response.map(mapTeacherFeedback);
}

export function getTeacherLessonAttendance(lessonId: string): Promise<TeacherAttendanceDto[]> {
  return httpRequest<TeacherAttendanceDto[]>(`/api/v1/teacher/lessons/${lessonId}/attendance/`, {
    method: "GET"
  });
}

export function getTeacherClassStudents(classId: string): Promise<TeacherClassStudentDto[]> {
  return httpRequest<TeacherClassStudentDto[]>(`/api/v1/teacher/classes/${classId}/students/`, {
    method: "GET"
  });
}

export function upsertTeacherLessonAttendance(
  lessonId: string,
  payload: TeacherAttendanceBulkUpsertDto
): Promise<TeacherAttendanceDto[]> {
  return httpRequest<TeacherAttendanceDto[]>(`/api/v1/teacher/lessons/${lessonId}/attendance/`, {
    method: "POST",
    body: payload
  });
}

export function patchTeacherLessonAttendance(
  lessonId: string,
  studentId: string,
  payload: TeacherAttendancePatchDto
): Promise<TeacherAttendanceDto> {
  return httpRequest<TeacherAttendanceDto>(
    `/api/v1/teacher/lessons/${lessonId}/attendance/${studentId}/`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export async function createTeacherLessonFeedback(
  lessonId: string,
  payload: TeacherFeedbackCreateDto
): Promise<TeacherFeedbackDto> {
  const response = await httpRequest<TeacherFeedbackDto>(`/api/v1/teacher/lessons/${lessonId}/feedback/`, {
    method: "POST",
    body: payload
  });
  return mapTeacherFeedback(response);
}

export async function updateTeacherFeedback(
  feedbackId: string,
  payload: TeacherFeedbackUpdateDto
): Promise<TeacherFeedbackDto> {
  const response = await httpRequest<TeacherFeedbackDto>(`/api/v1/teacher/feedback/${feedbackId}/`, {
    method: "PATCH",
    body: payload
  });
  return mapTeacherFeedback(response);
}
