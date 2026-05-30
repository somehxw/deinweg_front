import { FormEvent, useEffect, useState } from "react";
import { updateTeacherMeProfile } from "../../../shared/api/teacherApi";
import { ApiError } from "../../../shared/api/httpClient";
import { TranslationKey } from "../../../shared/i18n/translations";
import { TeacherProfileDto } from "../../../shared/types/teacher";

interface TeacherProfileFormProps {
  profile: TeacherProfileDto | null;
  isLoading: boolean;
  loadError: string | null;
  t: (key: TranslationKey) => string;
}

export function TeacherProfileForm({
  profile,
  isLoading,
  loadError,
  t
}: TeacherProfileFormProps): JSX.Element {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
  }, [profile]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setIsSaved(false);
    try {
      await updateTeacherMeProfile({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined
      });
      setIsSaved(true);
    } catch (submitLoadError) {
      if (submitLoadError instanceof ApiError) {
        setSubmitError(`${t("generalError")} (${submitLoadError.status})`);
      } else {
        setSubmitError(t("generalError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p>{t("listLoading")}</p>;
  }

  if (loadError) {
    return <p className="error-text">{loadError}</p>;
  }

  return (
    <section className="panel cabinet-section">
      <h2 className="section-heading">{t("teacherProfileTitle")}</h2>
      <p className="subline">{t("teacherProfileDescription")}</p>

      <form className="form-grid" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          <span>{t("fieldFirstName")}</span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            maxLength={120}
          />
        </label>
        <label className="field">
          <span>{t("fieldLastName")}</span>
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            maxLength={120}
          />
        </label>
        <label className="field">
          <span>{t("teacherProfilePhotoLabel")}</span>
          <input value={t("teacherProfilePhotoPending")} disabled />
        </label>
        <div className="actions">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? t("formSubmitting") : t("saveAction")}
          </button>
        </div>
      </form>

      {submitError ? <p className="error-text">{submitError}</p> : null}
      {isSaved ? <p className="success-text">{t("teacherProfileSaved")}</p> : null}
    </section>
  );
}
