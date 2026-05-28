import { useEffect, useState } from "react";
import { getUserRoleFromToken, setResolvedRole, UserRole } from "../shared/auth/roles";
import { getAdminEnrollmentList, getAdminLessonsList } from "../shared/api/adminApi";
import { getParentChildren, getParentLessons } from "../shared/api/parentApi";
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
        const response = await getParentLessons({ studentId: selectedChildId });
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

      {!isResolvingRole && role === "admin" ? (
        <DashboardLessonsCalendar
          lessons={lessons}
          isLoading={isLessonsLoading}
          error={lessonsError}
          t={t}
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
