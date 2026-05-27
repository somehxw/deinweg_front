import { useI18n } from "../../shared/i18n/I18nProvider";

export function AdminUsersPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminUsersTitle")}</h2>
      </div>
      <p>{t("listEmpty")}</p>
    </section>
  );
}
