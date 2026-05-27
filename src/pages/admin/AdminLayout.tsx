import { Outlet } from "react-router-dom";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function AdminLayout(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="panel">
      <h1 className="headline">{t("adminPanelTitle")}</h1>
      <p className="subline">{t("adminPanelDescription")}</p>

      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}
