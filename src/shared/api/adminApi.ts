import { httpRequest } from "./httpClient";
import {
  AdminEnrollmentItemDto,
  AdminEnrollmentListPaginatedDto,
  AdminParentItemDto,
  AdminParentListPaginatedDto,
  AdminParentProfileDto,
  AdminStudentItemDto,
  AdminStudentListPaginatedDto,
  AdminStudentProfileDto
} from "../types/admin";
import { EnrollmentRequestStatus } from "../types/enrollment";

type AdminEnrollmentListResponse = AdminEnrollmentItemDto[] | AdminEnrollmentListPaginatedDto;
type AdminStudentListResponse = AdminStudentItemDto[] | AdminStudentListPaginatedDto;
type AdminParentListResponse = AdminParentItemDto[] | AdminParentListPaginatedDto;

function unwrapList<T>(response: T[] | { results: T[] }): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response.results ?? [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function pickString(
  source: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function normalizeEnrollmentStatus(raw: unknown): EnrollmentRequestStatus {
  if (typeof raw !== "string") {
    return "pending";
  }

  const value = raw.toLowerCase();
  if (value === "waiting") return "waiting";
  if (value === "setw") return "setw";
  if (value === "set") return "set";
  if (value === "pending") return "pending";
  if (value === "approved") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "needs_relink") return "needs_relink";
  return "pending";
}

function mapAdminEnrollmentItem(raw: Record<string, unknown>): AdminEnrollmentItemDto {
  return {
    id: pickString(raw, ["id", "uuid"]) ?? "",
    created_at: pickString(raw, ["created_at", "created"]) ?? "",
    updated_at: pickString(raw, ["updated_at", "updated"]) ?? "",
    status: normalizeEnrollmentStatus(raw.status),
    parent_first_name: pickString(raw, ["parent_first_name"]) ?? "",
    parent_last_name: pickString(raw, ["parent_last_name"]) ?? "",
    parent_email: pickString(raw, ["parent_email", "email"]) ?? "",
    parent_phone: pickString(raw, ["phone", "parent_phone", "phone_number"]),
    student_first_name: pickString(raw, ["student_first_name"]) ?? "",
    student_last_name: pickString(raw, ["student_last_name"]) ?? "",
    student_birth_date: pickString(raw, ["student_birth_date", "birth_date"])
  };
}

function pickParent(source: Record<string, unknown>): Record<string, unknown> | null {
  const variants = [
    source.parent,
    source.parent_user,
    source.parent_profile,
    source.guardian
  ];
  for (const variant of variants) {
    const record = asRecord(variant);
    if (record) {
      return record;
    }
  }
  return null;
}

function mapAdminStudentListItem(raw: Record<string, unknown>): AdminStudentItemDto {
  const parent = pickParent(raw);
  const parentId =
    pickString(raw, ["parent_id", "parent_user_id", "guardian_id"]) ??
    (parent ? pickString(parent, ["id", "uuid"]) : null);
  const parentFirstName =
    pickString(raw, ["parent_first_name", "guardian_first_name"]) ??
    (parent ? pickString(parent, ["first_name", "name"]) : null);
  const parentLastName =
    pickString(raw, ["parent_last_name", "guardian_last_name"]) ??
    (parent ? pickString(parent, ["last_name", "surname"]) : null);

  return {
    id: pickString(raw, ["id", "uuid"]) ?? "",
    first_name: pickString(raw, ["first_name", "name"]) ?? "",
    last_name: pickString(raw, ["last_name", "surname"]) ?? "",
    email: pickString(raw, ["email"]),
    birth_date: pickString(raw, ["birth_date", "student_birth_date"]),
    parent_id: parentId,
    parent_first_name: parentFirstName,
    parent_last_name: parentLastName
  };
}

function mapAdminStudentProfile(raw: Record<string, unknown>): AdminStudentProfileDto {
  const parentRaw = pickParent(raw);

  return {
    id: pickString(raw, ["id", "uuid"]) ?? "",
    first_name: pickString(raw, ["first_name", "name"]) ?? "",
    last_name: pickString(raw, ["last_name", "surname"]) ?? "",
    email: pickString(raw, ["email"]),
    birth_date: pickString(raw, ["birth_date", "student_birth_date"]),
    parent: parentRaw
      ? {
          id: pickString(parentRaw, ["id", "uuid"]) ?? "",
          first_name: pickString(parentRaw, ["first_name", "name"]) ?? "",
          last_name: pickString(parentRaw, ["last_name", "surname"]) ?? "",
          email: pickString(parentRaw, ["email"])
        }
      : null
  };
}

function pickChildrenArray(source: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [source.children, source.students, source.pupils];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }
  return [];
}

function mapAdminParentListItem(raw: Record<string, unknown>): AdminParentItemDto {
  const nestedUser =
    asRecord(raw.user) ?? asRecord(raw.account) ?? asRecord(raw.parent_user);

  return {
    id: pickString(raw, ["id", "uuid"]) ?? "",
    first_name: pickString(raw, ["first_name", "name"]) ?? "",
    last_name: pickString(raw, ["last_name", "surname"]) ?? "",
    email:
      pickString(raw, ["email", "parent_email", "registration_email"]) ??
      (nestedUser ? pickString(nestedUser, ["email", "username"]) : null),
    phone: pickString(raw, ["phone", "phone_number"]),
    children_count: asNumber(raw.children_count) ?? 0
  };
}

function mapAdminParentProfile(raw: Record<string, unknown>): AdminParentProfileDto {
  const nestedUser =
    asRecord(raw.user) ?? asRecord(raw.account) ?? asRecord(raw.parent_user);
  const children = pickChildrenArray(raw).map((child) => ({
    id: pickString(child, ["id", "uuid"]) ?? "",
    first_name: pickString(child, ["first_name", "name"]) ?? "",
    last_name: pickString(child, ["last_name", "surname"]) ?? "",
    email: pickString(child, ["email"]),
    birth_date: pickString(child, ["birth_date", "student_birth_date"])
  }));

  return {
    id: pickString(raw, ["id", "uuid"]) ?? "",
    first_name: pickString(raw, ["first_name", "name"]) ?? "",
    last_name: pickString(raw, ["last_name", "surname"]) ?? "",
    email:
      pickString(raw, ["email", "parent_email", "registration_email"]) ??
      (nestedUser ? pickString(nestedUser, ["email", "username"]) : null),
    phone: pickString(raw, ["phone", "phone_number"]),
    children
  };
}

function normalizedFullName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/[^\d+]/g, "");
}

function normalizeDate(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function makeStudentEnrollmentKey(firstName: string | null | undefined, lastName: string | null | undefined, birthDate: string | null | undefined): string {
  return [
    normalizedFullName(firstName, lastName),
    normalizeDate(birthDate)
  ].join("|");
}

function makeStudentNameOnlyKey(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return normalizedFullName(firstName, lastName);
}

function fillParentEmailsFromEnrollments(items: AdminParentItemDto[], enrollments: AdminEnrollmentItemDto[]): AdminParentItemDto[] {
  const emailByName = new Map<string, string>();
  enrollments.forEach((entry) => {
    const key = normalizedFullName(entry.parent_first_name, entry.parent_last_name);
    if (!key) {
      return;
    }
    if (!emailByName.has(key) && entry.parent_email) {
      emailByName.set(key, entry.parent_email);
    }
  });

  return items.map((item) => {
    if (item.email) {
      return item;
    }
    const key = normalizedFullName(item.first_name, item.last_name);
    return {
      ...item,
      email: key ? emailByName.get(key) ?? null : null
    };
  });
}

async function fetchAdminParentsBase(): Promise<AdminParentItemDto[]> {
  const response = await httpRequest<AdminParentListResponse>("/api/v1/admin/parents/", {
    method: "GET"
  });

  return unwrapList(response).map((item) =>
    mapAdminParentListItem(item as unknown as Record<string, unknown>)
  );
}

async function buildParentDirectory(): Promise<{
  byChildId: Map<string, AdminParentItemDto>;
  byParentId: Map<string, AdminParentItemDto>;
}> {
  const parents = await fetchAdminParentsBase();
  const profiles = await Promise.all(
    parents.map((parent) =>
      getAdminParentProfile(parent.id).catch(() => null)
    )
  );

  const byChildId = new Map<string, AdminParentItemDto>();
  const byParentId = new Map<string, AdminParentItemDto>();

  profiles.forEach((profile) => {
    if (!profile) {
      return;
    }

    const parentBase: AdminParentItemDto = {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      children_count: profile.children.length
    };

    byParentId.set(parentBase.id, parentBase);

    profile.children.forEach((child) => {
      if (child.id) {
        byChildId.set(child.id, parentBase);
      }
    });
  });

  return { byChildId, byParentId };
}

export async function getAdminEnrollmentList(): Promise<AdminEnrollmentItemDto[]> {
  const response = await httpRequest<AdminEnrollmentListResponse>(
    "/api/v1/admin/enrollment-requests/",
    { method: "GET" }
  );
  const list = unwrapList(response);
  return list.map((item) => mapAdminEnrollmentItem(item as unknown as Record<string, unknown>));
}

export function approveEnrollmentRequest(id: string): Promise<void> {
  return httpRequest<void>(`/api/v1/admin/enrollment-requests/${id}/approve/`, {
    method: "POST"
  });
}

export function rejectEnrollmentRequest(id: string): Promise<void> {
  return httpRequest<void>(`/api/v1/admin/enrollment-requests/${id}/reject/`, {
    method: "POST"
  });
}

export async function getAdminStudentsList(): Promise<AdminStudentItemDto[]> {
  // TODO: confirm with backend that admin students endpoint is /api/v1/admin/students/
  const response = await httpRequest<AdminStudentListResponse>("/api/v1/admin/students/", {
    method: "GET"
  });
  const list = unwrapList(response);
  const mapped = list.map((item) =>
    mapAdminStudentListItem(item as unknown as Record<string, unknown>)
  );

  try {
    const enrollments = await getAdminEnrollmentList();
    const byStudentKey = new Map<string, AdminEnrollmentItemDto>();
    const byStudentName = new Map<string, AdminEnrollmentItemDto>();

    enrollments.forEach((entry) => {
      const fullKey = makeStudentEnrollmentKey(
        entry.student_first_name,
        entry.student_last_name,
        entry.student_birth_date
      );
      if (fullKey !== "|" && !byStudentKey.has(fullKey)) {
        byStudentKey.set(fullKey, entry);
      }

      const nameKey = makeStudentNameOnlyKey(
        entry.student_first_name,
        entry.student_last_name
      );
      if (nameKey && !byStudentName.has(nameKey)) {
        byStudentName.set(nameKey, entry);
      }
    });

    const directory = await buildParentDirectory();
    return mapped.map((student) => {
      const parentByChild = directory.byChildId.get(student.id);
      const parentById = student.parent_id
        ? directory.byParentId.get(student.parent_id)
        : null;
      const enrollmentMatch =
        byStudentKey.get(
          makeStudentEnrollmentKey(student.first_name, student.last_name, student.birth_date)
        ) ??
        byStudentName.get(makeStudentNameOnlyKey(student.first_name, student.last_name));

      const parent = parentByChild ?? parentById;

      const fallbackParentName = enrollmentMatch
        ? {
            first_name: enrollmentMatch.parent_first_name || null,
            last_name: enrollmentMatch.parent_last_name || null
          }
        : null;

      if (!parent && !fallbackParentName) {
        return student;
      }

      return {
        ...student,
        parent_id: student.parent_id ?? parent?.id ?? null,
        parent_first_name:
          student.parent_first_name ?? parent?.first_name ?? fallbackParentName?.first_name ?? null,
        parent_last_name:
          student.parent_last_name ?? parent?.last_name ?? fallbackParentName?.last_name ?? null
      };
    });
  } catch {
    return mapped;
  }
}

export async function getAdminStudentProfile(id: string): Promise<AdminStudentProfileDto> {
  // TODO: confirm with backend that student details endpoint is /api/v1/admin/students/{id}/
  const response = await httpRequest<unknown>(`/api/v1/admin/students/${id}/`, {
    method: "GET"
  });

  const record = asRecord(response);
  if (!record) {
    return {
      id: "",
      first_name: "",
      last_name: "",
      email: null,
      birth_date: null,
      parent: null
    };
  }

  const mapped = mapAdminStudentProfile(record);
  if (mapped.parent) {
    return mapped;
  }

  try {
    const directory = await buildParentDirectory();
    const parent = directory.byChildId.get(mapped.id || id);
    if (!parent) {
      return mapped;
    }

    return {
      ...mapped,
      parent: {
        id: parent.id,
        first_name: parent.first_name,
        last_name: parent.last_name,
        email: parent.email
      }
    };
  } catch {
    return mapped;
  }
}

export async function getAdminParentsList(): Promise<AdminParentItemDto[]> {
  // TODO: confirm with backend that admin parents endpoint is /api/v1/admin/parents/
  const mapped = await fetchAdminParentsBase();

  let enriched = mapped;

  try {
    const profiles = await Promise.all(
      mapped.map((parent) =>
        getAdminParentProfile(parent.id).catch(() => null)
      )
    );

    const profileById = new Map<string, AdminParentProfileDto>();
    profiles.forEach((profile) => {
      if (profile) {
        profileById.set(profile.id, profile);
      }
    });

    enriched = mapped.map((parent) => {
      const profile = profileById.get(parent.id);
      if (!profile) {
        return parent;
      }
      return {
        ...parent,
        email: parent.email ?? profile.email,
        children_count: profile.children.length
      };
    });
  } catch {
    enriched = mapped;
  }

  try {
    const enrollments = await getAdminEnrollmentList();

    const byPhone = new Map<string, AdminEnrollmentItemDto[]>();
    const byName = new Map<string, AdminEnrollmentItemDto[]>();

    enrollments.forEach((entry) => {
      const phoneKey = normalizePhone(entry.parent_phone);
      if (phoneKey) {
        const list = byPhone.get(phoneKey) ?? [];
        list.push(entry);
        byPhone.set(phoneKey, list);
      }

      const nameKey = normalizedFullName(entry.parent_first_name, entry.parent_last_name);
      if (nameKey) {
        const list = byName.get(nameKey) ?? [];
        list.push(entry);
        byName.set(nameKey, list);
      }
    });

    const withEmailFallback = fillParentEmailsFromEnrollments(enriched, enrollments);

    return withEmailFallback.map((parent) => {
      const phoneKey = normalizePhone(parent.phone);
      const nameKey = normalizedFullName(parent.first_name, parent.last_name);
      const matchedByPhone = phoneKey ? byPhone.get(phoneKey) ?? [] : [];
      const matchedByName = nameKey ? byName.get(nameKey) ?? [] : [];
      const matched = matchedByPhone.length > 0 ? matchedByPhone : matchedByName;

      if (matched.length === 0) {
        return parent;
      }

      const children = new Set<string>();
      matched.forEach((entry) => {
        const childKey = makeStudentEnrollmentKey(
          entry.student_first_name,
          entry.student_last_name,
          entry.student_birth_date
        );
        if (childKey !== "|") {
          children.add(childKey);
        }
      });

      const fallbackEmail = matched.find((entry) => entry.parent_email)?.parent_email ?? null;

      return {
        ...parent,
        email: parent.email ?? fallbackEmail,
        children_count: Math.max(parent.children_count, children.size)
      };
    });
  } catch {
    return enriched;
  }
}

export async function getAdminParentProfile(id: string): Promise<AdminParentProfileDto> {
  // TODO: confirm with backend that parent details endpoint is /api/v1/admin/parents/{id}/
  const response = await httpRequest<unknown>(`/api/v1/admin/parents/${id}/`, {
    method: "GET"
  });

  const record = asRecord(response);
  if (!record) {
    return {
      id: "",
      first_name: "",
      last_name: "",
      email: null,
      phone: null,
      children: []
    };
  }

  return mapAdminParentProfile(record);
}
