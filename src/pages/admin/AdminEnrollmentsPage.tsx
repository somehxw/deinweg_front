import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiCornerUpLeft, FiX } from "react-icons/fi";
import {
  approveEnrollmentRequest,
  getAdminEnrollmentList,
  rejectEnrollmentRequest,
  requestEnrollmentRelink
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { getAccessToken } from "../../shared/auth/tokenStorage";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { localizeEnrollmentStatus } from "../../shared/i18n/backendLabels";
import { useEnrollmentWebSocket } from "../../shared/realtime/useEnrollmentWebSocket";
import { AdminEnrollmentItemDto } from "../../shared/types/admin";
import { EnrollmentCreatedEventData } from "../../shared/types/enrollmentRealtime";
import { EnrollmentRequestStatus } from "../../shared/types/enrollment";

const ACTIVE_STATUSES: EnrollmentRequestStatus[] = [
  "waiting",
  "setw",
  "pending",
  "needs_relink"
];

export function AdminEnrollmentsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminEnrollmentItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const loadEnrollments = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminEnrollmentList({
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      setItems(response);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(`${t("adminEnrollmentsLoadError")} (${loadError.status})`);
      } else {
        setError(t("adminEnrollmentsLoadError"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, t]);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    const tokenWatcherId = window.setInterval(() => {
      const nextToken = getAccessToken();
      setAccessToken((currentToken) => (currentToken === nextToken ? currentToken : nextToken));
    }, 1000);

    return () => {
      window.clearInterval(tokenWatcherId);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (!notificationsRef.current) {
        return;
      }

      const clickTarget = event.target;
      if (clickTarget instanceof Node && !notificationsRef.current.contains(clickTarget)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleNotifications = useCallback((): void => {
    setIsNotificationsOpen((current) => {
      const next = !current;
      if (next) {
        setUnreadCount(0);
      }
      return next;
    });
  }, []);

  const onEnrollmentCreated = useCallback(
    (createdItem: EnrollmentCreatedEventData): void => {
      const parentFullName = `${createdItem.parent_first_name} ${createdItem.parent_last_name}`.trim();
      const nextNotification = parentFullName
        ? `${t("adminNotificationNewEnrollmentFrom")} ${parentFullName}`
        : t("adminNotificationNewEnrollment");
      setNotifications((current) => [nextNotification, ...current].slice(0, 10));
      setUnreadCount((current) => current + 1);
      void loadEnrollments();
    },
    [loadEnrollments, t]
  );

  useEnrollmentWebSocket(accessToken, onEnrollmentCreated);

  async function runModerationAction(
    id: string,
    action: "approve" | "reject" | "relink"
  ): Promise<void> {
    setActionError(null);
    setActionLoadingId(id);
    try {
      if (action === "approve") {
        await approveEnrollmentRequest(id);
      } else if (action === "reject") {
        await rejectEnrollmentRequest(id);
      } else {
        await requestEnrollmentRelink(id);
      }
      await loadEnrollments();
    } catch (moderationError) {
      if (moderationError instanceof ApiError) {
        setActionError(`${t("adminEnrollmentsActionError")} (${moderationError.status})`);
      } else {
        setActionError(t("adminEnrollmentsActionError"));
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  const actionableStatuses = new Set<EnrollmentRequestStatus>(ACTIVE_STATUSES);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="section-heading">{t("adminEnrollmentsTitle")}</h2>
          <p className="subline">{t("adminEnrollmentsDescription")}</p>
        </div>
        <div className="admin-notifications" ref={notificationsRef}>
          <button
            type="button"
            className="icon-action-button admin-notifications-toggle"
            aria-label={t("adminNotificationsLabel")}
            title={t("adminNotificationsLabel")}
            onClick={toggleNotifications}
          >
            <FiBell aria-hidden="true" />
            {unreadCount > 0 ? <span className="admin-notifications-badge">{Math.min(unreadCount, 99)}</span> : null}
          </button>
          {isNotificationsOpen ? (
            <div className="admin-notifications-menu" role="dialog" aria-label={t("adminNotificationsTitle")}>
              <p className="admin-notifications-title">{t("adminNotificationsTitle")}</p>
              {notifications.length === 0 ? (
                <p className="admin-notifications-empty">{t("adminNotificationsEmpty")}</p>
              ) : (
                <ul className="admin-notifications-list">
                  {notifications.map((item, index) => (
                    <li key={`${index}-${item}`} className="admin-notifications-item">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="row">
        <label className="field admin-filter-field">
          <span>{t("searchLabel")}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </label>
        <label className="field admin-filter-field">
          <span>{t("tableStatus")}</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">{t("filterAll")}</option>
            <option value="pending">{localizeEnrollmentStatus("pending", t)}</option>
            <option value="approved">{localizeEnrollmentStatus("approved", t)}</option>
            <option value="rejected">{localizeEnrollmentStatus("rejected", t)}</option>
            <option value="needs_relink">{localizeEnrollmentStatus("needs_relink", t)}</option>
          </select>
        </label>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {actionError ? <p className="error-text">{actionError}</p> : null}
      {!isLoading && !error && items.length === 0 ? <p>{t("listEmpty")}</p> : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableCreatedAt")}</th>
                <th>{t("tableParent")}</th>
                <th>{t("tableChild")}</th>
                <th>{t("tableStatus")}</th>
                <th>{t("tableUpdatedAt")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const canModerate = actionableStatuses.has(row.status);
                return (
                <tr key={row.id}>
                  <td>{row.created_at}</td>
                  <td>
                    {row.parent_first_name} {row.parent_last_name}
                    <div className="child-meta">{row.parent_email}</div>
                  </td>
                  <td>
                    {row.student_first_name} {row.student_last_name}
                  </td>
                  <td>{localizeEnrollmentStatus(row.status, t)}</td>
                  <td>{row.updated_at}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-action-button success"
                        title={t("tooltipApprove")}
                        aria-label={t("tooltipApprove")}
                        disabled={actionLoadingId === row.id || !canModerate}
                        onClick={() => void runModerationAction(row.id, "approve")}
                      >
                        <FiCheck aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button danger"
                        title={t("tooltipReject")}
                        aria-label={t("tooltipReject")}
                        disabled={actionLoadingId === row.id || !canModerate}
                        onClick={() => void runModerationAction(row.id, "reject")}
                      >
                        <FiX aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button"
                        title={t("tooltipRequestRelink")}
                        aria-label={t("tooltipRequestRelink")}
                        disabled={actionLoadingId === row.id || !canModerate}
                        onClick={() => void runModerationAction(row.id, "relink")}
                      >
                        <FiCornerUpLeft aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
