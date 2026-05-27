import { httpRequest } from "./httpClient";
import {
  AdminEnrollmentItemDto,
  AdminEnrollmentListPaginatedDto,
  AdminLessonCreateDto,
  AdminLessonDto,
  AdminLessonUpdateDto,
  AdminParentItemDto,
  AdminParentListPaginatedDto,
  AdminParentProfileDto,
  AdminParentStudentLinkCreateDto,
  AdminParentStudentLinkDto,
  AdminParentStudentLinkUpdateDto,
  AdminSchoolClassCreateDto,
  AdminSchoolClassDto,
  AdminSchoolClassUpdateDto,
  AdminStudentClassAssignmentCreateDto,
  AdminStudentClassAssignmentDto,
  AdminStudentClassAssignmentUpdateDto,
  AdminStudentItemDto,
  AdminStudentListPaginatedDto,
  AdminStudentProfileDto
} from "../types/admin";

type ListResponse<T> = T[] | { results: T[] };

function unwrapList<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.results ?? [];
}

export async function getAdminEnrollmentList(params?: {
  status?: string;
  search?: string;
}): Promise<AdminEnrollmentItemDto[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await httpRequest<AdminEnrollmentItemDto[] | AdminEnrollmentListPaginatedDto>(
    `/api/v1/admin/enrollment-requests/${suffix}`,
    { method: "GET" }
  );
  return unwrapList(response as ListResponse<AdminEnrollmentItemDto>);
}

export async function getAdminEnrollmentDetails(id: string): Promise<AdminEnrollmentItemDto> {
  return httpRequest<AdminEnrollmentItemDto>(`/api/v1/admin/enrollment-requests/${id}/`, {
    method: "GET"
  });
}

export async function updateAdminEnrollment(
  id: string,
  payload: Partial<Pick<AdminEnrollmentItemDto, "status" | "moderation_comment">>
): Promise<AdminEnrollmentItemDto> {
  return httpRequest<AdminEnrollmentItemDto>(`/api/v1/admin/enrollment-requests/${id}/`, {
    method: "PATCH",
    body: payload
  });
}

export async function approveEnrollmentRequest(id: string): Promise<AdminEnrollmentItemDto> {
  return httpRequest<AdminEnrollmentItemDto>(`/api/v1/admin/enrollment-requests/${id}/approve/`, {
    method: "POST",
    body: {}
  });
}

export async function rejectEnrollmentRequest(
  id: string,
  moderationComment?: string
): Promise<AdminEnrollmentItemDto> {
  return httpRequest<AdminEnrollmentItemDto>(`/api/v1/admin/enrollment-requests/${id}/reject/`, {
    method: "POST",
    body: moderationComment ? { moderation_comment: moderationComment } : {}
  });
}

export async function requestEnrollmentRelink(
  id: string,
  moderationComment?: string
): Promise<AdminEnrollmentItemDto> {
  return httpRequest<AdminEnrollmentItemDto>(`/api/v1/admin/enrollment-requests/${id}/request-relink/`, {
    method: "POST",
    body: moderationComment ? { moderation_comment: moderationComment } : {}
  });
}

export async function getAdminStudentsList(params?: {
  status?: string;
  search?: string;
}): Promise<AdminStudentItemDto[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await httpRequest<AdminStudentItemDto[] | AdminStudentListPaginatedDto>(
    `/api/v1/admin/students/${suffix}`,
    { method: "GET" }
  );
  return unwrapList(response as ListResponse<AdminStudentItemDto>);
}

export async function getAdminStudentProfile(studentId: string): Promise<AdminStudentProfileDto> {
  return httpRequest<AdminStudentProfileDto>(`/api/v1/admin/students/${studentId}/`, {
    method: "GET"
  });
}

export async function assignStudentToClass(
  studentId: string,
  payload: AdminStudentClassAssignmentCreateDto
): Promise<AdminStudentClassAssignmentDto> {
  return httpRequest<AdminStudentClassAssignmentDto>(
    `/api/v1/admin/students/${studentId}/class-assignments/`,
    {
      method: "POST",
      body: {
        student: studentId,
        ...payload
      }
    }
  );
}

export async function updateStudentClassAssignment(
  studentId: string,
  assignmentId: string,
  payload: AdminStudentClassAssignmentUpdateDto
): Promise<AdminStudentClassAssignmentDto> {
  return httpRequest<AdminStudentClassAssignmentDto>(
    `/api/v1/admin/students/${studentId}/class-assignments/${assignmentId}/`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export async function getAdminParentsList(params?: { search?: string }): Promise<AdminParentItemDto[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await httpRequest<AdminParentItemDto[] | AdminParentListPaginatedDto>(
    `/api/v1/admin/parents/${suffix}`,
    { method: "GET" }
  );
  return unwrapList(response as ListResponse<AdminParentItemDto>);
}

export async function getAdminParentProfile(parentId: string): Promise<AdminParentProfileDto> {
  return httpRequest<AdminParentProfileDto>(`/api/v1/admin/parents/${parentId}/`, {
    method: "GET"
  });
}

export async function getAdminClassesList(): Promise<AdminSchoolClassDto[]> {
  return httpRequest<AdminSchoolClassDto[]>("/api/v1/admin/classes/", { method: "GET" });
}

export async function createAdminClass(payload: AdminSchoolClassCreateDto): Promise<AdminSchoolClassDto> {
  return httpRequest<AdminSchoolClassDto>("/api/v1/admin/classes/", {
    method: "POST",
    body: payload
  });
}

export async function getAdminClassDetails(id: string): Promise<AdminSchoolClassDto> {
  return httpRequest<AdminSchoolClassDto>(`/api/v1/admin/classes/${id}/`, { method: "GET" });
}

export async function updateAdminClass(
  id: string,
  payload: AdminSchoolClassUpdateDto
): Promise<AdminSchoolClassDto> {
  return httpRequest<AdminSchoolClassDto>(`/api/v1/admin/classes/${id}/`, {
    method: "PATCH",
    body: payload
  });
}

export async function getAdminLessonsList(): Promise<AdminLessonDto[]> {
  return httpRequest<AdminLessonDto[]>("/api/v1/admin/lessons/", { method: "GET" });
}

export async function createAdminLesson(payload: AdminLessonCreateDto): Promise<AdminLessonDto> {
  return httpRequest<AdminLessonDto>("/api/v1/admin/lessons/", {
    method: "POST",
    body: payload
  });
}

export async function getAdminLessonDetails(id: string): Promise<AdminLessonDto> {
  return httpRequest<AdminLessonDto>(`/api/v1/admin/lessons/${id}/`, { method: "GET" });
}

export async function updateAdminLesson(id: string, payload: AdminLessonUpdateDto): Promise<AdminLessonDto> {
  return httpRequest<AdminLessonDto>(`/api/v1/admin/lessons/${id}/`, {
    method: "PATCH",
    body: payload
  });
}

export async function cancelAdminLesson(id: string): Promise<AdminLessonDto> {
  return httpRequest<AdminLessonDto>(`/api/v1/admin/lessons/${id}/cancel/`, {
    method: "POST",
    body: {}
  });
}

export async function rescheduleAdminLesson(
  id: string,
  payload: Pick<AdminLessonCreateDto, "starts_at" | "duration_minutes"> & Partial<AdminLessonCreateDto>
): Promise<AdminLessonDto> {
  return httpRequest<AdminLessonDto>(`/api/v1/admin/lessons/${id}/reschedule/`, {
    method: "POST",
    body: payload
  });
}

export async function getAdminParentStudentLinksList(): Promise<AdminParentStudentLinkDto[]> {
  return httpRequest<AdminParentStudentLinkDto[]>("/api/v1/admin/parent-student-links/", {
    method: "GET"
  });
}

export async function createAdminParentStudentLink(
  payload: AdminParentStudentLinkCreateDto
): Promise<AdminParentStudentLinkDto> {
  return httpRequest<AdminParentStudentLinkDto>("/api/v1/admin/parent-student-links/", {
    method: "POST",
    body: payload
  });
}

export async function getAdminParentStudentLinkDetails(id: string): Promise<AdminParentStudentLinkDto> {
  return httpRequest<AdminParentStudentLinkDto>(`/api/v1/admin/parent-student-links/${id}/`, {
    method: "GET"
  });
}

export async function updateAdminParentStudentLink(
  id: string,
  payload: AdminParentStudentLinkUpdateDto
): Promise<AdminParentStudentLinkDto> {
  return httpRequest<AdminParentStudentLinkDto>(`/api/v1/admin/parent-student-links/${id}/`, {
    method: "PATCH",
    body: payload
  });
}

export async function deleteAdminParentStudentLink(id: string): Promise<void> {
  await httpRequest<void>(`/api/v1/admin/parent-student-links/${id}/`, {
    method: "DELETE"
  });
}
