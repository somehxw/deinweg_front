import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBookOpen,
  FiCheckSquare,
  FiChevronDown,
  FiClock,
  FiClipboard,
  FiGrid,
  FiImage,
  FiLayers,
  FiLink2,
  FiMessageSquare,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers
} from "react-icons/fi";
import { getUserRoleFromToken, UserRole } from "../shared/auth/roles";
import { useI18n } from "../shared/i18n/I18nProvider";

export function AppSidebar(): JSX.Element {
  const { t } = useI18n();
  const location = useLocation();
  const [role, setRole] = useState<UserRole>(() => getUserRoleFromToken());
  const [isTeacherCabinetOpen, setIsTeacherCabinetOpen] = useState<boolean>(false);
  const [isParentCabinetOpen, setIsParentCabinetOpen] = useState<boolean>(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState<boolean>(false);
  const [isAdminRegistriesOpen, setIsAdminRegistriesOpen] = useState<boolean>(false);
  const isAdmin = role === "admin";
  const isParent = role === "parent";
  const isChild = role === "child";
  const isTeacher = role === "teacher";
  const teacherSection = new URLSearchParams(location.search).get("section");
  const parentSection = location.hash.replace("#", "");

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

  useEffect(() => {
    if (location.pathname.startsWith("/cabinet/parent")) {
      setIsParentCabinetOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/cabinet/teacher")) {
      setIsTeacherCabinetOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAdmin) {
      setIsAdminManagementOpen(true);
      setIsAdminRegistriesOpen(true);
    }
  }, [isAdmin]);

  return (
    <aside className="app-sidebar" aria-label={t("sidebarMainNavigation")}>
      <nav className="sidebar-nav">
        {isAdmin ? (
          <NavLink to="/home" className="sidebar-link" title={t("sidebarHome")}>
            <span>{t("sidebarHome")}</span>
          </NavLink>
        ) : null}

        {isParent || isChild ? (
          <NavLink to="/home" className="sidebar-link" title={t("sidebarHome")}>
            <FiBookOpen aria-hidden="true" />
            <span>{t("sidebarHome")}</span>
          </NavLink>
        ) : null}

        {isParent ? (
          <div className="sidebar-admin-group sidebar-parent-group">
            <button
              type="button"
              className={`sidebar-group-toggle${isParentCabinetOpen ? " open" : ""}`}
              onClick={() => setIsParentCabinetOpen((prev) => !prev)}
              aria-expanded={isParentCabinetOpen}
            >
              <FiUsers aria-hidden="true" />
              <span>{t("sidebarParentCabinet")}</span>
              <FiChevronDown aria-hidden="true" className="sidebar-toggle-chevron" />
            </button>
            {isParentCabinetOpen ? (
              <div className="sidebar-submenu">
                <NavLink
                  to="/cabinet/parent#attendance"
                  className={() =>
                    `sidebar-link nested sublink${parentSection === "attendance" ? " active" : ""}`
                  }
                  title={t("openAttendance")}
                >
                  <FiCheckSquare aria-hidden="true" />
                  <span>{t("openAttendance")}</span>
                </NavLink>
                <NavLink
                  to="/cabinet/parent#feedback"
                  className={() =>
                    `sidebar-link nested sublink${parentSection === "feedback" ? " active" : ""}`
                  }
                  title={t("openFeedback")}
                >
                  <FiMessageSquare aria-hidden="true" />
                  <span>{t("openFeedback")}</span>
                </NavLink>
              </div>
            ) : null}
          </div>
        ) : null}

        {isChild ? (
          <NavLink to="/cabinet/child" className="sidebar-link" title={t("sidebarStudentCabinet")}>
            <FiUsers aria-hidden="true" />
            <span>{t("sidebarStudentCabinet")}</span>
          </NavLink>
        ) : null}

        {isTeacher ? (
          <div className="sidebar-admin-group sidebar-teacher-group">
            <button
              type="button"
              className={`sidebar-group-toggle${isTeacherCabinetOpen ? " open" : ""}`}
              onClick={() => setIsTeacherCabinetOpen((prev) => !prev)}
              aria-expanded={isTeacherCabinetOpen}
            >
              <FiBookOpen aria-hidden="true" />
              <span>{t("sidebarTeacherCabinet")}</span>
              <FiChevronDown aria-hidden="true" className="sidebar-toggle-chevron" />
            </button>
            {isTeacherCabinetOpen ? (
              <div className="sidebar-submenu">
                <NavLink
                  to="/cabinet/teacher?section=schedule"
                  className={() =>
                    `sidebar-link nested sublink${teacherSection !== "feedback" && teacherSection !== "attendance" ? " active" : ""}`
                  }
                  title={t("openSchedule")}
                >
                  <FiBookOpen aria-hidden="true" />
                  <span>{t("openSchedule")}</span>
                </NavLink>
                <NavLink
                  to="/cabinet/teacher?section=feedback"
                  className={() =>
                    `sidebar-link nested sublink${teacherSection === "feedback" ? " active" : ""}`
                  }
                  title={t("openFeedback")}
                >
                  <FiClipboard aria-hidden="true" />
                  <span>{t("openFeedback")}</span>
                </NavLink>
                <NavLink
                  to="/cabinet/teacher?section=attendance"
                  className={() =>
                    `sidebar-link nested sublink${teacherSection === "attendance" ? " active" : ""}`
                  }
                  title={t("openAttendance")}
                >
                  <FiClock aria-hidden="true" />
                  <span>{t("openAttendance")}</span>
                </NavLink>
                <NavLink
                  to="/cabinet/teacher?section=profile"
                  className={() =>
                    `sidebar-link nested sublink${teacherSection === "profile" ? " active" : ""}`
                  }
                  title={t("openProfile")}
                >
                  <FiUser aria-hidden="true" />
                  <span>{t("openProfile")}</span>
                </NavLink>
              </div>
            ) : null}
          </div>
        ) : null}

        {isAdmin ? (
          <div className="sidebar-admin-group">
            <button
              type="button"
              className={`sidebar-group-toggle${isAdminManagementOpen ? " open" : ""}`}
              onClick={() => setIsAdminManagementOpen((prev) => !prev)}
              aria-expanded={isAdminManagementOpen}
            >
              <FiShield aria-hidden="true" />
              <span>{t("sidebarAdministration")}</span>
              <FiChevronDown aria-hidden="true" className="sidebar-toggle-chevron" />
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
                <NavLink
                  to="/admin/news"
                  className="sidebar-link nested sublink"
                  title={t("sidebarAdminNews")}
                >
                  <FiImage aria-hidden="true" />
                  <span>{t("sidebarAdminNews")}</span>
                </NavLink>
              </div>
            ) : null}

            <button
              type="button"
              className={`sidebar-group-toggle${isAdminRegistriesOpen ? " open" : ""}`}
              onClick={() => setIsAdminRegistriesOpen((prev) => !prev)}
              aria-expanded={isAdminRegistriesOpen}
            >
              <FiGrid aria-hidden="true" />
              <span>{t("sidebarRegistries")}</span>
              <FiChevronDown aria-hidden="true" className="sidebar-toggle-chevron" />
            </button>
            {isAdminRegistriesOpen ? (
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
            ) : null}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
