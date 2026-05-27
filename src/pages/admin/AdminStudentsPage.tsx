import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiPlusSquare } from "react-icons/fi";
import {
  assignStudentToClass,
  getAdminClassesList,
  getAdminStudentsList
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminSchoolClassDto, AdminStudentItemDto } from "../../shared/types/admin";
import { localizeStudentStatus } from "../../shared/i18n/backendLabels";

function formatCurrentClass(value: unknown): string {
  if (!value) {
    return "-";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const name = record.name;
    if (typeof name === "string" && name.trim()) {
      return name;
    }
    const id = record.id;
    if (typeof id === "string" && id.trim()) {
      return id;
    }
  }
  return "-";
}

export function AdminStudentsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminStudentItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [classes, setClasses] = useState<AdminSchoolClassDto[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState<string | null>(null);
  const [assignClassId, setAssignClassId] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().slice(0, 10));

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminStudentsList({
        search: search.trim() || undefined,
        status: statusFilter || undefined
      });
      setItems(response);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(`${t("adminStudentsLoadError")} (${loadError.status})`);
      } else {
        setError(t("adminStudentsLoadError"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [t, search, statusFilter]);

  useEffect(() => {
    async function loadClasses(): Promise<void> {
      try {
        const response = await getAdminClassesList();
        setClasses(response.filter((item) => item.active !== false));
      } catch {
        setClasses([]);
      }
    }
    void loadClasses();
  }, []);

  function openAssignModal(studentId: string): void {
    setAssignStudentId(studentId);
    setAssignClassId("");
    setAssignStartDate(new Date().toISOString().slice(0, 10));
    setIsAssignOpen(true);
  }

  function closeAssignModal(): void {
    setIsAssignOpen(false);
    setAssignStudentId(null);
  }

  async function submitAssignToClass(): Promise<void> {
    if (!assignStudentId || !assignClassId || !assignStartDate) {
      return;
    }

    setActionLoadingId(assignStudentId);
    setError(null);
    try {
      await assignStudentToClass(assignStudentId, {
        school_class: assignClassId,
        start_date: assignStartDate
      });
      closeAssignModal();
      await load();
    } catch (assignError) {
      if (assignError instanceof ApiError) {
        setError(`${t("generalError")} (${assignError.status})`);
      } else {
        setError(t("generalError"));
      }
    } finally {
      setActionLoadingId(assignStudentId);
      setActionLoadingId(null);
    }
  }

  return (
    <section className="admin-page">
      <h2 className="section-heading">{t("adminStudentsTitle")}</h2>
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
            <option value="active">{localizeStudentStatus("active", t)}</option>
            <option value="expelled">{localizeStudentStatus("expelled", t)}</option>
            <option value="withdrawn">{localizeStudentStatus("withdrawn", t)}</option>
          </select>
        </label>
      </div>

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!isLoading && !error && items.length === 0 ? <p>{t("listEmpty")}</p> : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="table-wrap compact-actions-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableStudent")}</th>
                <th>{t("tableBirthDate")}</th>
                <th>{t("tableStatus")}</th>
                <th>{t("tableClass")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="inline-link" to={`/admin/students/${row.id}`}>
                      {row.first_name} {row.last_name}
                    </Link>
                  </td>
                  <td>{row.birth_date}</td>
                  <td>{localizeStudentStatus(row.status, t)}</td>
                  <td>{formatCurrentClass(row.current_class)}</td>
                  <td className="actions-col">
                    <Link
                      className="icon-action-button"
                      to={`/admin/students/${row.id}`}
                      title={t("tooltipOpen")}
                      aria-label={t("tooltipOpen")}
                    >
                      <FiEye aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="icon-action-button"
                      title={t("tooltipAssignClass")}
                      aria-label={t("tooltipAssignClass")}
                      disabled={actionLoadingId === row.id}
                      onClick={() => openAssignModal(row.id)}
                    >
                      <FiPlusSquare aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {isAssignOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeAssignModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={t("tooltipAssignClass")}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="section-heading">{t("tooltipAssignClass")}</h3>
            <div className="form-grid">
              <label className="field">
                <span>{t("tableClass")}</span>
                <select
                  value={assignClassId}
                  onChange={(event) => setAssignClassId(event.target.value)}
                >
                  <option value="">{t("selectClassPlaceholder")}</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t("adminStudentsAssignStartDatePrompt")}</span>
                <input
                  type="date"
                  value={assignStartDate}
                  onChange={(event) => setAssignStartDate(event.target.value)}
                />
              </label>
            </div>
            <div className="actions">
              <button type="button" className="button secondary" onClick={closeAssignModal}>
                {t("formBack")}
              </button>
              <button
                type="button"
                className="button"
                disabled={!assignClassId || !assignStartDate || actionLoadingId === assignStudentId}
                onClick={() => void submitAssignToClass()}
              >
                {actionLoadingId === assignStudentId ? t("formSubmitting") : t("createAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
