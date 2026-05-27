import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminParentProfile } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminParentProfileDto } from "../../shared/types/admin";

export function AdminParentProfilePage(): JSX.Element {
  const { t } = useI18n();
  const { parentId } = useParams<{ parentId: string }>();
  const [item, setItem] = useState<AdminParentProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parentId) {
      setError(t("adminParentIdMissing"));
      setIsLoading(false);
      return;
    }

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminParentProfile(parentId);
        setItem(response);
      } catch (loadError) {
        if (loadError instanceof ApiError) {
          setError(`${t("adminParentLoadError")} (${loadError.status})`);
        } else {
          setError(t("adminParentLoadError"));
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [parentId, t]);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminParentProfileTitle")}</h2>
        <Link className="button secondary" to="/admin/parents">
          {t("backToParents")}
        </Link>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && !error && item ? (
        <>
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
              <dt>{t("tablePhone")}</dt>
              <dd>{item.phone ?? "-"}</dd>
            </div>
            <div>
              <dt>{t("tableChildrenCount")}</dt>
              <dd>{item.children.length}</dd>
            </div>
          </dl>

          <h3 className="section-heading">{t("parentChildrenTitle")}</h3>
          {item.children.length === 0 ? <p>{t("childrenListEmpty")}</p> : null}

          {item.children.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("tableStudent")}</th>
                    <th>{t("tableEmail")}</th>
                    <th>{t("tableBirthDate")}</th>
                    <th>{t("tableActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.children.map((child) => (
                    <tr key={child.id}>
                      <td>
                        <Link className="inline-link" to={`/admin/students/${child.id}`}>
                          {child.first_name} {child.last_name}
                        </Link>
                      </td>
                      <td>{child.email ?? "-"}</td>
                      <td>{child.birth_date ?? "-"}</td>
                      <td>
                        <Link className="button secondary" to={`/admin/students/${child.id}`}>
                          {t("viewAction")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
