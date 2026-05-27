import { FormEvent, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import {
  createAdminClass,
  getAdminClassesList,
  updateAdminClass
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminSchoolClassDto } from "../../shared/types/admin";

export function AdminClassesPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminSchoolClassDto[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getAdminClassesList());
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
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createAdminClass({ name: name.trim(), description: description.trim() || undefined, active });
      setName("");
      setDescription("");
      setActive(true);
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

  async function onToggleClass(item: AdminSchoolClassDto): Promise<void> {
    try {
      await updateAdminClass(item.id, { active: !item.active });
      await load();
    } catch {
      setError(t("generalError"));
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminClassesTitle")}</h2>
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
            <h3 className="section-heading">{t("adminClassesTitle")}</h3>
            <div className="form-grid">
              <div className="form-row">
                <label className="field">
                  <span>{t("tableClass")}</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label className="field">
                  <span>{t("tableComment")}</span>
                  <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>{t("tableStatus")}</span>
                <select
                  value={active ? "1" : "0"}
                  onChange={(event) => setActive(event.target.value === "1")}
                >
                  <option value="1">{t("activeValue")}</option>
                  <option value="0">{t("inactiveValue")}</option>
                </select>
              </label>
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
                <th>{t("tableClass")}</th>
                <th>{t("tableComment")}</th>
                <th>{t("tableStatus")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.description ?? "-"}</td>
                  <td>{item.active ? t("activeValue") : t("inactiveValue")}</td>
                  <td className="actions-col">
                    <button
                      className="icon-action-button"
                      onClick={() => void onToggleClass(item)}
                      title={t("toggleAction")}
                      aria-label={t("toggleAction")}
                    >
                      <FiRefreshCw aria-hidden="true" />
                    </button>
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
