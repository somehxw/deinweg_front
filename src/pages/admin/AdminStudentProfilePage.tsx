import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminStudentProfile } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminStudentProfileDto } from "../../shared/types/admin";
import { localizeStudentStatus } from "../../shared/i18n/backendLabels";

function formatCurrentClass(value: unknown): string {
  if (!value) {
    return "-";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const name = record.name;
    if (typeof name === "string" && name.trim()) {
      return name;
    }
    const id = record.id;
    if (typeof id === "string" && id.trim()) {
      return id;
    }
  }
  return "-";
}

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
    const id = studentId;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminStudentProfile(id);
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
            <dt>{t("tableStatus")}</dt>
            <dd>{localizeStudentStatus(item.status, t)}</dd>
          </div>
          <div>
            <dt>{t("tableBirthDate")}</dt>
            <dd>{item.birth_date}</dd>
          </div>
          <div>
            <dt>{t("tableClass")}</dt>
            <dd>
              {formatCurrentClass(item.current_class)}
            </dd>
          </div>
          <div>
            <dt>{t("tableParentLinks")}</dt>
            <dd>
              {item.parent_links.length > 0 ? (
                item.parent_links.map((linkItem) => linkItem.parent).join(", ")
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
