import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { createEnrollmentRequest } from "../../../shared/api/enrollmentApi";
import { ApiError } from "../../../shared/api/httpClient";
import { clearAccessToken } from "../../../shared/auth/tokenStorage";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { EnrollmentRequestCreateResponseDto } from "../../../shared/types/enrollment";
import {
  EnrollmentFormErrors,
  EnrollmentFormValues
} from "../model/enrollmentForm";
import { enrollmentValidationTexts } from "../model/enrollmentValidationTexts";
import { EnrollmentFormField } from "./EnrollmentFormField";
import { EnrollmentSubmitConfirmModal } from "./EnrollmentSubmitConfirmModal";

interface EnrollmentFormProps {
  onSuccess: (response: EnrollmentRequestCreateResponseDto) => void;
}

type FormStep = "parent" | "student";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REQUIRED = 12;

export function EnrollmentForm({ onSuccess }: EnrollmentFormProps): JSX.Element {
  const { t, locale } = useI18n();
  const formId = "enrollment-request-form";

  const [step, setStep] = useState<FormStep>("parent");
  const [values, setValues] = useState<EnrollmentFormValues>({
    parentEmail: "",
    parentFirstName: "",
    parentLastName: "",
    phone: "",
    studentFirstName: "",
    studentLastName: "",
    studentBirthDate: "",
    studentEmail: "",
    consentPersonalData: false
  });
  const [errors, setErrors] = useState<EnrollmentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  function validateParent(next: EnrollmentFormValues): EnrollmentFormErrors {
    const nextErrors: EnrollmentFormErrors = {};

    if (!next.parentEmail.trim()) {
      nextErrors.parentEmail = t("formValidationRequired");
    } else if (!EMAIL_PATTERN.test(next.parentEmail.trim())) {
      nextErrors.parentEmail = t("formValidationEmail");
    }

    if (!next.parentFirstName.trim()) {
      nextErrors.parentFirstName = t("formValidationRequired");
    } else if (next.parentFirstName.trim().length < 2) {
      nextErrors.parentFirstName = t("formValidationMin2");
    }

    if (!next.parentLastName.trim()) {
      nextErrors.parentLastName = t("formValidationRequired");
    } else if (next.parentLastName.trim().length < 2) {
      nextErrors.parentLastName = t("formValidationMin2");
    }

    if (!next.phone.trim()) {
      nextErrors.phone = t("formValidationRequired");
    } else if (countPhoneDigits(next.phone) !== PHONE_DIGITS_REQUIRED) {
      nextErrors.phone = enrollmentValidationTexts[locale].invalidPhone;
    }

    return nextErrors;
  }

  function validateStudent(next: EnrollmentFormValues): EnrollmentFormErrors {
    const nextErrors: EnrollmentFormErrors = {};

    if (!next.studentFirstName.trim()) {
      nextErrors.studentFirstName = t("formValidationRequired");
    }

    if (!next.studentLastName.trim()) {
      nextErrors.studentLastName = t("formValidationRequired");
    }

    if (!next.studentBirthDate) {
      nextErrors.studentBirthDate = t("formValidationRequired");
    } else {
      const birthDate = new Date(next.studentBirthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        nextErrors.studentBirthDate = t("formValidationBirthDate");
      }
    }

    if (next.studentEmail.trim() && !EMAIL_PATTERN.test(next.studentEmail.trim())) {
      nextErrors.studentEmail = t("formValidationEmail");
    }
    if (!next.consentPersonalData) {
      nextErrors.consentPersonalData = t("formValidationRequired");
    }

    return nextErrors;
  }

  function updateValue<Key extends keyof EnrollmentFormValues>(
    key: Key,
    value: EnrollmentFormValues[Key]
  ): void {
    if (key === "phone") {
      setValues((current) => ({
        ...current,
        [key]: applyPhoneMask(String(value))
      }));
      setErrors((current) => ({ ...current, [key]: undefined }));
      return;
    }

    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setGeneralError(null);

    if (step === "parent") {
      const validationErrors = validateParent(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setErrors({});
      setStep("student");
      return;
    }

    const validationErrors = validateStudent(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsConfirmModalOpen(true);
  }

  async function submitEnrollmentRequest(): Promise<void> {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);

    try {
      const response = await createEnrollmentRequest({
        parent_email: values.parentEmail.trim(),
        parent_first_name: values.parentFirstName.trim(),
        parent_last_name: values.parentLastName.trim(),
        phone: values.phone.trim() ? normalizePhone(values.phone) : undefined,
        student_first_name: values.studentFirstName.trim(),
        student_last_name: values.studentLastName.trim(),
        student_birth_date: values.studentBirthDate,
        student_email: values.studentEmail.trim() || undefined
      });

      onSuccess(response);
    } catch (error) {
      if (error instanceof ApiError) {
        const parsedFieldErrors = extractFieldErrors(error);
        if (Object.keys(parsedFieldErrors).length > 0) {
          setErrors(parsedFieldErrors);
        }

        if (error.status === 409 || error.status === 400) {
          setGeneralError(t("duplicateError"));
          return;
        }
      }

      setGeneralError(t("generalError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBackToParentStep(): void {
    setStep("parent");
    setGeneralError(null);
    setErrors({});
  }

  return (
    <section className="enrollment-section">
      <header className="enrollment-hero">
        <h1 className="headline">{t("pageEnrollmentTitle")}</h1>
      </header>

      <div className="enrollment-progress" aria-label={t("formStepsLabel")}>
        <div className="enrollment-progress-steps">
          <div className={`progress-step ${step === "parent" ? "active" : "done"}`}>
            <span className="progress-step-index">1</span>
            <span className="progress-step-label">{t("formStepParentShort")}</span>
          </div>
          <div className={`progress-step ${step === "student" ? "active" : ""}`}>
            <span className="progress-step-index">2</span>
            <span className="progress-step-label">{t("formStepStudentShort")}</span>
          </div>
        </div>
        <div className="enrollment-progress-line" aria-hidden="true">
          <span style={{ width: step === "parent" ? "50%" : "100%" }} />
        </div>
      </div>

      <form
        id={formId}
        className="form-shell enrollment-shell"
        onSubmit={handleSubmit}
        noValidate
      >

        <div className="form-grid">
          {step === "parent" ? (
            <>
              <div className="form-row">
                <EnrollmentFormField
                  id="parentFirstName"
                  label={t("formParentFirstName")}
                  value={values.parentFirstName}
                  onChange={(value) => updateValue("parentFirstName", value)}
                  error={errors.parentFirstName}
                />

                <EnrollmentFormField
                  id="parentLastName"
                  label={t("formParentLastName")}
                  value={values.parentLastName}
                  onChange={(value) => updateValue("parentLastName", value)}
                  error={errors.parentLastName}
                />
              </div>

              <EnrollmentFormField
                id="parentEmail"
                label={t("formParentEmail")}
                value={values.parentEmail}
                onChange={(value) => updateValue("parentEmail", value)}
                error={errors.parentEmail}
                type="email"
              />

              <EnrollmentFormField
                id="phone"
                label={t("formPhone")}
                value={values.phone}
                onChange={(value) => updateValue("phone", value)}
                error={errors.phone}
                required
                placeholder="+38 050 123 45 67"
                inputMode="tel"
              />
            </>
          ) : (
            <>
              <div className="form-row">
                <EnrollmentFormField
                  id="studentFirstName"
                  label={t("formStudentFirstName")}
                  value={values.studentFirstName}
                  onChange={(value) => updateValue("studentFirstName", value)}
                  error={errors.studentFirstName}
                />

                <EnrollmentFormField
                  id="studentLastName"
                  label={t("formStudentLastName")}
                  value={values.studentLastName}
                  onChange={(value) => updateValue("studentLastName", value)}
                  error={errors.studentLastName}
                />
              </div>

              <EnrollmentFormField
                id="studentBirthDate"
                label={t("formStudentBirthDate")}
                value={values.studentBirthDate}
                onChange={(value) => updateValue("studentBirthDate", value)}
                error={errors.studentBirthDate}
                type="date"
              />

              <EnrollmentFormField
                id="studentEmail"
                label={t("formStudentEmail")}
                value={values.studentEmail}
                onChange={(value) => updateValue("studentEmail", value)}
                error={errors.studentEmail}
                type="email"
                required={false}
              />

              <label className="enrollment-consent">
                <input
                  type="checkbox"
                  checked={values.consentPersonalData}
                  onChange={(event) =>
                    updateValue("consentPersonalData", event.target.checked)
                  }
                />
                <span>{t("enrollmentConsentText")}</span>
              </label>
              {errors.consentPersonalData ? (
                <small className="error-text">{errors.consentPersonalData}</small>
              ) : null}
            </>
          )}
        </div>

        {generalError ? <p className="error-text">{generalError}</p> : null}

      </form>

      <div className={`actions enrollment-actions ${step === "student" ? "two-buttons" : ""}`}>
        {step === "student" ? (
          <button
            type="button"
            className="button enrollment-submit enrollment-back-button"
            onClick={goBackToParentStep}
            disabled={isSubmitting}
          >
            {t("formBack")}
          </button>
        ) : null}

        <button
          type="submit"
          form={formId}
          className="button enrollment-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("formSubmitting")
            : step === "parent"
              ? t("formNext")
              : t("formSubmit")}
        </button>
      </div>
      {step === "parent" ? (
        <p className="enrollment-login-hint">
          <Link
            to="/login"
            className="inline-link"
            onClick={() => {
              clearAccessToken();
            }}
          >
            {t("enrollmentHasAccount")}
          </Link>
        </p>
      ) : null}

      {isConfirmModalOpen ? (
        <EnrollmentSubmitConfirmModal
          title={t("enrollmentConfirmTitle")}
          description={t("enrollmentConfirmText")}
          cancelLabel={t("enrollmentConfirmCancel")}
          confirmLabel={isSubmitting ? t("formSubmitting") : t("enrollmentConfirmSubmit")}
          isSubmitting={isSubmitting}
          onCancel={() => setIsConfirmModalOpen(false)}
          onConfirm={() => void submitEnrollmentRequest()}
        />
      ) : null}
    </section>
  );
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function countPhoneDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);

  if (digits.length === 0) {
    return "";
  }

  const cc = digits.slice(0, 2);
  const p1 = digits.slice(2, 5);
  const p2 = digits.slice(5, 8);
  const p3 = digits.slice(8, 10);
  const p4 = digits.slice(10, 12);

  let masked = `+${cc}`;
  if (p1) masked += ` ${p1}`;
  if (p2) masked += ` ${p2}`;
  if (p3) masked += ` ${p3}`;
  if (p4) masked += ` ${p4}`;

  return masked;
}

function extractFieldErrors(error: ApiError): EnrollmentFormErrors {
  const data = error.data;
  if (!data || typeof data !== "object") {
    return {};
  }

  const mapped: EnrollmentFormErrors = {};

  const map: Array<[keyof EnrollmentFormValues, string]> = [
    ["parentEmail", "parent_email"],
    ["parentFirstName", "parent_first_name"],
    ["parentLastName", "parent_last_name"],
    ["phone", "phone"],
    ["studentFirstName", "student_first_name"],
    ["studentLastName", "student_last_name"],
    ["studentBirthDate", "student_birth_date"],
    ["studentEmail", "student_email"],
    ["consentPersonalData", "consent_personal_data"]
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

