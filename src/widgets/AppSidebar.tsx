import { NavLink, useLocation } from "react-router-dom";
import {
  FiBookOpen,
  FiChevronDown,
  FiClock,
  FiClipboard,
  FiGrid,
  FiHome,
  FiLink2,
  FiLayers,
  FiShield,
  FiUsers
} from "react-icons/fi";
import { getUserRoleFromToken } from "../shared/auth/roles";
import { useI18n } from "../shared/i18n/I18nProvider";
import { useState } from "react";

export function AppSidebar(): JSX.Element {
  const { t } = useI18n();
  const location = useLocation();
  const role = getUserRoleFromToken();
  const isAdmin = role === "admin";
  const isParent = role === "parent";
  const isChild = role === "child";
  const adminRegistriesOpen = location.pathname.startsWith("/admin/students")
    || location.pathname.startsWith("/admin/parents")
    || location.pathname.startsWith("/admin/users");
  const adminManagementOpenByPath = location.pathname.startsWith("/admin/enrollments");
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(adminManagementOpenByPath);
  const [isRegistriesOpen, setIsRegistriesOpen] = useState(adminRegistriesOpen);

  return (
    <aside className="app-sidebar" aria-label={t("sidebarMainNavigation")}>
      <nav className="sidebar-nav">
        <NavLink to="/home" className="sidebar-link" title={t("sidebarHome")}>
          <FiHome aria-hidden="true" />
          <span>{t("sidebarHome")}</span>
        </NavLink>

        {(isParent || isChild) ? (
          <NavLink to="/schedule" className="sidebar-link" title={t("sidebarSchedule")}>
            <FiBookOpen aria-hidden="true" />
            <span>{t("sidebarSchedule")}</span>
          </NavLink>
        ) : null}

        {isParent ? (
          <NavLink to="/cabinet/parent" className="sidebar-link" title={t("sidebarParentCabinet")}>
            <FiUsers aria-hidden="true" />
            <span>{t("sidebarParentCabinet")}</span>
          </NavLink>
        ) : null}

        {isChild ? (
          <NavLink to="/cabinet/child" className="sidebar-link" title={t("sidebarStudentCabinet")}>
            <FiUsers aria-hidden="true" />
            <span>{t("sidebarStudentCabinet")}</span>
          </NavLink>
        ) : null}

        {isAdmin ? (
          <div className="sidebar-admin-group">
            <button
              type="button"
              className={`sidebar-group-toggle${isAdminManagementOpen ? " open" : ""}`}
              onClick={() => setIsAdminManagementOpen((current) => !current)}
              title={t("sidebarAdministration")}
            >
              <FiShield aria-hidden="true" />
              <span>{t("sidebarAdministration")}</span>
              <FiChevronDown className="sidebar-toggle-chevron" aria-hidden="true" />
            </button>
            {isAdminManagementOpen ? (
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
            ) : null}

            <button
              type="button"
              className={`sidebar-group-toggle${isRegistriesOpen ? " open" : ""}`}
              onClick={() => setIsRegistriesOpen((current) => !current)}
              title={t("sidebarRegistries")}
            >
              <FiGrid aria-hidden="true" />
              <span>{t("sidebarRegistries")}</span>
              <FiChevronDown className="sidebar-toggle-chevron" aria-hidden="true" />
            </button>
            {isRegistriesOpen ? (
              <div className={`sidebar-submenu${adminRegistriesOpen ? " open" : ""}`}>
                <NavLink
                  to="/admin/users"
                  className="sidebar-link nested sublink"
                  title={t("sidebarRegistryUsers")}
                >
                  <span>{t("sidebarRegistryUsers")}</span>
                </NavLink>
                <NavLink
                  to="/admin/students"
                  className="sidebar-link nested sublink"
                  title={t("sidebarRegistryStudents")}
                >
                  <span>{t("sidebarRegistryStudents")}</span>
                </NavLink>
                <NavLink
                  to="/admin/parents"
                  className="sidebar-link nested sublink"
                  title={t("sidebarRegistryParents")}
                >
                  <span>{t("sidebarRegistryParents")}</span>
                </NavLink>
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
