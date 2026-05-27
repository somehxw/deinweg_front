import { useEffect, useState } from "react";
import { FiCheck, FiCornerUpLeft, FiX } from "react-icons/fi";
import {
  approveEnrollmentRequest,
  getAdminEnrollmentList,
  rejectEnrollmentRequest,
  requestEnrollmentRelink
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { localizeEnrollmentStatus } from "../../shared/i18n/backendLabels";
import { AdminEnrollmentItemDto } from "../../shared/types/admin";
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

  async function loadEnrollments(): Promise<void> {
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
  }

  useEffect(() => {
    void loadEnrollments();
  }, [t, search, statusFilter]);

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
      <h2 className="section-heading">{t("adminEnrollmentsTitle")}</h2>
      <p className="subline">{t("adminEnrollmentsDescription")}</p>
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
