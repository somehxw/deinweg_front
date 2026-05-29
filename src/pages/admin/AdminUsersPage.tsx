import { FormEvent, useEffect, useState } from "react";
import { FiEdit2, FiPlus } from "react-icons/fi";
import {
  createOrUpdateAdminTeacherWithUser,
  getAdminTeachersList,
  updateAdminTeacher
} from "../../shared/api/adminApi";
import { ApiError } from "../../shared/api/httpClient";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AdminTeacherItemDto, TeacherPosition } from "../../shared/types/admin";

interface TeacherFormValues {
  email: string;
  firstName: string;
  lastName: string;
  position: TeacherPosition;
  hourlyRate: string;
  bio: string;
  avatarUrl: string;
  sendPasswordSetup: boolean;
}

interface TeacherFormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  hourlyRate?: string;
  bio?: string;
  avatarUrl?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/;

const DEFAULT_FORM: TeacherFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  position: "teacher",
  hourlyRate: "",
  bio: "",
  avatarUrl: "",
  sendPasswordSetup: true
};

export function AdminUsersPage(): JSX.Element {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminTeacherItemDto[]>([]);
  const [values, setValues] = useState<TeacherFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<TeacherFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function load(): Promise<void> {
    setIsLoading(true);
    setGeneralError(null);
    try {
      setItems(await getAdminTeachersList());
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        if (loadError.status === 401 || loadError.status === 403) {
          setGeneralError(t("adminNoPermissions"));
        } else if (loadError.status >= 500) {
          setGeneralError(t("adminServerTryLater"));
        } else {
          setGeneralError(`${t("generalError")} (${loadError.status})`);
        }
      } else {
        setGeneralError(t("generalError"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [t]);

  function validate(next: TeacherFormValues): TeacherFormErrors {
    const nextErrors: TeacherFormErrors = {};

    if (!next.email.trim()) {
      nextErrors.email = t("formValidationRequired");
    } else if (!EMAIL_PATTERN.test(next.email.trim())) {
      nextErrors.email = t("formValidationEmail");
    }

    if (!next.hourlyRate.trim()) {
      nextErrors.hourlyRate = t("formValidationRequired");
    } else if (!DECIMAL_PATTERN.test(next.hourlyRate.trim())) {
      nextErrors.hourlyRate = t("adminTeacherHourlyRateFormatError");
    }

    if (next.position !== "teacher" && next.position !== "assistant") {
      nextErrors.position = t("formValidationRequired");
    }

    return nextErrors;
  }

  function updateValue<Key extends keyof TeacherFormValues>(
    key: Key,
    value: TeacherFormValues[Key]
  ): void {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setGeneralError(null);
    setSuccessMessage(null);
  }

  function openCreateModal(): void {
    setEditingId(null);
    setValues(DEFAULT_FORM);
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(item: AdminTeacherItemDto): void {
    setEditingId(item.id);
    setValues({
      email: item.email,
      firstName: item.first_name ?? "",
      lastName: item.last_name ?? "",
      position: item.position,
      hourlyRate: item.hourly_rate === undefined || item.hourly_rate === null ? "" : String(item.hourly_rate),
      bio: item.bio ?? "",
      avatarUrl: item.avatar_url ?? "",
      sendPasswordSetup: false
    });
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    if (isSubmitting) return;
    setIsModalOpen(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      if (editingId) {
        await updateAdminTeacher(editingId, {
          first_name: values.firstName.trim() || undefined,
          last_name: values.lastName.trim() || undefined,
          position: values.position,
          hourly_rate: values.hourlyRate.trim(),
          bio: values.bio.trim() || undefined,
          avatar_url: values.avatarUrl.trim() || undefined
        });
      } else {
        await createOrUpdateAdminTeacherWithUser({
          email: values.email.trim(),
          first_name: values.firstName.trim() || undefined,
          last_name: values.lastName.trim() || undefined,
          position: values.position,
          hourly_rate: values.hourlyRate.trim(),
          bio: values.bio.trim() || undefined,
          avatar_url: values.avatarUrl.trim() || undefined,
          send_password_setup: values.sendPasswordSetup
        });
      }

      setSuccessMessage(
        values.sendPasswordSetup
          ? t("adminTeacherCreateSuccessWithEmail")
          : t("adminTeacherCreateSuccess")
      );
      setIsModalOpen(false);
      await load();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        if (submitError.status === 400) {
          const apiErrors = extractFieldErrors(submitError);
          if (Object.keys(apiErrors).length > 0) {
            setErrors(apiErrors);
            setGeneralError(t("adminTeacherFieldErrors"));
            return;
          }
          setGeneralError(t("adminTeacherBadRequestError"));
          return;
        }

        if (submitError.status === 401 || submitError.status === 403) {
          setGeneralError(t("adminNoPermissions"));
          return;
        }

        if (submitError.status >= 500) {
          setGeneralError(t("adminServerTryLater"));
          return;
        }
      }

      setGeneralError(t("generalError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <h2 className="section-heading">{t("adminUsersTitle")}</h2>
        <button
          type="button"
          className="icon-action-button"
          title={t("createAction")}
          aria-label={t("createAction")}
          onClick={openCreateModal}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>

      {successMessage ? <p className="success-text">{successMessage}</p> : null}
      {generalError ? <p className="error-text">{generalError}</p> : null}

      {isLoading ? <p>{t("listLoading")}</p> : null}

      {!isLoading && items.length === 0 ? <p>{t("adminTeachersEmpty")}</p> : null}

      {!isLoading && items.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("fieldFullName")}</th>
                <th>{t("tableEmail")}</th>
                <th>{t("adminTeacherPositionLabel")}</th>
                <th>{t("adminTeacherHourlyRateLabel")}</th>
                <th>{t("tableComment")}</th>
                <th>{t("tableUpdatedAt")}</th>
                <th className="actions-col">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatFullName(item.first_name, item.last_name, item.email)}</td>
                  <td>{item.email}</td>
                  <td>{item.position === "teacher" ? t("adminTeacherPositionTeacher") : t("adminTeacherPositionAssistant")}</td>
                  <td>{item.hourly_rate ?? "-"}</td>
                  <td>{item.bio ?? "-"}</td>
                  <td>{item.updated_at ?? "-"}</td>
                  <td className="actions-col">
                    <div className="table-actions">
                      <button
                        type="button"
                        className="icon-action-button"
                        title={t("editAction")}
                        aria-label={t("editAction")}
                        onClick={() => openEditModal(item)}
                      >
                        <FiEdit2 aria-hidden="true" />
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
          <form className="modal-card" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()} noValidate>
            <h3 className="section-heading">
              {editingId ? t("adminTeacherEditTitle") : t("adminTeacherCreateTitle")}
            </h3>
            <div className="form-grid">
              <div className="form-row">
                <label className="field">
                  <span>{t("fieldFirstName")}</span>
                  <input
                    value={values.firstName}
                    onChange={(event) => updateValue("firstName", event.target.value)}
                  />
                  {errors.firstName ? <small className="error-text">{errors.firstName}</small> : null}
                </label>
                <label className="field">
                  <span>{t("fieldLastName")}</span>
                  <input
                    value={values.lastName}
                    onChange={(event) => updateValue("lastName", event.target.value)}
                  />
                  {errors.lastName ? <small className="error-text">{errors.lastName}</small> : null}
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>{t("tableEmail")}</span>
                  <input
                    type="email"
                    value={values.email}
                    onChange={(event) => updateValue("email", event.target.value)}
                    required
                    disabled={Boolean(editingId)}
                  />
                  {errors.email ? <small className="error-text">{errors.email}</small> : null}
                </label>

                <label className="field">
                  <span>{t("adminTeacherPositionLabel")}</span>
                  <select
                    value={values.position}
                    onChange={(event) => updateValue("position", event.target.value as TeacherPosition)}
                  >
                    <option value="teacher">{t("adminTeacherPositionTeacher")}</option>
                    <option value="assistant">{t("adminTeacherPositionAssistant")}</option>
                  </select>
                  {errors.position ? <small className="error-text">{errors.position}</small> : null}
                </label>
              </div>

              <label className="field">
                <span>{t("adminTeacherHourlyRateLabel")}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={values.hourlyRate}
                  onChange={(event) => updateValue("hourlyRate", event.target.value)}
                  placeholder="35.50"
                  required
                />
                {errors.hourlyRate ? <small className="error-text">{errors.hourlyRate}</small> : null}
              </label>

              <label className="field">
                <span>{t("tableComment")}</span>
                <input
                  type="text"
                  value={values.bio}
                  onChange={(event) => updateValue("bio", event.target.value)}
                />
                {errors.bio ? <small className="error-text">{errors.bio}</small> : null}
              </label>

              <label className="field">
                <span>{t("adminTeacherAvatarUrlLabel")}</span>
                <input
                  type="url"
                  value={values.avatarUrl}
                  onChange={(event) => updateValue("avatarUrl", event.target.value)}
                />
                {errors.avatarUrl ? <small className="error-text">{errors.avatarUrl}</small> : null}
              </label>

              <label className="field checkbox-field">
                <span>{t("adminTeacherSendSetupLabel")}</span>
                <input
                  type="checkbox"
                  checked={values.sendPasswordSetup}
                  onChange={(event) => updateValue("sendPasswordSetup", event.target.checked)}
                  disabled={Boolean(editingId)}
                />
              </label>
            </div>

            {generalError ? <p className="error-text">{generalError}</p> : null}

            <div className="actions">
              <button type="button" className="button secondary" onClick={closeModal} disabled={isSubmitting}>
                {t("formBack")}
              </button>
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("formSubmitting") : t("adminTeacherSubmit")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function extractFieldErrors(error: ApiError): TeacherFormErrors {
  const data = error.data;
  if (!data || typeof data !== "object") {
    return {};
  }

  const mapped: TeacherFormErrors = {};

  const map: Array<[keyof TeacherFormErrors, string]> = [
    ["email", "email"],
    ["firstName", "first_name"],
    ["lastName", "last_name"],
    ["position", "position"],
    ["hourlyRate", "hourly_rate"],
    ["bio", "bio"],
    ["avatarUrl", "avatar_url"]
  ];

  map.forEach(([clientKey, apiKey]) => {
    const raw = data[apiKey];
    if (typeof raw === "string") {
      mapped[clientKey] = raw;
      return;
    }
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      mapped[clientKey] = raw[0];
    }
  });

  return mapped;
}

function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallbackEmail: string
): string {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || fallbackEmail;
}
