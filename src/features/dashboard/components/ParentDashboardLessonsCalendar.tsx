import { useMemo, useState } from "react";
import { localizeWeekDay } from "../../../shared/i18n/backendLabels";
import { TranslationKey } from "../../../shared/i18n/translations";
import { ParentChildDto, ParentLessonDto } from "../../../shared/types/parent";

interface ParentDashboardLessonsCalendarProps {
  children: ParentChildDto[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  lessons: ParentLessonDto[];
  isChildrenLoading: boolean;
  isLessonsLoading: boolean;
  error: string | null;
  t: (key: TranslationKey) => string;
}

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

function resolveWeekDay(lesson: ParentLessonDto): WeekDay | null {
  if (lesson.week_day && WEEK_DAYS.includes(lesson.week_day as WeekDay)) {
    return lesson.week_day as WeekDay;
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

function isCancelledLesson(status?: string): boolean {
  const normalized = status?.trim().toLowerCase();
  return normalized === "cancelled" || normalized === "canceled";
}

export function ParentDashboardLessonsCalendar({
  children,
  selectedChildId,
  onSelectChild,
  lessons,
  isChildrenLoading,
  isLessonsLoading,
  error,
  t
}: ParentDashboardLessonsCalendarProps): JSX.Element {
  const [dayScope, setDayScope] = useState<"all" | "saturday">("all");
  const grouped = useMemo(() => {
    const bucket = new Map<WeekDay, ParentLessonDto[]>();
    for (const day of WEEK_DAYS) {
      bucket.set(day, []);
    }

    for (const lesson of lessons) {
      if (isCancelledLesson(lesson.status)) {
        continue;
      }
      if (dayScope === "saturday" && resolveWeekDay(lesson) !== "saturday") {
        continue;
      }
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
  }, [dayScope, lessons]);

  const visibleDays = useMemo<WeekDay[]>(
    () => (dayScope === "saturday" ? ["saturday"] : [...WEEK_DAYS]),
    [dayScope]
  );

  return (
    <section className="dashboard-calendar panel">
      <div className="dashboard-calendar-header">
        <h2 className="section-heading">{t("dashboardLessonsCalendarTitle")}</h2>
        <p className="subline dashboard-calendar-subline">{t("dashboardLessonsCalendarDescription")}</p>
      </div>

      {children.length > 1 ? (
        <div className="child-selector parent-child-selector dashboard-child-selector">
          {children.map((child) => {
            const fullName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim();
            const isActive = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                type="button"
                className={`chip-button${isActive ? " active" : ""}`}
                onClick={() => onSelectChild(child.id)}
              >
                {fullName || child.email || child.id}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="dashboard-calendar-filters">
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

      {isChildrenLoading || isLessonsLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!isChildrenLoading && children.length === 0 ? <p>{t("childrenListEmpty")}</p> : null}

      {!isChildrenLoading && !isLessonsLoading && !error && selectedChildId ? (
        <div className={`dashboard-calendar-grid${dayScope === "saturday" ? " saturday-only" : ""}`}>
          {visibleDays.map((day) => {
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
                          {lesson.class_name ?? "-"}
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
