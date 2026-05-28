import { FormEvent, useEffect, useState } from "react";
import { createAdminLesson, getAdminClassesList } from "../../../shared/api/adminApi";
import { ApiError } from "../../../shared/api/httpClient";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { localizeWeekDay } from "../../../shared/i18n/backendLabels";
import { AdminSchoolClassDto, WeekDay } from "../../../shared/types/admin";

interface AdminLessonCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
}

export function AdminLessonCreateModal({
  isOpen,
  onClose,
  onCreated
}: AdminLessonCreateModalProps): JSX.Element | null {
  const { t } = useI18n();
  const [classes, setClasses] = useState<AdminSchoolClassDto[]>([]);
  const [schoolClass, setSchoolClass] = useState("");
  const [startsAtTime, setStartsAtTime] = useState("");
  const [weekDay, setWeekDay] = useState<WeekDay>("monday");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [topic, setTopic] = useState("");
  const [room, setRoom] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    async function loadClasses(): Promise<void> {
      try {
        const response = await getAdminClassesList();
        if (!cancelled) {
          setClasses(response.filter((item) => item.active !== false));
        }
      } catch {
        if (!cancelled) {
          setClasses([]);
        }
      }
    }

    void loadClasses();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  function resetForm(): void {
    setSchoolClass("");
    setStartsAtTime("");
    setWeekDay("monday");
    setDurationMinutes("60");
    setTopic("");
    setRoom("");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
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

      resetForm();
      onClose();
      await onCreated?.();
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <form className="modal-card" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
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

        {error ? <p className="error-text">{error}</p> : null}

        <div className="actions">
          <button type="button" className="button secondary" onClick={onClose}>
            {t("formBack")}
          </button>
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? t("formSubmitting") : t("createAction")}
          </button>
        </div>
      </form>
    </div>
  );
}
