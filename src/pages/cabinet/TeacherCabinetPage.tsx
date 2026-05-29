import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../shared/api/httpClient";
import { getTeacherMeLessons } from "../../shared/api/teacherApi";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { localizeWeekDay } from "../../shared/i18n/backendLabels";
import { TeacherLessonDto } from "../../shared/types/teacher";

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
  const [lessons, setLessons] = useState<TeacherLessonDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (selectedClass === "all") return lessons;
    return lessons.filter((lesson) => {
      const classValue = lesson.class_name || lesson.school_class;
      return classValue === selectedClass;
    });
  }, [lessons, selectedClass]);

  const grouped = useMemo(() => {
    const map = new Map<string, TeacherLessonDto[]>();
    filteredLessons.forEach((lesson) => {
      const key = lesson.week_day || "unknown";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(lesson);
    });
    return map;
  }, [filteredLessons]);

  const weekDays: string[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];

  return (
    <section className="panel">
      <h1 className="headline">{t("teacherCabinetTitle")}</h1>
      <p className="subline">{t("teacherCabinetDescription")}</p>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !error && lessons.length === 0 ? <p>{t("teacherLessonsEmpty")}</p> : null}

      {!isLoading && !error && lessons.length > 0 ? (
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
          </div>
          <div className="dashboard-calendar-grid">
            {weekDays.map((weekDay) => {
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
    </section>
  );
}
