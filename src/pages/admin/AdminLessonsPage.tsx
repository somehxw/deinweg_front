import { FormEvent, useEffect, useState } from "react";
import { FiClock, FiEdit2, FiPlus, FiX } from "react-icons/fi";
import {
  cancelAdminLesson,
  createAdminLesson,
  getAdminClassesList,
  getAdminLessonsList,
  getAdminTeachersList,
  rescheduleAdminLesson,
  updateAdminLesson
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminLessonDto, AdminSchoolClassDto, AdminTeacherItemDto, WeekDay } from "../../shared/types/admin";
import { localizeLessonStatus, localizeWeekDay } from "../../shared/i18n/backendLabels";

export function AdminLessonsPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminLessonDto[]>([]);
  const [classes, setClasses] = useState<AdminSchoolClassDto[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacherItemDto[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [startsAtTime, setStartsAtTime] = useState("");
  const [weekDay, setWeekDay] = useState<WeekDay>("monday");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [topic, setTopic] = useState("");
  const [room, setRoom] = useState("");
  const [editingLesson, setEditingLesson] = useState<AdminLessonDto | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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

  async function onCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!schoolClass.trim() || !startsAtTime) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const startsAtIso = new Date(`${datePart}T${startsAtTime}:00`).toISOString();
      await createAdminLesson({
        school_class: schoolClass.trim(),
        starts_at: startsAtIso,
        week_day: weekDay,
        duration_minutes: Number(durationMinutes),
        topic: topic.trim() || undefined,
        room: room.trim() || undefined
      });
      setSchoolClass("");
      setStartsAtTime("");
      setWeekDay("monday");
      setDurationMinutes("60");
      setTopic("");
      setRoom("");
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

  async function onCancel(id: string): Promise<void> {
    try {
      await cancelAdminLesson(id);
      await load();
    } catch {
      setError(t("generalError"));
    }
  }

  async function onReschedule(item: AdminLessonDto): Promise<void> {
    const nextStartsAt = window.prompt(t("adminLessonsReschedulePrompt"), item.starts_at);
    if (!nextStartsAt) return;
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

      {isCreateOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsCreateOpen(false)}>
          <form className="modal-card" onSubmit={onCreate} onClick={(event) => event.stopPropagation()}>
            <h3 className="section-heading">{t("adminLessonsTitle")}</h3>
            <div className="form-grid">
              <div className="form-row">
                <label className="field">
                  <span>{t("tableClassId")}</span>
                  <select
                    value={schoolClass}
                    onChange={(event) => setSchoolClass(event.target.value)}
                    required
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
                  <span>{t("tableLessonTime")}</span>
                  <input
                    type="time"
                    value={startsAtTime}
                    onChange={(event) => setStartsAtTime(event.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="field">
                <span>{t("tableLessonDay")}</span>
                <select
                  value={weekDay}
                  onChange={(event) => setWeekDay(event.target.value as WeekDay)}
                >
                  <option value="monday">{localizeWeekDay("monday", t)}</option>
                  <option value="tuesday">{localizeWeekDay("tuesday", t)}</option>
                  <option value="wednesday">{localizeWeekDay("wednesday", t)}</option>
                  <option value="thursday">{localizeWeekDay("thursday", t)}</option>
                  <option value="friday">{localizeWeekDay("friday", t)}</option>
                  <option value="saturday">{localizeWeekDay("saturday", t)}</option>
                  <option value="sunday">{localizeWeekDay("sunday", t)}</option>
                </select>
              </label>
              <div className="form-row">
                <label className="field">
                  <span>{t("tableDuration")}</span>
                  <input
                    type="number"
                    min={0}
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>{t("tableLessonSubject")}</span>
                  <input value={topic} onChange={(event) => setTopic(event.target.value)} />
                </label>
              </div>
              <label className="field">
                <span>{t("tableRoom")}</span>
                <input value={room} onChange={(event) => setRoom(event.target.value)} />
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
                  <td>{item.starts_at}</td>
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
                      >
                        <FiClock aria-hidden="true" />
                      </button>
                      <button
                        className="icon-action-button danger"
                        onClick={() => void onCancel(item.id)}
                        title={t("cancelAction")}
                        aria-label={t("cancelAction")}
                      >
                        <FiX aria-hidden="true" />
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

function formatTeacherLabel(item: AdminTeacherItemDto): string {
  const fullName = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim();
  if (fullName) return `${fullName} (${item.email})`;
  return item.email;
}
