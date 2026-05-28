import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiClock,
  FiClipboard,
  FiGrid,
  FiHome,
  FiLink2,
  FiLayers,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";
import { getUserRoleFromToken, UserRole } from "../shared/auth/roles";
import { useI18n } from "../shared/i18n/I18nProvider";

export function AppSidebar(): JSX.Element {
  const { t } = useI18n();
  const [role, setRole] = useState<UserRole>(() => getUserRoleFromToken());
  const isAdmin = role === "admin";
  const isChild = role === "child";

  useEffect(() => {
    function syncRole(): void {
      setRole(getUserRoleFromToken());
    }

    syncRole();
    window.addEventListener("deinweg:role-changed", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("deinweg:role-changed", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  return (
    <aside className="app-sidebar" aria-label={t("sidebarMainNavigation")}>
      <nav className="sidebar-nav">
        <NavLink to="/home" className="sidebar-link" title={t("sidebarHome")}>
          <FiHome aria-hidden="true" />
          <span>{t("sidebarHome")}</span>
        </NavLink>

        {isChild ? (
          <NavLink to="/cabinet/child" className="sidebar-link" title={t("sidebarStudentCabinet")}>
            <FiUsers aria-hidden="true" />
            <span>{t("sidebarStudentCabinet")}</span>
          </NavLink>
        ) : null}

        {isAdmin ? (
          <div className="sidebar-admin-group">
            <div className="sidebar-group-title">
              <FiShield aria-hidden="true" />
              <span>{t("sidebarAdministration")}</span>
            </div>
            <div className="sidebar-submenu">
              <NavLink
                to="/admin/enrollments"
                className="sidebar-link nested sublink"
                title={t("adminTabEnrollments")}
              >
                <FiClipboard aria-hidden="true" />
                <span>{t("adminTabEnrollments")}</span>
              </NavLink>
              <NavLink
                to="/admin/classes"
                className="sidebar-link nested sublink"
                title={t("adminClassesTitle")}
              >
                <FiLayers aria-hidden="true" />
                <span>{t("adminClassesTitle")}</span>
              </NavLink>
              <NavLink
                to="/admin/lessons"
                className="sidebar-link nested sublink"
                title={t("adminLessonsTitle")}
              >
                <FiClock aria-hidden="true" />
                <span>{t("adminLessonsTitle")}</span>
              </NavLink>
              <NavLink
                to="/admin/parent-student-links"
                className="sidebar-link nested sublink"
                title={t("adminLinksTitle")}
              >
                <FiLink2 aria-hidden="true" />
                <span>{t("adminLinksTitle")}</span>
              </NavLink>
            </div>

            <div className="sidebar-group-title">
              <FiGrid aria-hidden="true" />
              <span>{t("sidebarRegistries")}</span>
            </div>
            <div className="sidebar-submenu">
              <NavLink
                to="/admin/users"
                className="sidebar-link nested sublink"
                title={t("sidebarRegistryUsers")}
              >
                <FiUser aria-hidden="true" />
                <span>{t("sidebarRegistryUsers")}</span>
              </NavLink>
              <NavLink
                to="/admin/students"
                className="sidebar-link nested sublink"
                title={t("sidebarRegistryStudents")}
              >
                <FiUserCheck aria-hidden="true" />
                <span>{t("sidebarRegistryStudents")}</span>
              </NavLink>
              <NavLink
                to="/admin/parents"
                className="sidebar-link nested sublink"
                title={t("sidebarRegistryParents")}
              >
                <FiUsers aria-hidden="true" />
                <span>{t("sidebarRegistryParents")}</span>
              </NavLink>
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
