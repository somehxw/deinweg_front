import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminParentProfile } from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminParentProfileDto } from "../../shared/types/admin";
import { localizeLocale } from "../../shared/i18n/backendLabels";

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
    const id = parentId;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAdminParentProfile(id);
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
        <dl className="details-grid">
          <div>
            <dt>{t("fieldFullName")}</dt>
            <dd>
              {item.first_name} {item.last_name}
            </dd>
          </div>
          <div>
            <dt>{t("tableEmail")}</dt>
            <dd>{item.user_email}</dd>
          </div>
          <div>
            <dt>{t("tablePhone")}</dt>
            <dd>{item.phone}</dd>
          </div>
          <div>
            <dt>{t("tableLocale")}</dt>
            <dd>{localizeLocale(item.preferred_locale, t)}</dd>
          </div>
          <div>
            <dt>{t("tableSubscribed")}</dt>
            <dd>{item.email_subscribed ? t("yesValue") : t("noValue")}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{item.id}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
