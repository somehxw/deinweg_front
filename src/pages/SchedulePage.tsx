import { useEffect, useState } from "react";
import { getParentChildren } from "../shared/api/parentApi";
import { ApiError } from "../shared/api/httpClient";
import { getUserRoleFromToken } from "../shared/auth/roles";
import { useI18n } from "../shared/i18n/I18nProvider";
import { ParentChildDto } from "../shared/types/parent";

export function SchedulePage(): JSX.Element {
  const { t } = useI18n();
  const role = getUserRoleFromToken();
  const isParent = role === "parent";

  const [children, setChildren] = useState<ParentChildDto[]>([]);
  const [isLoading, setIsLoading] = useState(isParent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isParent) {
      return;
    }

    async function loadChildren(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getParentChildren();
        setChildren(response);
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
  }, [isParent, t]);

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
    </section>
  );
}
