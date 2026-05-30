import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError } from "../../shared/api/httpClient";
import { getTeacherMeLessons, getTeacherMeProfile } from "../../shared/api/teacherApi";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { localizeWeekDay } from "../../shared/i18n/backendLabels";
import { TeacherLessonDto, TeacherProfileDto } from "../../shared/types/teacher";
import { TeacherFeedbackManager } from "../../features/feedback/components/TeacherFeedbackManager";
import { TeacherAttendanceManager } from "../../features/feedback/components/TeacherAttendanceManager";
import { TeacherProfileForm } from "../../features/teacher/components/TeacherProfileForm";

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

function resolveWeekDay(lesson: TeacherLessonDto): WeekDay | null {
  if (lesson.week_day && WEEK_DAYS.includes(lesson.week_day as WeekDay)) {
    return lesson.week_day as WeekDay;
  }

  if (!lesson.starts_at) {
    return null;
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

function formatTime(startsAt: string | undefined): string {
  if (!startsAt) return "-";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function TeacherCabinetPage(): JSX.Element {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [lessons, setLessons] = useState<TeacherLessonDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dayScope, setDayScope] = useState<"all" | "saturday">("saturday");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeacherProfileDto | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const sectionParam = searchParams.get("section");
  const activeSection: "schedule" | "feedback" | "attendance" | "profile" =
    sectionParam === "feedback" ||
    sectionParam === "attendance" ||
    sectionParam === "profile"
      ? sectionParam
      : "schedule";

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const myLessons = await getTeacherMeLessons();
        myLessons.sort((a, b) => {
          const left = a.starts_at ? new Date(a.starts_at).getTime() : 0;
          const right = b.starts_at ? new Date(b.starts_at).getTime() : 0;
          return left - right;
        });

        if (!cancelled) {
          setLessons(myLessons);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setError(`${t("teacherLessonsLoadError")} (${loadError.status})`);
          } else {
            setError(t("teacherLessonsLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      setIsProfileLoading(true);
      setProfileError(null);
      try {
        const response = await getTeacherMeProfile();
        if (!cancelled) {
          setProfile(response);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError) {
            setProfileError(`${t("teacherProfileLoadError")} (${loadError.status})`);
          } else {
            setProfileError(t("teacherProfileLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false);
        }
      }
    }

    if (activeSection === "profile") {
      void loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [activeSection, t]);

  const classOptions = useMemo(() => {
    const unique = new Set<string>();
    lessons.forEach((lesson) => {
      const classValue = lesson.class_name || lesson.school_class;
      if (classValue) {
        unique.add(classValue);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (dayScope === "saturday" && resolveWeekDay(lesson) !== "saturday") {
        return false;
      }
      if (selectedClass === "all") {
        return true;
      }
      const classValue = lesson.class_name || lesson.school_class;
      return classValue === selectedClass;
    });
  }, [dayScope, lessons, selectedClass]);

  const grouped = useMemo(() => {
    const map = new Map<WeekDay, TeacherLessonDto[]>();
    for (const day of WEEK_DAYS) {
      map.set(day, []);
    }
    filteredLessons.forEach((lesson) => {
      const key = resolveWeekDay(lesson);
      if (!key) {
        return;
      }
      map.get(key)?.push(lesson);
    });

    for (const day of WEEK_DAYS) {
      const items = map.get(day) ?? [];
      items.sort((a, b) => {
        const left = a.starts_at ? new Date(a.starts_at).getTime() : 0;
        const right = b.starts_at ? new Date(b.starts_at).getTime() : 0;
        return left - right;
      });
      map.set(day, items);
    }

    return map;
  }, [filteredLessons]);

  const visibleDays = useMemo<WeekDay[]>(
    () => (dayScope === "saturday" ? ["saturday"] : [...WEEK_DAYS]),
    [dayScope]
  );

  const hasVisibleLessons = useMemo(() => {
    return visibleDays.some((day) => (grouped.get(day) ?? []).length > 0);
  }, [grouped, visibleDays]);

  const hasAnyLessonsForClass = useMemo(() => {
    if (selectedClass === "all") {
      return lessons.length > 0;
    }
    return lessons.some((lesson) => {
      const classValue = lesson.class_name || lesson.school_class;
      return classValue === selectedClass;
    });
  }, [lessons, selectedClass]);

  return (
    <section className="panel teacher-cabinet-panel">
      <h1 className="headline">{t("teacherCabinetTitle")}</h1>
      <p className="subline">{t("teacherCabinetDescription")}</p>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !error && lessons.length === 0 ? <p>{t("teacherLessonsEmpty")}</p> : null}

      {!isLoading && !error && lessons.length > 0 && activeSection === "schedule" ? (
        <section className="dashboard-calendar panel">
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
          {hasAnyLessonsForClass && !hasVisibleLessons ? <p>{t("listEmpty")}</p> : null}
          <div className={`dashboard-calendar-grid${dayScope === "saturday" ? " saturday-only" : ""}`}>
            {visibleDays.map((weekDay) => {
              const dayLessons = grouped.get(weekDay) ?? [];
              return (
                <article key={weekDay} className="dashboard-day-card">
                  <h3 className="dashboard-day-title">{localizeWeekDay(weekDay, t)}</h3>
                  {dayLessons.length === 0 ? (
                    <p className="dashboard-day-empty">{t("listEmpty")}</p>
                  ) : (
                    <ul className="dashboard-day-list">
                      {dayLessons.map((lesson) => (
                        <li key={lesson.id} className="dashboard-lesson-item">
                          <span className="dashboard-lesson-time">{formatTime(lesson.starts_at)}</span>
                          <span className="dashboard-lesson-topic">{lesson.topic || t("tableLessonSubject")}</span>
                          <span className="dashboard-lesson-meta">
                            {lesson.class_name || lesson.school_class || "-"}
                            {lesson.room ? ` · ${lesson.room}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {activeSection === "feedback" ? (
        <TeacherFeedbackManager
          lessons={lessons}
          isLessonsLoading={isLoading}
          lessonsError={error}
          t={t}
        />
      ) : null}
      {activeSection === "attendance" ? (
        <TeacherAttendanceManager
          lessons={lessons}
          isLessonsLoading={isLoading}
          lessonsError={error}
          t={t}
        />
      ) : null}
      {activeSection === "profile" ? (
        <TeacherProfileForm profile={profile} isLoading={isProfileLoading} loadError={profileError} t={t} />
      ) : null}
    </section>
  );
}
