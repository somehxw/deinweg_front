import { httpRequest } from "./httpClient";
import {
  ParentChildDto,
  ParentChildrenPaginatedDto,
  ParentLessonDto
} from "../types/parent";

type ParentChildrenResponse = ParentChildDto[] | ParentChildrenPaginatedDto;
type ParentLessonsResponse =
  | ParentLessonDto[]
  | { results?: ParentLessonDto[]; lessons?: ParentLessonDto[] }
  | Record<string, unknown>;

export async function getParentChildren(): Promise<ParentChildDto[]> {
  const response = await httpRequest<ParentChildrenResponse>("/api/v1/parent/me/children/", {
    method: "GET"
  });

  if (Array.isArray(response)) {
    return response;
  }

  return response.results ?? [];
}

interface ParentLessonsQuery {
  studentId?: string;
  weekDay?: string;
  dateFrom?: string;
  dateTo?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function mapParentLessonItem(
  raw: unknown,
  fallbackId: string
): ParentLessonDto | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const startsAt = asString(item.starts_at) ?? asString(item.start_at) ?? asString(item.startsAt);
  if (!startsAt) {
    return null;
  }

  return {
    id: asString(item.id) ?? fallbackId,
    starts_at: startsAt,
    student_id:
      asString(item.student_id) ??
      asString(item.student) ??
      asString(item.child_id) ??
      asString(item.child),
    week_day: asString(item.week_day) ?? asString(item.weekDay) ?? null,
    status:
      (asBoolean(item.is_cancelled) === true ? "cancelled" : undefined) ??
      asString(item.status) ??
      asString(item.lesson_status) ??
      asString(item.state),
    topic: asString(item.topic) ?? asString(item.subject),
    room: asString(item.room),
    class_name: asString(item.class_name) ?? asString(item.class)
  };
}

function mapParentLessonsResponse(response: ParentLessonsResponse): ParentLessonDto[] {
  if (Array.isArray(response)) {
    return response
      .map((item, index) => mapParentLessonItem(item, `lesson-${index}`))
      .filter((item): item is ParentLessonDto => item !== null);
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const envelope = response as Record<string, unknown>;
  const rawList = Array.isArray(envelope.results)
    ? envelope.results
    : Array.isArray(envelope.lessons)
      ? envelope.lessons
      : [];

  return rawList
    .map((item, index) => mapParentLessonItem(item, `lesson-${index}`))
    .filter((item): item is ParentLessonDto => item !== null);
}

export async function getParentLessons(params?: ParentLessonsQuery): Promise<ParentLessonDto[]> {
  const query = new URLSearchParams();
  if (params?.studentId) query.set("student_id", params.studentId);
  if (params?.weekDay) query.set("week_day", params.weekDay);
  if (params?.dateFrom) query.set("date_from", params.dateFrom);
  if (params?.dateTo) query.set("date_to", params.dateTo);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await httpRequest<ParentLessonsResponse>(
    `/api/v1/parent/me/lessons/${suffix}`,
    { method: "GET" }
  );

  return mapParentLessonsResponse(response);
}
