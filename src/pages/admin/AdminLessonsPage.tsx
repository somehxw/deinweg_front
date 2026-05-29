import { FormEvent, useEffect, useState } from "react";
import { FiClock, FiEdit2, FiPlus, FiRotateCcw, FiX } from "react-icons/fi";
import {
  cancelAdminLesson,
  getAdminLessonsList,
  getAdminTeachersList,
  rescheduleAdminLesson,
  updateAdminLesson
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminLessonDto, AdminTeacherItemDto } from "../../shared/types/admin";
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
  const [teachers, setTeachers] = useState<AdminTeacherItemDto[]>([]);
  const [editingLesson, setEditingLesson] = useState<AdminLessonDto | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  useEffect(() => {
    async function loadTeachers(): Promise<void> {
      try {
        setTeachers(await getAdminTeachersList());
      } catch {
        setTeachers([]);
      }
    }
    void loadTeachers();
  }, []);

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

  function onOpenEdit(item: AdminLessonDto): void {
    setEditingLesson(item);
    setSelectedTeacher(item.teacher ?? "");
    setIsEditOpen(true);
  }

  async function onEditTeacher(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!editingLesson) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateAdminLesson(editingLesson.id, {
        teacher: selectedTeacher || null
      });
      setIsEditOpen(false);
      setEditingLesson(null);
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

      {isEditOpen && editingLesson ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsEditOpen(false)}>
          <form className="modal-card" onSubmit={onEditTeacher} onClick={(event) => event.stopPropagation()}>
            <h3 className="section-heading">{t("adminLessonsEditTeacherTitle")}</h3>
            <div className="form-grid">
              <label className="field">
                <span>{t("tableTeacher")}</span>
                <select value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)}>
                  <option value="">{t("adminLessonsNoTeacher")}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {formatTeacherLabel(teacher)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="actions">
              <button type="button" className="button secondary" onClick={() => setIsEditOpen(false)}>
                {t("formBack")}
              </button>
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("formSubmitting") : t("saveAction")}
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
                <th>{t("tableLessonDay")}</th>
                <th>{t("tableLessonTime")}</th>
                <th>{t("tableDuration")}</th>
                <th>{t("tableLessonSubject")}</th>
                <th>{t("tableTeacher")}</th>
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
                  <td>{item.teacher_info ? `${item.teacher_info.first_name} ${item.teacher_info.last_name}`.trim() : "-"}</td>
                  <td>{localizeLessonStatus(item.status, t)}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        className="icon-action-button"
                        onClick={() => onOpenEdit(item)}
                        title={t("editAction")}
                        aria-label={t("editAction")}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
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

function formatTeacherLabel(item: AdminTeacherItemDto): string {
  const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim();
  if (fullName) return `${fullName} (${item.email})`;
  return item.email;
}
