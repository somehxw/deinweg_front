import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiImage, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { createNews, deleteNews, deleteNewsImage, getNewsList, updateNews } from "../../shared/api/newsApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { NewsItemDto } from "../../shared/types/news";

interface NewsFormValues {
  title: string;
  text: string;
  imageFiles: File[];
}

const DEFAULT_FORM: NewsFormValues = {
  title: "",
  text: "",
  imageFiles: []
};

export function AdminNewsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<NewsItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItemDto | null>(null);
  const [values, setValues] = useState<NewsFormValues>(DEFAULT_FORM);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionNewsId, setActionNewsId] = useState<string | null>(null);
  const [actionImageId, setActionImageId] = useState<string | null>(null);

  const isEditMode = editingItem !== null;

  const modalTitle = useMemo(
    () => (isEditMode ? t("adminNewsEditTitle") : t("adminNewsCreateTitle")),
    [isEditMode, t]
  );

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getNewsList());
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

  function openCreateModal(): void {
    setEditingItem(null);
    setValues(DEFAULT_FORM);
    setError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: NewsItemDto): void {
    setEditingItem(item);
    setValues({
      title: item.title,
      text: item.text,
      imageFiles: []
    });
    setError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    if (isSubmitting) return;
    setIsModalOpen(false);
  }

  function onFilesChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextFiles = Array.from(event.target.files ?? []);
    setValues((current) => ({ ...current, imageFiles: nextFiles }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!values.title.trim() || !values.text.trim()) {
      setError(t("formValidationRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditMode && editingItem) {
        await updateNews(editingItem.id, {
          title: values.title.trim(),
          text: values.text.trim(),
          imageFiles: values.imageFiles
        });
        setSuccessMessage(t("adminNewsUpdateSuccess"));
      } else {
        await createNews({
          title: values.title.trim(),
          text: values.text.trim(),
          imageFiles: values.imageFiles
        });
        setSuccessMessage(t("adminNewsCreateSuccess"));
      }

      setIsModalOpen(false);
      setValues(DEFAULT_FORM);
      setEditingItem(null);
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

  async function onDeleteNews(newsId: string): Promise<void> {
    if (!window.confirm(t("adminNewsDeleteConfirm"))) {
      return;
    }

    setActionNewsId(newsId);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteNews(newsId);
      setSuccessMessage(t("adminNewsDeleteSuccess"));
      await load();
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setError(`${t("generalError")} (${deleteError.status})`);
      } else {
        setError(t("generalError"));
      }
    } finally {
      setActionNewsId(null);
    }
  }

  async function onDeleteImage(imageId: string): Promise<void> {
    if (!window.confirm(t("adminNewsDeleteImageConfirm"))) {
      return;
    }

    setActionImageId(imageId);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteNewsImage(imageId);
      setSuccessMessage(t("adminNewsDeleteImageSuccess"));
      await load();
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setError(`${t("generalError")} (${deleteError.status})`);
      } else {
        setError(t("generalError"));
      }
    } finally {
      setActionImageId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminNewsTitle")}</h2>
        <button
          type="button"
          className="icon-action-button"
          onClick={openCreateModal}
          title={t("createAction")}
          aria-label={t("createAction")}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      {successMessage ? <p>{successMessage}</p> : null}
      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && items.length === 0 ? <p>{t("adminNewsEmpty")}</p> : null}

      {!isLoading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableTitle")}</th>
                <th>{t("tableText")}</th>
                <th>{t("tableViews")}</th>
                <th>{t("tableLikes")}</th>
                <th>{t("tableUpdatedAt")}</th>
                <th>{t("tableImages")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.text}</td>
                  <td>{item.views_count ?? 0}</td>
                  <td>{item.likes_count ?? 0}</td>
                  <td>{formatDateTime(item.updated_at)}</td>
                  <td>
                    <div className="news-images-admin-grid">
                      {item.images.length === 0 ? <span className="text-muted">{t("tableNoData")}</span> : null}
                      {item.images.map((image) => (
                        <div key={image.id} className="news-image-admin-item">
                          <img src={image.image} alt={item.title} loading="lazy" />
                          <button
                            type="button"
                            className="icon-action-button danger"
                            title={t("deleteAction")}
                            aria-label={t("deleteAction")}
                            disabled={actionImageId === image.id}
                            onClick={() => void onDeleteImage(image.id)}
                          >
                            <FiX aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-action-button"
                        onClick={() => openEditModal(item)}
                        title={t("editAction")}
                        aria-label={t("editAction")}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-action-button danger"
                        onClick={() => void onDeleteNews(item.id)}
                        title={t("deleteAction")}
                        aria-label={t("deleteAction")}
                        disabled={actionNewsId === item.id}
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

      {isModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeModal}>
          <form className="modal-card" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
            <h3 className="section-heading">{modalTitle}</h3>
            <div className="form-grid">
              <label className="field">
                <span>{t("tableTitle")}</span>
                <input
                  value={values.title}
                  onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                  placeholder={t("tableTitle")}
                  required
                />
              </label>
              <label className="field">
                <span>{t("tableText")}</span>
                <textarea
                  value={values.text}
                  onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
                  placeholder={t("tableText")}
                  required
                />
              </label>
              <label className="field">
                <span>{t("adminNewsImagesLabel")}</span>
                <input type="file" multiple accept="image/*" onChange={onFilesChange} />
                <small className="field-hint">{t("adminNewsImagesHint")}</small>
              </label>
              {values.imageFiles.length > 0 ? (
                <p className="field-hint">
                  <FiImage aria-hidden="true" /> {values.imageFiles.length}
                </p>
              ) : null}
            </div>
            <div className="actions">
              <button type="button" className="button secondary" onClick={closeModal} disabled={isSubmitting}>
                {t("formBack")}
              </button>
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("formSubmitting") : isEditMode ? t("saveAction") : t("createAction")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
