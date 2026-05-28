import { useMemo, useState } from "react";
import { FiMoreHorizontal, FiPlus } from "react-icons/fi";
import { cancelAdminLesson, updateAdminLesson } from "../../../shared/api/adminApi";
import { ApiError } from "../../../shared/api/httpClient";
import { localizeWeekDay } from "../../../shared/i18n/backendLabels";
import { TranslationKey } from "../../../shared/i18n/translations";
import { AdminLessonDto, WeekDay } from "../../../shared/types/admin";
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

function getTeacherDisplay(lesson: AdminLessonDto): string | null {
  if (lesson.teacher_info) {
    const fullName = `${lesson.teacher_info.first_name} ${lesson.teacher_info.last_name}`.trim();
    return fullName || lesson.teacher_info.user_email || null;
  }
  return lesson.teacher ?? null;
}

export function DashboardLessonsCalendar({
  lessons,
  isLoading,
  error,
  t,
  onLessonsChanged
}: DashboardLessonsCalendarProps): JSX.Element {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dayScope, setDayScope] = useState<"all" | "saturday">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLessonId, setActionLessonId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [menuLessonId, setMenuLessonId] = useState<string | null>(null);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<WeekDay | null>(null);

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

  async function moveLessonToDay(lesson: AdminLessonDto, targetDay: WeekDay): Promise<void> {
    const currentDay = resolveWeekDay(lesson);
    if (!currentDay || currentDay === targetDay) {
      return;
    }

    const nextStartsAt = getRescheduledStartsAt(lesson.starts_at, targetDay);
    if (!nextStartsAt) {
      setActionError(t("generalError"));
      return;
    }

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
            <option value="all">{t("calendarDayScopeAll")}</option>
            <option value="saturday">{t("calendarDayScopeSaturday")}</option>
          </select>
        </label>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {actionError ? <p className="error-text">{actionError}</p> : null}

      {!isLoading && !error ? (
        <div className={`dashboard-calendar-grid${dayScope === "saturday" ? " saturday-only" : ""}`}>
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
                                setMenuLessonId((prev) => (prev === lesson.id ? null : lesson.id));
                              }}
                              disabled={actionLessonId === lesson.id}
                            >
                              <FiMoreHorizontal aria-hidden="true" />
                            </button>
                            {menuLessonId === lesson.id ? (
                              <div className="dashboard-lesson-menu">
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
