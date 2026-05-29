import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserRoleFromToken, setResolvedRole, UserRole } from "../shared/auth/roles";
import { getAdminEnrollmentList, getAdminLessonsList } from "../shared/api/adminApi";
import { getParentChildren, getParentLessons } from "../shared/api/parentApi";
import { getTeacherMeProfile } from "../shared/api/teacherApi";
import { useI18n } from "../shared/i18n/I18nProvider";
import { ApiError } from "../shared/api/httpClient";
import { AdminLessonDto } from "../shared/types/admin";
import { DashboardLessonsCalendar } from "../features/dashboard/components/DashboardLessonsCalendar";
import { ParentChildDto, ParentLessonDto } from "../shared/types/parent";
import { ParentDashboardLessonsCalendar } from "../features/dashboard/components/ParentDashboardLessonsCalendar";

export function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const tokenRole = getUserRoleFromToken();
  const [role, setRole] = useState<UserRole>(tokenRole);
  const [isResolvingRole, setIsResolvingRole] = useState(tokenRole === "unknown");
  const [lessons, setLessons] = useState<AdminLessonDto[]>([]);
  const [isLessonsLoading, setIsLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [parentChildren, setParentChildren] = useState<ParentChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [parentLessons, setParentLessons] = useState<ParentLessonDto[]>([]);
  const [isParentChildrenLoading, setIsParentChildrenLoading] = useState(false);
  const [isParentLessonsLoading, setIsParentLessonsLoading] = useState(false);
  const [parentLessonsError, setParentLessonsError] = useState<string | null>(null);

  const loadAdminLessons = useCallback(async (): Promise<void> => {
    setIsLessonsLoading(true);
    setLessonsError(null);
    try {
      const response = await getAdminLessonsList();
      setLessons(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setLessonsError(`${t("generalError")} (${error.status})`);
      } else {
        setLessonsError(t("generalError"));
      }
    } finally {
      setIsLessonsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    async function resolveRoleByPermissions(): Promise<void> {
      setIsResolvingRole(true);
      setRole(tokenRole);

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

      try {
        await getTeacherMeProfile();
        if (!cancelled) {
          setRole("teacher");
          setResolvedRole("teacher");
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

    void loadAdminLessons();
  }, [isResolvingRole, loadAdminLessons, role]);

  useEffect(() => {
    if (isResolvingRole || role !== "parent") {
      setParentChildren([]);
      setSelectedChildId(null);
      setParentLessons([]);
      setIsParentChildrenLoading(false);
      setIsParentLessonsLoading(false);
      setParentLessonsError(null);
      return;
    }

    let cancelled = false;

    async function loadParentChildren(): Promise<void> {
      setIsParentChildrenLoading(true);
      setParentLessonsError(null);
      try {
        const response = await getParentChildren();
        if (!cancelled) {
          setParentChildren(response);
          setSelectedChildId(response[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setParentLessonsError(`${t("scheduleChildrenLoadError")} (${error.status})`);
          } else {
            setParentLessonsError(t("scheduleChildrenLoadError"));
          }
        }
      } finally {
        if (!cancelled) {
          setIsParentChildrenLoading(false);
        }
      }
    }

    void loadParentChildren();
    return () => {
      cancelled = true;
    };
  }, [isResolvingRole, role, t]);

  useEffect(() => {
    if (isResolvingRole || role !== "parent" || !selectedChildId) {
      setParentLessons([]);
      setIsParentLessonsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadChildLessons(): Promise<void> {
      setIsParentLessonsLoading(true);
      setParentLessonsError(null);
      try {
        const response = await getParentLessons({ studentId: selectedChildId ?? undefined });
        if (!cancelled) {
          setParentLessons(response);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setParentLessonsError(`${t("generalError")} (${error.status})`);
          } else {
            setParentLessonsError(t("generalError"));
          }
          setParentLessons([]);
        }
      } finally {
        if (!cancelled) {
          setIsParentLessonsLoading(false);
        }
      }
    }

    void loadChildLessons();
    return () => {
      cancelled = true;
    };
  }, [isResolvingRole, role, selectedChildId, t]);

  return (
    <section className="panel">
      <h1 className="headline">{t("dashboardTitle")}</h1>
      <p className="subline">{t("dashboardDescription")}</p>
      {isResolvingRole ? <p>{t("listLoading")}</p> : null}

      <div className="row">
        {!isResolvingRole && role === "admin" ? null : !isResolvingRole && role === "parent" ? (
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
        ) : !isResolvingRole && role === "teacher" ? (
          <>
            <Link className="button secondary" to="/cabinet/teacher">
              {t("openCabinet")}
            </Link>
            <Link className="button secondary" to="/schedule">
              {t("openSchedule")}
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
          onLessonsChanged={loadAdminLessons}
        />
      ) : null}

      {!isResolvingRole && role === "parent" ? (
        <ParentDashboardLessonsCalendar
          children={parentChildren}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
          lessons={parentLessons}
          isChildrenLoading={isParentChildrenLoading}
          isLessonsLoading={isParentLessonsLoading}
          error={parentLessonsError}
          t={t}
        />
      ) : null}
    </section>
  );
}
