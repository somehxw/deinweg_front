import { httpRequest } from "./httpClient";
import {
  TeacherCurriculumPlanDto,
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
