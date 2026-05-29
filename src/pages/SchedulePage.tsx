import { useEffect, useMemo, useState } from "react";
import { getParentChildren } from "../shared/api/parentApi";
import { ApiError } from "../shared/api/httpClient";
import { getUserRoleFromToken } from "../shared/auth/roles";
import { useI18n } from "../shared/i18n/I18nProvider";
import { ParentChildDto } from "../shared/types/parent";
import { getTeacherMeLessons } from "../shared/api/teacherApi";
import { localizeWeekDay } from "../shared/i18n/backendLabels";
import { TeacherLessonDto } from "../shared/types/teacher";

function formatTime(startsAt: string | undefined): string {
  if (!startsAt) return "-";
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function SchedulePage(): JSX.Element {
  const { t } = useI18n();
  const role = getUserRoleFromToken();
  const isParent = role === "parent";
  const isTeacher = role === "teacher";

  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [isLoading, setIsLoading] = useState(isParent || isTeacher);
  const [error, setError] = useState<string | null>(null);
  const [teacherLessons, setTeacherLessons] = useState<TeacherLessonDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  useEffect(() => {
    if (!isParent && !isTeacher) {
      return;
    }

    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        if (isParent) {
          const response = await getParentChildren();
          setChildren(response);
        }

        if (isTeacher) {
          const lessons = await getTeacherMeLessons();
          lessons.sort((a, b) => {
            const left = a.starts_at ? new Date(a.starts_at).getTime() : 0;
            const right = b.starts_at ? new Date(b.starts_at).getTime() : 0;
            return left - right;
          });
          setTeacherLessons(lessons);
        }
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${isTeacher ? t("teacherLessonsLoadError") : t("scheduleChildrenLoadError")} (${loadError.status})`);
        } else {
          setError(isTeacher ? t("teacherLessonsLoadError") : t("scheduleChildrenLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [isParent, isTeacher, t]);

  const classOptions = useMemo(() => {
    const unique = new Set<string>();
    teacherLessons.forEach((lesson) => {
      const classValue = lesson.class_name || lesson.school_class;
      if (classValue) unique.add(classValue);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [teacherLessons]);

  const filteredLessons = useMemo(() => {
    if (selectedClass === "all") return teacherLessons;
    return teacherLessons.filter((lesson) => {
      const classValue = lesson.class_name || lesson.school_class;
      return classValue === selectedClass;
    });
  }, [selectedClass, teacherLessons]);

  const groupedTeacherLessons = useMemo(() => {
    const map = new Map<string, TeacherLessonDto[]>();
    filteredLessons.forEach((lesson) => {
      const key = lesson.week_day || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(lesson);
    });
    return map;
  }, [filteredLessons]);

  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <section className="panel parent-flow-page">
      <h1 className="headline">{t("scheduleTitle")}</h1>
      <p className="subline">{t("scheduleDescription")}</p>

      {isParent ? (
        <div className="children-block">
          <h2 className="section-heading">{t("childrenListTitle")}</h2>
          {isLoading ? <p>{t("listLoading")}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && children.length === 0 ? (
            <p>{t("childrenListEmpty")}</p>
          ) : null}
          {!isLoading && !error && children.length > 0 ? (
            <div className="children-grid parent-children-grid">
              {children.map((child) => (
                <article key={child.id} className="child-card">
                  <p className="child-name">
                    {child.first_name ?? ""} {child.last_name ?? ""}
                  </p>
                  <p className="child-meta">{child.email ?? "-"}</p>
                  <p className="child-meta">{child.birth_date ?? "-"}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {isTeacher ? (
        <>
          {isLoading ? <p>{t("listLoading")}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!isLoading && !error && teacherLessons.length === 0 ? <p>{t("teacherLessonsEmpty")}</p> : null}
          {!isLoading && !error && teacherLessons.length > 0 ? (
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
                  const dayLessons = groupedTeacherLessons.get(weekDay) ?? [];
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
                              <span className="dashboard-lesson-topic">
                                {lesson.topic || t("tableLessonSubject")}
                              </span>
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
        </>
      ) : null}
    </section>
  );
}
