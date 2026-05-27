import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminStudentProfile } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminStudentProfileDto } from "../../shared/types/admin";

export function AdminStudentProfilePage(): JSX.Element {
  const { t } = useI18n();
  const { studentId } = useParams<{ studentId: string }>();
  const [item, setItem] = useState<AdminStudentProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError(t("adminStudentIdMissing"));
      setIsLoading(false);
      return;
    }

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminStudentProfile(studentId);
        setItem(response);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${t("adminStudentLoadError")} (${loadError.status})`);
        } else {
          setError(t("adminStudentLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [studentId, t]);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminStudentProfileTitle")}</h2>
        <Link className="button secondary" to="/admin/students">
          {t("backToStudents")}
        </Link>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !error && item ? (
        <dl className="details-grid">
          <div>
            <dt>{t("fieldFullName")}</dt>
            <dd>
              {item.first_name} {item.last_name}
            </dd>
          </div>
          <div>
            <dt>{t("tableEmail")}</dt>
            <dd>{item.email ?? "-"}</dd>
          </div>
          <div>
            <dt>{t("tableBirthDate")}</dt>
            <dd>{item.birth_date ?? "-"}</dd>
          </div>
          <div>
            <dt>{t("tableParent")}</dt>
            <dd>
              {item.parent ? (
                <Link className="inline-link" to={`/admin/parents/${item.parent.id}`}>
                  {`${item.parent.first_name} ${item.parent.last_name}`.trim() || item.parent.id}
                </Link>
              ) : (
                "-"
              )}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
