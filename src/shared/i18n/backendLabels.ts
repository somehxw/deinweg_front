import { TranslationKey } from "./translations";

interface TFn {
  (key: TranslationKey): string;
}

export function localizeEnrollmentStatus(value: string, t: TFn): string {
  if (value === "pending") return t("backendStatusPending");
  if (value === "approved") return t("backendStatusApproved");
  if (value === "rejected") return t("backendStatusRejected");
  if (value === "needs_relink") return t("backendStatusNeedsRelink");
  return value;
}

export function localizeStudentStatus(value: string, t: TFn): string {
  if (value === "active") return t("backendStudentActive");
  if (value === "expelled") return t("backendStudentExpelled");
  if (value === "withdrawn") return t("backendStudentWithdrawn");
  return value;
}

export function localizeLessonStatus(value: string, t: TFn): string {
  if (value === "planned") return t("backendLessonPlanned");
  if (value === "completed") return t("backendLessonCompleted");
  if (value === "cancelled") return t("backendLessonCancelled");
  if (value === "rescheduled") return t("backendLessonRescheduled");
  return value;
}

export function localizeRelationType(value: string, t: TFn): string {
  if (value === "mother") return t("backendRelationMother");
  if (value === "father") return t("backendRelationFather");
  if (value === "guardian") return t("backendRelationGuardian");
  if (value === "other") return t("backendRelationOther");
  return value;
}

export function localizeLocale(value: string, t: TFn): string {
  if (value === "ua") return t("localeUa");
  if (value === "de") return t("localeDe");
  return value;
}

export function localizeWeekDay(value: string | null | undefined, t: TFn): string {
  if (!value) return "-";
  if (value === "monday") return t("weekDayMonday");
  if (value === "tuesday") return t("weekDayTuesday");
  if (value === "wednesday") return t("weekDayWednesday");
  if (value === "thursday") return t("weekDayThursday");
  if (value === "friday") return t("weekDayFriday");
  if (value === "saturday") return t("weekDaySaturday");
  if (value === "sunday") return t("weekDaySunday");
  return value;
}

export function localizeAttendanceStatus(value: string, t: TFn): string {
  if (value === "present") return t("backendAttendancePresent");
  if (value === "absent") return t("backendAttendanceAbsent");
  if (value === "late") return t("backendAttendanceLate");
  if (value === "excused") return t("backendAttendanceExcused");
  return value;
}
