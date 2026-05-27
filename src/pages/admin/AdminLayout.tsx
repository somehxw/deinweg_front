import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function AdminLayout(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="panel">
      <h1 className="headline">{t("adminPanelTitle")}</h1>
      <p className="subline">{t("adminPanelDescription")}</p>

      <nav className="admin-tabs" aria-label={t("adminTabsLabel")}>
        <NavLink to="/admin/enrollments">{t("adminTabEnrollments")}</NavLink>
        <NavLink to="/admin/students">{t("adminTabStudents")}</NavLink>
        <NavLink to="/admin/parents">{t("adminTabParents")}</NavLink>
      </nav>

      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}
