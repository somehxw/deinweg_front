import { useEffect, useState } from "react";
import { FiClock, FiPlus, FiRotateCcw, FiX } from "react-icons/fi";
import {
  cancelAdminLesson,
  getAdminLessonsList,
  rescheduleAdminLesson,
  updateAdminLesson
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminLessonDto } from "../../shared/types/admin";
import { localizeLessonStatus, localizeWeekDay } from "../../shared/i18n/backendLabels";
import { AdminLessonCreateModal } from "../../features/admin/components/AdminLessonCreateModal";

function formatLocalDateTime(value: string): string {
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

export function AdminLessonsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminLessonDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionLessonId, setActionLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await getAdminLessonsList());
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

  async function onCancel(id: string): Promise<void> {
    setActionLessonId(id);
    try {
      await cancelAdminLesson(id);
      await load();
    } catch {
      setError(t("generalError"));
    } finally {
      setActionLessonId(null);
    }
  }

  async function onReschedule(item: AdminLessonDto): Promise<void> {
    const nextStartsAt = window.prompt(t("adminLessonsReschedulePrompt"), item.starts_at);
    if (!nextStartsAt) return;
    setActionLessonId(item.id);
    try {
      await rescheduleAdminLesson(item.id, {
        school_class: item.school_class,
        starts_at: new Date(nextStartsAt).toISOString(),
        duration_minutes: item.duration_minutes,
        topic: item.topic,
        room: item.room
      });
      await load();
    } catch {
      setError(t("generalError"));
    } finally {
      setActionLessonId(null);
    }
  }

  async function onRestore(item: AdminLessonDto): Promise<void> {
    setActionLessonId(item.id);
    try {
      await updateAdminLesson(item.id, { status: "planned" });
      await load();
    } catch {
      setError(t("generalError"));
    } finally {
      setActionLessonId(null);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminLessonsTitle")}</h2>
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

      <AdminLessonCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={load}
      />

      {isLoading ? <p>{t("listLoading")}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!isLoading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("tableClass")}</th>
                <th>{t("tableLessonDay")}</th>
                <th>{t("tableLessonTime")}</th>
                <th>{t("tableDuration")}</th>
                <th>{t("tableLessonSubject")}</th>
                <th>{t("tableStatus")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.class_name}</td>
                  <td>{localizeWeekDay(item.week_day, t)}</td>
                  <td>{formatLocalDateTime(item.starts_at)}</td>
                  <td>{item.duration_minutes}</td>
                  <td>{item.topic ?? "-"}</td>
                  <td>{localizeLessonStatus(item.status, t)}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        className="icon-action-button"
                        onClick={() => void onReschedule(item)}
                        title={t("rescheduleAction")}
                        aria-label={t("rescheduleAction")}
                        disabled={actionLessonId === item.id}
                      >
                        <FiClock aria-hidden="true" />
                      </button>
                      {item.status === "cancelled" ? (
                        <button
                          className="icon-action-button success"
                          onClick={() => void onRestore(item)}
                          title={t("restoreAction")}
                          aria-label={t("restoreAction")}
                          disabled={actionLessonId === item.id}
                        >
                          <FiRotateCcw aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          className="icon-action-button danger"
                          onClick={() => void onCancel(item.id)}
                          title={t("cancelAction")}
                          aria-label={t("cancelAction")}
                          disabled={actionLessonId === item.id}
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      )}
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
