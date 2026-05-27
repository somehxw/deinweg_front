import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers } from "react-icons/fi";
import { getAdminParentsList } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminParentItemDto } from "../../shared/types/admin";
import { localizeLocale } from "../../shared/i18n/backendLabels";

export function AdminParentsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminParentItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminParentsList({
          search: search.trim() || undefined
        });
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
  }, [t, search]);

  return (
    <section className="admin-page">
      <h2 className="section-heading">{t("adminParentsTitle")}</h2>
      <div className="row">
        <label className="field admin-filter-field">
          <span>{t("searchLabel")}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </label>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!isLoading && !error && items.length === 0 ? <p>{t("listEmpty")}</p> : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="table-wrap compact-actions-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableParent")}</th>
                <th>{t("tableEmail")}</th>
                <th>{t("tablePhone")}</th>
                <th>{t("tableLocale")}</th>
                <th className="actions-col">{t("tableActions")}</th>
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
                  <td>{row.user_email}</td>
                  <td>{row.phone}</td>
                  <td>{localizeLocale(row.preferred_locale, t)}</td>
                  <td className="actions-col">
                    <Link
                      className="icon-action-button"
                      to={`/admin/parents/${row.id}`}
                      title={t("tooltipOpenChildren")}
                      aria-label={t("tooltipOpenChildren")}
                    >
                      <FiUsers aria-hidden="true" />
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
