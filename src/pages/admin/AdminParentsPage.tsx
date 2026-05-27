import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminParentsList } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminParentItemDto } from "../../shared/types/admin";

export function AdminParentsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminParentItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminParentsList();
        setItems(response);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${t("adminParentsLoadError")} (${loadError.status})`);
        } else {
          setError(t("adminParentsLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [t]);

  return (
    <section className="admin-page">
      <h2 className="section-heading">{t("adminParentsTitle")}</h2>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!isLoading && !error && items.length === 0 ? <p>{t("listEmpty")}</p> : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableParent")}</th>
                <th>{t("tableEmail")}</th>
                <th>{t("tablePhone")}</th>
                <th>{t("tableChildrenCount")}</th>
                <th>{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="inline-link" to={`/admin/parents/${row.id}`}>
                      {row.first_name} {row.last_name}
                    </Link>
                  </td>
                  <td>{row.email ?? "-"}</td>
                  <td>{row.phone ?? "-"}</td>
                  <td>{row.children_count}</td>
                  <td>
                    <Link className="button secondary" to={`/admin/parents/${row.id}`}>
                      {t("viewChildrenAction")}
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
