import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getParentChildren } from "../../shared/api/parentApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { ParentChildDto } from "../../shared/types/parent";

type LessonItem = {
  day: string;
  time: string;
  subject: string;
};

type GradeItem = {
  subject: string;
  score: string;
  progress: string;
};

type FeedbackItem = {
  teacher: string;
  comment: string;
};

type PerformanceItem = {
  metric: string;
  value: string;
};

// TODO: confirm with backend endpoints for schedule, feedback and grades.
const FALLBACK_SCHEDULE: LessonItem[] = [
  { day: "Пн", time: "10:00", subject: "Математика" },
  { day: "Ср", time: "11:00", subject: "Німецька мова" },
  { day: "Пт", time: "12:00", subject: "Природознавство" }
];

const FALLBACK_GRADES: GradeItem[] = [
  { subject: "Математика", score: "11/12", progress: "Високий" },
  { subject: "Німецька мова", score: "10/12", progress: "Стабільний" },
  { subject: "Природознавство", score: "9/12", progress: "Позитивний" }
];

const FALLBACK_FEEDBACK: FeedbackItem[] = [
  { teacher: "Олена І.", comment: "Добра концентрація на уроці." },
  { teacher: "Марко К.", comment: "Покращилась самостійність у домашніх завданнях." }
];

const FALLBACK_PERFORMANCE: PerformanceItem[] = [
  { metric: "Відвідуваність", value: "95%" },
  { metric: "Середній бал", value: "10.0 / 12" },
  { metric: "Домашні завдання", value: "Виконано 18 з 20" }
];

export function ParentCabinetPage(): JSX.Element {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"schedule" | "grades" | "feedback">(
    "schedule"
  );

  useEffect(() => {
    if (location.hash === "#grades") {
      setActiveSection("grades");
      return;
    }
    if (location.hash === "#feedback") {
      setActiveSection("feedback");
      return;
    }
    setActiveSection("schedule");
  }, [location.hash]);

  function switchSection(section: "schedule" | "grades" | "feedback"): void {
    setActiveSection(section);
    navigate(`#${section}`, { replace: true });
  }

  useEffect(() => {
    async function loadChildren(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getParentChildren();
        setChildren(response);
        setSelectedChildId((current) => current ?? response[0]?.id ?? null);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${t("scheduleChildrenLoadError")} (${loadError.status})`);
        } else {
          setError(t("scheduleChildrenLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadChildren();
  }, [t]);

  const selectedChild = useMemo(() => {
    if (!selectedChildId) {
      return null;
    }
    return children.find((child) => child.id === selectedChildId) ?? null;
  }, [children, selectedChildId]);

  return (
    <section className="panel parent-flow-page">
      <h1 className="headline">{t("parentCabinetTitle")}</h1>
      <p className="subline">{t("parentCabinetDescription")}</p>

      <div className="row parent-flow-sections">
        <button
          type="button"
          className={`button secondary${activeSection === "schedule" ? " active" : ""}`}
          onClick={() => switchSection("schedule")}
        >
          {t("openSchedule")}
        </button>
        <button
          type="button"
          className={`button secondary${activeSection === "grades" ? " active" : ""}`}
          onClick={() => switchSection("grades")}
        >
          {t("openGrades")}
        </button>
        <button
          type="button"
          className={`button secondary${activeSection === "feedback" ? " active" : ""}`}
          onClick={() => switchSection("feedback")}
        >
          {t("openFeedback")}
        </button>
      </div>

      <div className="cabinet-section">
        <h2 className="section-heading">{t("childrenListTitle")}</h2>
        {isLoading ? <p>{t("listLoading")}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!isLoading && !error && children.length === 0 ? (
          <p>{t("childrenListEmpty")}</p>
        ) : null}

        {!isLoading && !error && children.length > 0 ? (
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
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("tableLessonDay")}</th>
                      <th>{t("tableLessonTime")}</th>
                      <th>{t("tableLessonSubject")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FALLBACK_SCHEDULE.map((item, index) => (
                      <tr key={`${item.day}-${item.time}-${index}`}>
                        <td>{item.day}</td>
                        <td>{item.time}</td>
                        <td>{item.subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeSection === "feedback" ? (
            <div id="feedback" className="cabinet-section">
              <h2 className="section-heading">{t("parentFeedbackTitle")}</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("tableTeacher")}</th>
                      <th>{t("tableComment")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FALLBACK_FEEDBACK.map((item, index) => (
                      <tr key={`${item.teacher}-${index}`}>
                        <td>{item.teacher}</td>
                        <td>{item.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeSection === "grades" ? (
            <>
              <div id="grades" className="cabinet-section">
                <h2 className="section-heading">{t("childGradesTitle")}</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("tableLessonSubject")}</th>
                        <th>{t("tableGrade")}</th>
                        <th>{t("tableProgress")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FALLBACK_GRADES.map((item, index) => (
                        <tr key={`${item.subject}-${index}`}>
                          <td>{item.subject}</td>
                          <td>{item.score}</td>
                          <td>{item.progress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="cabinet-section">
                <h2 className="section-heading">{t("childPerformanceTitle")}</h2>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t("tableMetric")}</th>
                        <th>{t("tableValue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FALLBACK_PERFORMANCE.map((item, index) => (
                        <tr key={`${item.metric}-${index}`}>
                          <td>{item.metric}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
