import { useI18n } from "../../shared/i18n/I18nProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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

// TODO: confirm with backend endpoints for student schedule and grades.
const CHILD_SCHEDULE: LessonItem[] = [
  { day: "Вт", time: "10:00", subject: "Математика" },
  { day: "Чт", time: "11:00", subject: "Німецька мова" },
  { day: "Сб", time: "09:30", subject: "Історія" }
];

const CHILD_GRADES: GradeItem[] = [
  { subject: "Математика", score: "10/12", progress: "Позитивний" },
  { subject: "Німецька мова", score: "11/12", progress: "Високий" },
  { subject: "Історія", score: "9/12", progress: "Стабільний" }
];

export function ChildCabinetPage(): JSX.Element {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"schedule" | "grades">("schedule");

  useEffect(() => {
    if (location.hash === "#grades") {
      setActiveSection("grades");
      return;
    }
    setActiveSection("schedule");
  }, [location.hash]);

  function switchSection(section: "schedule" | "grades"): void {
    setActiveSection(section);
    navigate(`#${section}`, { replace: true });
  }

  return (
    <section className="panel">
      <h1 className="headline">{t("childCabinetTitle")}</h1>
      <p className="subline">{t("childCabinetDescription")}</p>

      <div className="row">
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
      </div>

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
                {CHILD_SCHEDULE.map((item, index) => (
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

      {activeSection === "grades" ? (
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
                {CHILD_GRADES.map((item, index) => (
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
      ) : null}
    </section>
  );
}
