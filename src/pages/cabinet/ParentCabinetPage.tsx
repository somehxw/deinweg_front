import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getParentChildAttendance,
  getParentChildFeedback,
  getParentChildren,
  getParentLessons
} from "../../shared/api/parentApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { localizeAttendanceStatus, localizeWeekDay } from "../../shared/i18n/backendLabels";
import { ParentAttendanceDto, ParentChildDto, ParentLessonDto } from "../../shared/types/parent";
import { TeacherFeedbackDto } from "../../shared/types/teacher";
import { ParentFeedbackTable } from "../../features/feedback/components/ParentFeedbackTable";

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
] as const;

type WeekDay = (typeof WEEK_DAYS)[number];

function formatDateTime(value: string): { date: string; time: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "-", time: "-" };
  }

  return {
    date: new Intl.DateTimeFormat("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date),
    time: new Intl.DateTimeFormat("uk-UA", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  };
}

function resolveWeekDay(lesson: ParentLessonDto): WeekDay | null {
  if (lesson.week_day && WEEK_DAYS.includes(lesson.week_day as WeekDay)) {
    return lesson.week_day as WeekDay;
  }

  const date = new Date(lesson.starts_at);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const mapped: Record<number, WeekDay> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday"
  };

  return mapped[date.getDay()] ?? null;
}

function isLessonTag(value: string): boolean {
  return /^#[0-9a-f]{6,}$/i.test(value);
}

export function ParentCabinetPage(): JSX.Element {
  const { t } = useI18n();
  const location = useLocation();
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isChildrenLoading, setIsChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [lessons, setLessons] = useState<ParentLessonDto[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<ParentAttendanceDto[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<TeacherFeedbackDto[]>([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<"schedule" | "attendance" | "feedback">(
    "schedule"
  );
  const [scheduleDayScope, setScheduleDayScope] = useState<"all" | "saturday">("saturday");

  useEffect(() => {
    if (location.hash === "#attendance") {
      setActiveSection("attendance");
      return;
    }
    if (location.hash === "#feedback") {
      setActiveSection("feedback");
      return;
    }
    setActiveSection("schedule");
  }, [location.hash]);

  useEffect(() => {
    async function loadChildren(): Promise<void> {
      setIsChildrenLoading(true);
      setChildrenError(null);
      try {
        const response = await getParentChildren();
        setChildren(response);
        setSelectedChildId((current) => current ?? response[0]?.id ?? null);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setChildrenError(`${t("scheduleChildrenLoadError")} (${loadError.status})`);
        } else {
          setChildrenError(t("scheduleChildrenLoadError"));
        }
      } finally {
        setIsChildrenLoading(false);
      }
    }

    void loadChildren();
  }, [t]);

  useEffect(() => {
    if (!selectedChildId) {
      setLessons([]);
      setAttendance([]);
      setFeedback([]);
      setLessonsError(null);
      setAttendanceError(null);
      setFeedbackError(null);
      setIsLessonsLoading(false);
      setIsAttendanceLoading(false);
      setIsFeedbackLoading(false);
      return;
    }

    const childId = selectedChildId;
    let cancelled = false;

    async function loadLessons(): Promise<void> {
      setIsLessonsLoading(true);
      setLessonsError(null);
      try {
        const response = await getParentLessons({ studentId: childId });
        if (!cancelled) {
          setLessons(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setLessonsError(`${t("parentScheduleLoadError")} (${loadError.status})`);
          } else {
            setLessonsError(t("parentScheduleLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLessonsLoading(false);
        }
      }
    }

    async function loadAttendance(): Promise<void> {
      setIsAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const response = await getParentChildAttendance(childId);
        if (!cancelled) {
          setAttendance(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setAttendanceError(`${t("parentAttendanceLoadError")} (${loadError.status})`);
          } else {
            setAttendanceError(t("parentAttendanceLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsAttendanceLoading(false);
        }
      }
    }

    async function loadFeedback(): Promise<void> {
      setIsFeedbackLoading(true);
      setFeedbackError(null);
      try {
        const response = await getParentChildFeedback(childId);
        if (!cancelled) {
          setFeedback(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setFeedbackError(`${t("parentFeedbackLoadError")} (${loadError.status})`);
          } else {
            setFeedbackError(t("parentFeedbackLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsFeedbackLoading(false);
        }
      }
    }

    void Promise.all([loadLessons(), loadAttendance(), loadFeedback()]);

    return () => {
      cancelled = true;
    };
  }, [selectedChildId, t]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId) {
      return null;
    }
    return children.find((child) => child.id === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  const lessonsById = useMemo(() => {
    const map = new Map<string, ParentLessonDto>();
    lessons.forEach((lesson) => {
      map.set(lesson.id, lesson);
    });
    return map;
  }, [lessons]);

  const resolveLessonTitle = useCallback(
    (lessonId: string, lessonTopic?: string): string => {
      const topic = lessonTopic?.trim();
      if (topic && !isLessonTag(topic)) {
        return topic;
      }

      const topicFromLesson = lessonsById.get(lessonId)?.topic?.trim();
      return topicFromLesson || "-";
    },
    [lessonsById]
  );

  const scheduleByDay = useMemo(() => {
    const map = new Map<WeekDay, ParentLessonDto[]>();
    WEEK_DAYS.forEach((day) => map.set(day, []));

    lessons.forEach((lesson) => {
      const day = resolveWeekDay(lesson);
      if (!day) return;
      if (scheduleDayScope === "saturday" && day !== "saturday") {
        return;
      }
      map.get(day)?.push(lesson);
    });

    WEEK_DAYS.forEach((day) => {
      const items = map.get(day) ?? [];
      items.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
      map.set(day, items);
    });

    return map;
  }, [lessons, scheduleDayScope]);

  const visibleScheduleDays = useMemo<WeekDay[]>(
    () => (scheduleDayScope === "saturday" ? ["saturday"] : [...WEEK_DAYS]),
    [scheduleDayScope]
  );

  return (
    <section className="panel parent-flow-page">
      <h1 className="headline">{t("parentCabinetTitle")}</h1>
      <p className="subline">{t("parentCabinetDescription")}</p>

      <div className="cabinet-section">
        <h2 className="section-heading">{t("childrenListTitle")}</h2>
        {isChildrenLoading ? <p>{t("listLoading")}</p> : null}
        {childrenError ? <p className="error-text">{childrenError}</p> : null}
        {!isChildrenLoading && !childrenError && children.length === 0 ? (
          <p>{t("childrenListEmpty")}</p>
        ) : null}

        {!isChildrenLoading && !childrenError && children.length > 0 ? (
          <div className="child-selector parent-child-selector">
            {children.map((child) => {
              const isActive = child.id === selectedChild?.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  className={`chip-button${isActive ? " active" : ""}`}
                  onClick={() => setSelectedChildId(child.id)}
                >
                  {(child.first_name ?? "").trim()} {(child.last_name ?? "").trim()}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedChild ? (
        <>
          {activeSection === "schedule" ? (
            <div id="schedule" className="cabinet-section">
              <h2 className="section-heading">{t("scheduleTitle")}</h2>
              {isLessonsLoading ? <p>{t("listLoading")}</p> : null}
              {lessonsError ? <p className="error-text">{lessonsError}</p> : null}
              {!isLessonsLoading && !lessonsError && lessons.length === 0 ? (
                <p>{t("parentScheduleEmpty")}</p>
              ) : null}
              {!isLessonsLoading && !lessonsError && lessons.length > 0 ? (
                <>
                  <div className="dashboard-calendar-filters">
                    <label className="field">
                      <span>{t("calendarDayScopeLabel")}</span>
                      <select
                        value={scheduleDayScope}
                        onChange={(event) => setScheduleDayScope(event.target.value as "all" | "saturday")}
                      >
                        <option value="saturday">{t("calendarDayScopeSaturday")}</option>
                        <option value="all">{t("calendarDayScopeAll")}</option>
                      </select>
                    </label>
                  </div>
                  <div className={`dashboard-calendar-grid${scheduleDayScope === "saturday" ? " saturday-only" : ""}`}>
                  {visibleScheduleDays.map((day) => {
                    const dayLessons = scheduleByDay.get(day) ?? [];
                    return (
                      <article key={day} className="dashboard-day-card">
                        <h3 className="dashboard-day-title">{localizeWeekDay(day, t)}</h3>
                        {dayLessons.length === 0 ? (
                          <p className="dashboard-day-empty">{t("listEmpty")}</p>
                        ) : (
                          <ul className="dashboard-day-list">
                            {dayLessons.map((lesson) => {
                              const dateTime = formatDateTime(lesson.starts_at);
                              return (
                                <li key={lesson.id} className="dashboard-lesson-item">
                                  <span className="dashboard-lesson-time">{dateTime.time}</span>
                                  <span className="dashboard-lesson-topic">{lesson.topic ?? "-"}</span>
                                  <span className="dashboard-lesson-meta">
                                    {lesson.class_name ?? "-"}
                                    {lesson.room ? ` · ${lesson.room}` : ""}
                                  </span>
                                  {lesson.teacher ? (
                                    <span className="dashboard-lesson-meta">
                                      {t("tableTeacher")}: {lesson.teacher}
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
                </>
              ) : null}
            </div>
          ) : null}

          {activeSection === "attendance" ? (
            <div id="attendance" className="cabinet-section">
              <h2 className="section-heading">{t("openAttendance")}</h2>
              {isAttendanceLoading ? <p>{t("listLoading")}</p> : null}
              {attendanceError ? <p className="error-text">{attendanceError}</p> : null}
              {!isAttendanceLoading && !attendanceError && attendance.length === 0 ? (
                <p>{t("parentAttendanceEmpty")}</p>
              ) : null}
              {!isAttendanceLoading && !attendanceError && attendance.length > 0 ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("tableLessonSubject")}</th>
                        <th>{t("tableLessonTime")}</th>
                        <th>{t("teacherAttendanceStatusLabel")}</th>
                        <th>{t("tableComment")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((item) => {
                        const lesson = lessonsById.get(item.lesson);
                        const dateTime = lesson ? formatDateTime(lesson.starts_at) : { date: "-", time: "-" };
                        return (
                          <tr key={item.id}>
                            <td>{resolveLessonTitle(item.lesson, lesson?.topic)}</td>
                            <td>{`${dateTime.date}, ${dateTime.time}`}</td>
                            <td>{localizeAttendanceStatus(item.status, t)}</td>
                            <td>{item.comment?.trim() ? item.comment : "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeSection === "feedback" ? (
            <div id="feedback" className="cabinet-section">
              <h2 className="section-heading">{t("parentFeedbackTitle")}</h2>
              {isFeedbackLoading ? <p>{t("listLoading")}</p> : null}
              {feedbackError ? <p className="error-text">{feedbackError}</p> : null}
              {!isFeedbackLoading && !feedbackError ? (
                <ParentFeedbackTable items={feedback} t={t} resolveLessonTitle={resolveLessonTitle} />
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
