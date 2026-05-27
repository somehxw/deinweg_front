import { useEffect, useState } from "react";
import { getUserRoleFromToken, setResolvedRole, UserRole } from "../shared/auth/roles";
import { getAdminEnrollmentList, getAdminLessonsList } from "../shared/api/adminApi";
import { getParentChildren } from "../shared/api/parentApi";
import { useI18n } from "../shared/i18n/I18nProvider";
import { Link } from "react-router-dom";
import { ApiError } from "../shared/api/httpClient";
import { AdminLessonDto } from "../shared/types/admin";
import { DashboardLessonsCalendar } from "../features/dashboard/components/DashboardLessonsCalendar";

export function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const tokenRole = getUserRoleFromToken();
  const [role, setRole] = useState<UserRole>(tokenRole);
  const [isResolvingRole, setIsResolvingRole] = useState(tokenRole === "unknown");
  const [lessons, setLessons] = useState<AdminLessonDto[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isResolvingRole || role !== "admin") {
      setLessons([]);
      setLessonsError(null);
      setIsLessonsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadLessons(): Promise<void> {
      setIsLessonsLoading(true);
      setLessonsError(null);
      try {
        const response = await getAdminLessonsList();
        if (!cancelled) {
          setLessons(response);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setLessonsError(`${t("generalError")} (${error.status})`);
          } else {
            setLessonsError(t("generalError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLessonsLoading(false);
        }
      }
    }

    void loadLessons();
    return () => {
      cancelled = true;
    };
  }, [isResolvingRole, role, t]);

  return (
    <section className="panel">
      <h1 className="headline">{t("dashboardTitle")}</h1>
      <p className="subline">{t("dashboardDescription")}</p>
      {isResolvingRole ? <p>{t("listLoading")}</p> : null}
      <div className="row">
        {!isResolvingRole && role === "admin" ? (
          null
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

      {!isResolvingRole && role === "admin" ? (
        <DashboardLessonsCalendar
          lessons={lessons}
          isLoading={isLessonsLoading}
          error={lessonsError}
          t={t}
        />
      ) : null}
    </section>
  );
}
