import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStudentsList } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminStudentItemDto } from "../../shared/types/admin";

export function AdminStudentsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminStudentItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminStudentsList();
        setItems(response);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${t("adminStudentsLoadError")} (${loadError.status})`);
        } else {
          setError(t("adminStudentsLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [t]);

  return (
    <section className="admin-page">
      <h2 className="section-heading">{t("adminStudentsTitle")}</h2>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!isLoading && !error && items.length === 0 ? <p>{t("listEmpty")}</p> : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableStudent")}</th>
                <th>{t("tableEmail")}</th>
                <th>{t("tableBirthDate")}</th>
                <th>{t("tableParent")}</th>
                <th>{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="inline-link" to={`/admin/students/${row.id}`}>
                      {row.first_name} {row.last_name}
                    </Link>
                  </td>
                  <td>{row.email ?? "-"}</td>
                  <td>{row.birth_date ?? "-"}</td>
                  <td>
                    {(() => {
                      const parentLabel = `${row.parent_first_name ?? ""} ${row.parent_last_name ?? ""}`.trim();
                      if (row.parent_id && parentLabel) {
                        return (
                          <Link className="inline-link" to={`/admin/parents/${row.parent_id}`}>
                            {parentLabel}
                          </Link>
                        );
                      }
                      if (parentLabel) {
                        return parentLabel;
                      }
                      if (row.parent_id) {
                        return (
                          <Link className="inline-link" to={`/admin/parents/${row.parent_id}`}>
                            {row.parent_id}
                          </Link>
                        );
                      }
                      return "-";
                    })()}
                  </td>
                  <td>
                    <Link className="button secondary" to={`/admin/students/${row.id}`}>
                      {t("viewAction")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
