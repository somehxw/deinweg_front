import { useEffect, useMemo, useState } from "react";
import { FiMoreHorizontal, FiPlus } from "react-icons/fi";
import {
  cancelAdminLesson,
  getAdminTeachersList,
  updateAdminLesson
} from "../../../shared/api/adminApi";
import { ApiError } from "../../../shared/api/httpClient";
import { localizeWeekDay } from "../../../shared/i18n/backendLabels";
import { TranslationKey } from "../../../shared/i18n/translations";
import { AdminLessonDto, AdminTeacherItemDto, WeekDay } from "../../../shared/types/admin";
import { AdminLessonCreateModal } from "../../admin/components/AdminLessonCreateModal";

interface DashboardLessonsCalendarProps {
  lessons: AdminLessonDto[];
  isLoading: boolean;
  error: string | null;
  t: (key: TranslationKey) => string;
  onLessonsChanged: () => void | Promise<void>;
}

const WEEK_DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const SATURDAY_START_HOUR = 8;
const SATURDAY_END_HOUR = 16;
const SATURDAY_SLOT_STEP_MINUTES = 15;
const SATURDAY_SLOTS = Array.from(
  {
    length:
      ((SATURDAY_END_HOUR - SATURDAY_START_HOUR) * 60) / SATURDAY_SLOT_STEP_MINUTES + 1
  },
  (_, index) => SATURDAY_START_HOUR * 60 + index * SATURDAY_SLOT_STEP_MINUTES
);

const WEEK_DAY_TO_UTC_INDEX: Record<WeekDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

function resolveWeekDay(lesson: AdminLessonDto): WeekDay | null {
  if (lesson.week_day && WEEK_DAYS.includes(lesson.week_day)) {
    return lesson.week_day;
  }

  const date = new Date(lesson.starts_at);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dayIndex = date.getDay();
  const mapped: Record<number, WeekDay> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday"
  };

  return mapped[dayIndex] ?? null;
}

function formatTime(startsAt: string): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isHiddenFromCalendar(status: AdminLessonDto["status"]): boolean {
  return status === "cancelled" || status === "rescheduled";
}

function getRescheduledStartsAt(startsAt: string, targetDay: WeekDay): string | null {
  const source = new Date(startsAt);
  if (Number.isNaN(source.getTime())) {
    return null;
  }

  const sourceIndex = source.getUTCDay();
  const targetIndex = WEEK_DAY_TO_UTC_INDEX[targetDay];
  const shifted = new Date(source);
  shifted.setUTCDate(shifted.getUTCDate() + (targetIndex - sourceIndex));
  return shifted.toISOString();
}

function getRescheduledStartsAtForSlot(startsAt: string, targetSlotMinutes: number): string | null {
  const source = new Date(startsAt);
  if (Number.isNaN(source.getTime())) {
    return null;
  }
  const shifted = new Date(source);
  shifted.setHours(Math.floor(targetSlotMinutes / 60), targetSlotMinutes % 60, 0, 0);
  return shifted.toISOString();
}

function getSlotBucket(startsAt: string): number | null {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = SATURDAY_START_HOUR * 60;
  const endMinutes = SATURDAY_END_HOUR * 60;
  if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
    return null;
  }
  const snapped =
    Math.floor((totalMinutes - startMinutes) / SATURDAY_SLOT_STEP_MINUTES) * SATURDAY_SLOT_STEP_MINUTES
    + startMinutes;
  return snapped;
}

function formatSlotLabel(slotMinutes: number): string {
  const hour = Math.floor(slotMinutes / 60);
  const minute = slotMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getTeacherDisplay(lesson: AdminLessonDto): string | null {
  if (lesson.teacher_info) {
    const fullName = `${lesson.teacher_info.first_name} ${lesson.teacher_info.last_name}`.trim();
    return fullName || lesson.teacher_info.user_email || null;
  }
  return lesson.teacher ?? null;
}

function getUniqueStartsAtForLessonSlot(
  desiredIso: string,
  allLessons: AdminLessonDto[],
  lessonId: string
): string {
  const desired = new Date(desiredIso);
  if (Number.isNaN(desired.getTime())) {
    return desiredIso;
  }

  const occupied = new Set<number>();
  for (const lesson of allLessons) {
    if (lesson.id === lessonId) {
      continue;
    }
    const moment = new Date(lesson.starts_at);
    if (Number.isNaN(moment.getTime())) {
      continue;
    }
    occupied.add(moment.getTime());
  }

  const base = new Date(desired);
  base.setSeconds(0, 0);
  if (!occupied.has(base.getTime())) {
    return base.toISOString();
  }

  for (let second = 1; second < 60; second += 1) {
    const candidate = new Date(base);
    candidate.setSeconds(second, 0);
    if (!occupied.has(candidate.getTime())) {
      return candidate.toISOString();
    }
  }

  return base.toISOString();
}

export function DashboardLessonsCalendar({
  lessons,
  isLoading,
  error,
  t,
  onLessonsChanged
}: DashboardLessonsCalendarProps): JSX.Element {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dayScope, setDayScope] = useState<"all" | "saturday">("saturday");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLessonId, setActionLessonId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuLessonId, setMenuLessonId] = useState<string | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<AdminTeacherItemDto[]>([]);
  const [assigningLessonId, setAssigningLessonId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<WeekDay | null>(null);
  const [dropTargetHour, setDropTargetHour] = useState<number | null>(null);

  const classOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const lesson of lessons) {
      if (lesson.class_name) {
        unique.add(lesson.class_name);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (isHiddenFromCalendar(lesson.status)) {
        return false;
      }
      if (dayScope === "saturday" && resolveWeekDay(lesson) !== "saturday") {
        return false;
      }
      if (selectedClass !== "all" && lesson.class_name !== selectedClass) {
        return false;
      }
      return true;
    });
  }, [dayScope, lessons, selectedClass]);

  const visibleDays = useMemo<WeekDay[]>(
    () => (dayScope === "saturday" ? ["saturday"] : WEEK_DAYS),
    [dayScope]
  );

  const grouped = useMemo(() => {
    const bucket = new Map<WeekDay, AdminLessonDto[]>();
    for (const day of WEEK_DAYS) {
      bucket.set(day, []);
    }

    for (const lesson of filteredLessons) {
      const day = resolveWeekDay(lesson);
      if (!day) {
        continue;
      }
      bucket.get(day)?.push(lesson);
    }

    for (const day of WEEK_DAYS) {
      const items = bucket.get(day) ?? [];
      items.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
      bucket.set(day, items);
    }

    return bucket;
  }, [filteredLessons]);

  const lessonById = useMemo(() => {
    const map = new Map<string, AdminLessonDto>();
    for (const lesson of lessons) {
      map.set(lesson.id, lesson);
    }
    return map;
  }, [lessons]);

  const saturdayHourBuckets = useMemo(() => {
    const bucket = new Map<number, AdminLessonDto[]>();
    for (const slot of SATURDAY_SLOTS) {
      bucket.set(slot, []);
    }

    for (const lesson of filteredLessons) {
      if (resolveWeekDay(lesson) !== "saturday") {
        continue;
      }
      const slot = getSlotBucket(lesson.starts_at);
      if (slot === null || !bucket.has(slot)) {
        continue;
      }
      bucket.get(slot)?.push(lesson);
    }

    for (const slot of SATURDAY_SLOTS) {
      const items = bucket.get(slot) ?? [];
      items.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
      bucket.set(slot, items);
    }

    return bucket;
  }, [filteredLessons]);

  useEffect(() => {
    let cancelled = false;
    async function loadTeachers(): Promise<void> {
      try {
        const response = await getAdminTeachersList();
        if (!cancelled) {
          setTeacherOptions(response);
        }
      } catch {
        if (!cancelled) {
          setTeacherOptions([]);
        }
      }
    }
    void loadTeachers();
    return () => {
      cancelled = true;
    };
  }, []);

  async function moveLessonToDay(lesson: AdminLessonDto, targetDay: WeekDay): Promise<void> {
    const currentDay = resolveWeekDay(lesson);
    if (!currentDay || currentDay === targetDay) {
      return;
    }

    const rawStartsAt = getRescheduledStartsAt(lesson.starts_at, targetDay);
    if (!rawStartsAt) {
      setActionError(t("generalError"));
      return;
    }
    const nextStartsAt = getUniqueStartsAtForLessonSlot(rawStartsAt, lessons, lesson.id);

    setActionLessonId(lesson.id);
    setActionError(null);
    setMenuLessonId(null);
    try {
      await updateAdminLesson(lesson.id, {
        starts_at: nextStartsAt,
        week_day: targetDay,
        status: "planned"
      });
      await onLessonsChanged();
    } catch (actionLoadError) {
      if (actionLoadError instanceof ApiError) {
        setActionError(`${t("generalError")} (${actionLoadError.status})`);
      } else {
        setActionError(t("generalError"));
      }
    } finally {
      setActionLessonId(null);
    }
  }

  async function onCancelLesson(lessonId: string): Promise<void> {
    setActionLessonId(lessonId);
    setActionError(null);
    try {
      await cancelAdminLesson(lessonId);
      setMenuLessonId(null);
      await onLessonsChanged();
    } catch (actionLoadError) {
      if (actionLoadError instanceof ApiError) {
        setActionError(`${t("generalError")} (${actionLoadError.status})`);
      } else {
        setActionError(t("generalError"));
      }
    } finally {
      setActionLessonId(null);
    }
  }

  async function onAssignTeacherSubmit(lessonId: string): Promise<void> {
    if (assigningLessonId !== lessonId) {
      return;
    }

    setActionLessonId(lessonId);
    setActionError(null);
    try {
      await updateAdminLesson(lessonId, { teacher: selectedTeacherId || null });
      setMenuLessonId(null);
      setAssigningLessonId(null);
      setSelectedTeacherId("");
      await onLessonsChanged();
    } catch (actionLoadError) {
      if (actionLoadError instanceof ApiError) {
        setActionError(`${t("generalError")} (${actionLoadError.status})`);
      } else {
        setActionError(t("generalError"));
      }
    } finally {
      setActionLessonId(null);
    }
  }

  function onAssignTeacherOpen(lesson: AdminLessonDto): void {
    setAssigningLessonId(lesson.id);
    setSelectedTeacherId(lesson.teacher ?? "");
  }

  async function onDropToDay(targetDay: WeekDay): Promise<void> {
    if (!draggedLessonId) {
      return;
    }
    const lesson = lessonById.get(draggedLessonId);
    setDropTargetDay(null);
    setDraggedLessonId(null);
    if (!lesson) {
      return;
    }
    await moveLessonToDay(lesson, targetDay);
  }

  async function moveLessonToSaturdaySlot(
    lesson: AdminLessonDto,
    targetSlotMinutes: number
  ): Promise<void> {
    const rawStartsAt = getRescheduledStartsAtForSlot(lesson.starts_at, targetSlotMinutes);
    if (!rawStartsAt) {
      setActionError(t("generalError"));
      return;
    }
    const nextStartsAt = getUniqueStartsAtForLessonSlot(rawStartsAt, lessons, lesson.id);

    setActionLessonId(lesson.id);
    setActionError(null);
    setMenuLessonId(null);
    try {
      await updateAdminLesson(lesson.id, {
        starts_at: nextStartsAt,
        week_day: "saturday",
        status: "planned"
      });
      await onLessonsChanged();
    } catch (actionLoadError) {
      if (actionLoadError instanceof ApiError) {
        setActionError(`${t("generalError")} (${actionLoadError.status})`);
      } else {
        setActionError(t("generalError"));
      }
    } finally {
      setActionLessonId(null);
    }
  }

  async function onDropToSaturdaySlot(targetSlotMinutes: number): Promise<void> {
    if (!draggedLessonId) {
      return;
    }

    const lesson = lessonById.get(draggedLessonId);
    setDropTargetHour(null);
    setDraggedLessonId(null);
    if (!lesson) {
      return;
    }
    await moveLessonToSaturdaySlot(lesson, targetSlotMinutes);
  }

  return (
    <section className="dashboard-calendar panel">
      <div className="dashboard-calendar-header dashboard-calendar-header-row">
        <div>
          <h2 className="section-heading">{t("dashboardLessonsCalendarTitle")}</h2>
          <p className="subline dashboard-calendar-subline">{t("dashboardLessonsCalendarDescription")}</p>
        </div>
        <button
          type="button"
          className="button secondary dashboard-calendar-add-button"
          onClick={() => setIsCreateOpen(true)}
        >
          <FiPlus aria-hidden="true" />
          <span>{t("addLessonAction")}</span>
        </button>
      </div>

      <AdminLessonCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={onLessonsChanged}
      />

      <div className="dashboard-calendar-filters form-row">
        <label className="field">
          <span>{t("tableClass")}</span>
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="all">{t("filterAll")}</option>
            {classOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("calendarDayScopeLabel")}</span>
          <select
            value={dayScope}
            onChange={(event) => setDayScope(event.target.value as "all" | "saturday")}
          >
            <option value="saturday">{t("calendarDayScopeSaturday")}</option>
            <option value="all">{t("calendarDayScopeAll")}</option>
          </select>
        </label>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {actionError ? <p className="error-text">{actionError}</p> : null}

      {!isLoading && !error && dayScope === "saturday" ? (
        <div className="dashboard-saturday-timeline">
          {SATURDAY_SLOTS.map((slot) => {
            const slotLessons = saturdayHourBuckets.get(slot) ?? [];
            return (
              <article
                key={slot}
                className={`dashboard-timeline-row${dropTargetHour === slot ? " drag-target" : ""}`}
                onDragOver={(event) => {
                  if (!draggedLessonId) return;
                  event.preventDefault();
                  if (dropTargetHour !== slot) {
                    setDropTargetHour(slot);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetHour === slot) {
                    setDropTargetHour(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void onDropToSaturdaySlot(slot);
                }}
              >
                <div className="dashboard-timeline-hour">{formatSlotLabel(slot)}</div>
                <div className="dashboard-timeline-lane">
                  {slotLessons.length === 0 ? (
                    <span className="dashboard-timeline-empty"> </span>
                  ) : (
                    <div
                      className="dashboard-timeline-cards"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(slotLessons.length, 1)}, minmax(0, 1fr))`
                      }}
                    >
                      {slotLessons.map((lesson) => {
                        const teacher = getTeacherDisplay(lesson);
                        return (
                          <div
                            key={lesson.id}
                            className={`dashboard-lesson-item${draggedLessonId === lesson.id ? " dragging" : ""}`}
                            draggable={actionLessonId !== lesson.id}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", lesson.id);
                              setDraggedLessonId(lesson.id);
                              setMenuLessonId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedLessonId(null);
                              setDropTargetHour(null);
                            }}
                          >
                            <div className="dashboard-lesson-top">
                              <span className="dashboard-lesson-time">{formatTime(lesson.starts_at)}</span>
                              <button
                                type="button"
                                className="dashboard-lesson-menu-trigger"
                                aria-label={t("tableActions")}
                                onClick={() => {
                                  setAssigningLessonId((prevAssigning) =>
                                    prevAssigning === lesson.id ? prevAssigning : null
                                  );
                                  setMenuLessonId((prev) => (prev === lesson.id ? null : lesson.id));
                                }}
                                disabled={actionLessonId === lesson.id}
                              >
                                <FiMoreHorizontal aria-hidden="true" />
                              </button>
                              {menuLessonId === lesson.id ? (
                                <div className="dashboard-lesson-menu">
                                  {assigningLessonId === lesson.id ? (
                                    <>
                                      <label className="field dashboard-lesson-menu-field">
                                        <span>{t("tableTeacher")}</span>
                                        <select
                                          value={selectedTeacherId}
                                          onChange={(event) => setSelectedTeacherId(event.target.value)}
                                          disabled={actionLessonId === lesson.id}
                                        >
                                          <option value="">{t("adminLessonsNoTeacher")}</option>
                                          {teacherOptions.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                              {formatTeacherOptionLabel(teacher)}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <button
                                        type="button"
                                        className="dashboard-lesson-menu-item"
                                        onClick={() => void onAssignTeacherSubmit(lesson.id)}
                                        disabled={actionLessonId === lesson.id}
                                      >
                                        {t("saveAction")}
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      className="dashboard-lesson-menu-item"
                                      onClick={() => onAssignTeacherOpen(lesson)}
                                      disabled={actionLessonId === lesson.id}
                                    >
                                      {t("assignTeacherAction")}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="dashboard-lesson-menu-item danger"
                                    onClick={() => void onCancelLesson(lesson.id)}
                                    disabled={actionLessonId === lesson.id}
                                  >
                                    {t("cancelAction")}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            <span className="dashboard-lesson-topic">{lesson.topic || t("tableLessonSubject")}</span>
                            <span className="dashboard-lesson-meta">
                              {lesson.class_name}
                              {lesson.room ? ` · ${lesson.room}` : ""}
                            </span>
                            {teacher ? (
                              <span className="dashboard-lesson-meta">
                                {t("tableTeacher")}: {teacher}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !error && dayScope !== "saturday" ? (
        <div className="dashboard-calendar-grid">
          {visibleDays.map((day) => {
            const dayLessons = grouped.get(day) ?? [];
            return (
              <article
                key={day}
                className={`dashboard-day-card${dropTargetDay === day ? " drag-target" : ""}`}
                onDragOver={(event) => {
                  if (!draggedLessonId) return;
                  event.preventDefault();
                  if (dropTargetDay !== day) {
                    setDropTargetDay(day);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetDay === day) {
                    setDropTargetDay(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void onDropToDay(day);
                }}
              >
                <h3 className="dashboard-day-title">{localizeWeekDay(day, t)}</h3>
                {dayLessons.length === 0 ? (
                  <p className="dashboard-day-empty">{t("listEmpty")}</p>
                ) : (
                  <ul className="dashboard-day-list">
                    {dayLessons.map((lesson) => {
                      const teacher = getTeacherDisplay(lesson);
                      return (
                        <li
                          key={lesson.id}
                          className={`dashboard-lesson-item${draggedLessonId === lesson.id ? " dragging" : ""}`}
                          draggable={actionLessonId !== lesson.id}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", lesson.id);
                            setDraggedLessonId(lesson.id);
                            setMenuLessonId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedLessonId(null);
                            setDropTargetDay(null);
                          }}
                        >
                          <div className="dashboard-lesson-top">
                            <span className="dashboard-lesson-time">{formatTime(lesson.starts_at)}</span>
                            <button
                              type="button"
                              className="dashboard-lesson-menu-trigger"
                              aria-label={t("tableActions")}
                              onClick={() => {
                                setAssigningLessonId((prevAssigning) =>
                                  prevAssigning === lesson.id ? prevAssigning : null
                                );
                                setMenuLessonId((prev) => (prev === lesson.id ? null : lesson.id));
                              }}
                              disabled={actionLessonId === lesson.id}
                            >
                              <FiMoreHorizontal aria-hidden="true" />
                            </button>
                            {menuLessonId === lesson.id ? (
                              <div className="dashboard-lesson-menu">
                                {assigningLessonId === lesson.id ? (
                                  <>
                                    <label className="field dashboard-lesson-menu-field">
                                      <span>{t("tableTeacher")}</span>
                                      <select
                                        value={selectedTeacherId}
                                        onChange={(event) => setSelectedTeacherId(event.target.value)}
                                        disabled={actionLessonId === lesson.id}
                                      >
                                        <option value="">{t("adminLessonsNoTeacher")}</option>
                                        {teacherOptions.map((teacher) => (
                                          <option key={teacher.id} value={teacher.id}>
                                            {formatTeacherOptionLabel(teacher)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <button
                                      type="button"
                                      className="dashboard-lesson-menu-item"
                                      onClick={() => void onAssignTeacherSubmit(lesson.id)}
                                      disabled={actionLessonId === lesson.id}
                                    >
                                      {t("saveAction")}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="dashboard-lesson-menu-item"
                                    onClick={() => onAssignTeacherOpen(lesson)}
                                    disabled={actionLessonId === lesson.id}
                                  >
                                    {t("assignTeacherAction")}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="dashboard-lesson-menu-item danger"
                                  onClick={() => void onCancelLesson(lesson.id)}
                                  disabled={actionLessonId === lesson.id}
                                >
                                  {t("cancelAction")}
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <span className="dashboard-lesson-topic">{lesson.topic || t("tableLessonSubject")}</span>
                          <span className="dashboard-lesson-meta">
                            {lesson.class_name}
                            {lesson.room ? ` · ${lesson.room}` : ""}
                          </span>
                          {teacher ? (
                            <span className="dashboard-lesson-meta">
                              {t("tableTeacher")}: {teacher}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function formatTeacherOptionLabel(item: AdminTeacherItemDto): string {
  const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim();
  if (fullName) {
    return `${fullName} (${item.email})`;
  }
  return item.email;
}
