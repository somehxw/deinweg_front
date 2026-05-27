import { useEffect, useState } from "react";
import { getUserRoleFromToken, setResolvedRole, UserRole } from "../shared/auth/roles";
import { getAdminEnrollmentList } from "../shared/api/adminApi";
import { getParentChildren } from "../shared/api/parentApi";
import { useI18n } from "../shared/i18n/I18nProvider";
import { Link } from "react-router-dom";

export function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const tokenRole = getUserRoleFromToken();
  const [role, setRole] = useState<UserRole>(tokenRole);
  const [isResolvingRole, setIsResolvingRole] = useState(tokenRole === "unknown");

  useEffect(() => {
    let cancelled = false;

    async function resolveRoleByPermissions(): Promise<void> {
      setIsResolvingRole(true);
      setRole(tokenRole);

      // Always probe admin permission first in case token role claims are incomplete.
      try {
        await getAdminEnrollmentList();
        if (!cancelled) {
          setRole("admin");
          setResolvedRole("admin");
          setIsResolvingRole(false);
        }
        return;
      } catch {
        // continue
      }

      if (tokenRole === "parent" || tokenRole === "child") {
        if (!cancelled) {
          setResolvedRole(tokenRole);
          setIsResolvingRole(false);
        }
        return;
      }

      if (tokenRole === "admin") {
        if (!cancelled) {
          setResolvedRole("admin");
          setIsResolvingRole(false);
        }
        return;
      }

      try {
        await getParentChildren();
        if (!cancelled) {
          setRole("parent");
          setResolvedRole("parent");
          setIsResolvingRole(false);
        }
        return;
      } catch {
        // continue
      }

      if (!cancelled) {
        setRole("child");
        setResolvedRole("child");
        setIsResolvingRole(false);
      }
    }

    void resolveRoleByPermissions();
    return () => {
      cancelled = true;
    };
  }, [tokenRole]);

  return (
    <section className="panel">
      <h1 className="headline">{t("dashboardTitle")}</h1>
      <p className="subline">{t("dashboardDescription")}</p>
      {isResolvingRole ? <p>{t("listLoading")}</p> : null}
      <div className="row">
        {!isResolvingRole && role === "admin" ? (
          <Link className="button secondary" to="/admin/enrollments">
            {t("adminTabEnrollments")}
          </Link>
        ) : !isResolvingRole && role === "parent" ? (
          <>
            <Link className="button secondary" to="/cabinet/parent#schedule">
              {t("openSchedule")}
            </Link>
            <Link className="button secondary" to="/cabinet/parent#grades">
              {t("openGrades")}
            </Link>
            <Link className="button secondary" to="/cabinet/parent#feedback">
              {t("openFeedback")}
            </Link>
          </>
        ) : !isResolvingRole && role === "child" ? (
          <>
            <Link className="button secondary" to="/cabinet/child#schedule">
              {t("openSchedule")}
            </Link>
            <Link className="button secondary" to="/cabinet/child#grades">
              {t("openGrades")}
            </Link>
          </>
        ) : !isResolvingRole ? (
          <Link className="button secondary" to="/schedule">
            {t("scheduleTitle")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
