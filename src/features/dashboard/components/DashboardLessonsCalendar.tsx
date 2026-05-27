import { useMemo, useState } from "react";
import { localizeWeekDay } from "../../../shared/i18n/backendLabels";
import { TranslationKey } from "../../../shared/i18n/translations";
import { AdminLessonDto, WeekDay } from "../../../shared/types/admin";

interface DashboardLessonsCalendarProps {
  lessons: AdminLessonDto[];
  isLoading: boolean;
  error: string | null;
  t: (key: TranslationKey) => string;
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
    return "—";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function DashboardLessonsCalendar({
  lessons,
  isLoading,
  error,
  t
}: DashboardLessonsCalendarProps): JSX.Element {
  const [selectedClass, setSelectedClass] = useState<string>("all");

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
      if (selectedClass !== "all" && lesson.class_name !== selectedClass) {
        return false;
      }
      return true;
    });
  }, [lessons, selectedClass]);

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
      items.sort((a, b) => {
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      });
      bucket.set(day, items);
    }

    return bucket;
  }, [filteredLessons]);

  return (
    <section className="dashboard-calendar panel">
      <div className="dashboard-calendar-header">
        <h2 className="section-heading">{t("dashboardLessonsCalendarTitle")}</h2>
        <p className="subline dashboard-calendar-subline">{t("dashboardLessonsCalendarDescription")}</p>
      </div>

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
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !error ? (
        <div className="dashboard-calendar-grid">
          {WEEK_DAYS.map((day) => {
            const dayLessons = grouped.get(day) ?? [];
            return (
              <article key={day} className="dashboard-day-card">
                <h3 className="dashboard-day-title">{localizeWeekDay(day, t)}</h3>
                {dayLessons.length === 0 ? (
                  <p className="dashboard-day-empty">{t("listEmpty")}</p>
                ) : (
                  <ul className="dashboard-day-list">
                    {dayLessons.map((lesson) => (
                      <li key={lesson.id} className="dashboard-lesson-item">
                        <span className="dashboard-lesson-time">{formatTime(lesson.starts_at)}</span>
                        <span className="dashboard-lesson-topic">{lesson.topic || t("tableLessonSubject")}</span>
                        <span className="dashboard-lesson-meta">
                          {lesson.class_name}
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
      ) : null}
    </section>
  );
}
