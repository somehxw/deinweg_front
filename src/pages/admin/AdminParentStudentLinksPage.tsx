import { FormEvent, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import {
  createAdminParentStudentLink,
  deleteAdminParentStudentLink,
  getAdminParentStudentLinksList,
  updateAdminParentStudentLink
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminParentStudentLinkDto, RelationType } from "../../shared/types/admin";
import { localizeRelationType } from "../../shared/i18n/backendLabels";

export function AdminParentStudentLinksPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminParentStudentLinkDto[]>([]);
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [relationType, setRelationType] = useState<RelationType>("other");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getAdminParentStudentLinksList());
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(`${t("generalError")} (${loadError.status})`);
      } else {
        setError(t("generalError"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [t]);

  async function onCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!parentId.trim() || !studentId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createAdminParentStudentLink({
        parent: parentId.trim(),
        student: studentId.trim(),
        relation_type: relationType,
        is_primary: isPrimary
      });
      setParentId("");
      setStudentId("");
      setRelationType("other");
      setIsPrimary(false);
      setIsCreateOpen(false);
      await load();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(`${t("generalError")} (${submitError.status})`);
      } else {
        setError(t("generalError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onTogglePrimary(item: AdminParentStudentLinkDto): Promise<void> {
    try {
      await updateAdminParentStudentLink(item.id, { is_primary: !item.is_primary });
      await load();
    } catch {
      setError(t("generalError"));
    }
  }

  async function onDelete(id: string): Promise<void> {
    try {
      await deleteAdminParentStudentLink(id);
      await load();
    } catch {
      setError(t("generalError"));
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminLinksTitle")}</h2>
        <button
          type="button"
          className="icon-action-button"
          title={t("createAction")}
          aria-label={t("createAction")}
          onClick={() => setIsCreateOpen(true)}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      {isCreateOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsCreateOpen(false)}>
          <form className="modal-card" onSubmit={onCreate} onClick={(event) => event.stopPropagation()}>
            <h3 className="section-heading">{t("adminLinksTitle")}</h3>
            <div className="form-grid">
              <div className="form-row">
                <label className="field">
                  <span>{t("tableParentId")}</span>
                  <input value={parentId} onChange={(event) => setParentId(event.target.value)} required />
                </label>
                <label className="field">
                  <span>{t("tableStudentId")}</span>
                  <input value={studentId} onChange={(event) => setStudentId(event.target.value)} required />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>{t("tableRelationType")}</span>
                  <select
                    value={relationType}
                    onChange={(event) => setRelationType(event.target.value as RelationType)}
                  >
                    <option value="mother">mother</option>
                    <option value="father">father</option>
                    <option value="guardian">guardian</option>
                    <option value="other">other</option>
                  </select>
                </label>
                <label className="field">
                  <span>{t("tablePrimary")}</span>
                  <select
                    value={isPrimary ? "1" : "0"}
                    onChange={(event) => setIsPrimary(event.target.value === "1")}
                  >
                    <option value="1">{t("yesValue")}</option>
                    <option value="0">{t("noValue")}</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="actions">
              <button type="button" className="button secondary" onClick={() => setIsCreateOpen(false)}>
                {t("formBack")}
              </button>
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("formSubmitting") : t("createAction")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("tableParentId")}</th>
                <th>{t("tableStudentId")}</th>
                <th>{t("tableRelationType")}</th>
                <th>{t("tablePrimary")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.parent}</td>
                  <td>{item.student}</td>
                  <td>{localizeRelationType(item.relation_type, t)}</td>
                  <td>{item.is_primary ? t("yesValue") : t("noValue")}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        className="icon-action-button"
                        onClick={() => void onTogglePrimary(item)}
                        title={t("toggleAction")}
                        aria-label={t("toggleAction")}
                      >
                        <FiRefreshCw aria-hidden="true" />
                      </button>
                      <button
                        className="icon-action-button danger"
                        onClick={() => void onDelete(item.id)}
                        title={t("deleteAction")}
                        aria-label={t("deleteAction")}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
