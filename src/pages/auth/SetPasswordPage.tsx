import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordSetup } from "../../shared/api/authApi";
import { ApiError } from "../../shared/api/httpClient";
import { clearAccessToken } from "../../shared/auth/tokenStorage";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function SetPasswordPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(): boolean {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      nextErrors.password = t("formValidationRequired");
    } else if (password.length < 8) {
      nextErrors.password = t("setPasswordMinLength");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("formValidationRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("formValidationPasswordsMatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    if (!token) {
      setSubmitError(t("setPasswordTokenMissing"));
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await confirmPasswordSetup({ token, password });
      if (response.ok) {
        clearAccessToken();
        setIsSuccess(true);
        window.setTimeout(() => {
          navigate("/login?password_set=1", { replace: true });
        }, 900);
        return;
      }

      setSubmitError(t("setPasswordError"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setSubmitError(t("setPasswordInvalidToken"));
      } else {
        setSubmitError(t("setPasswordError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h1 className="headline">{t("setPasswordTitle")}</h1>
      <p className="subline">{t("setPasswordDescription")}</p>

      <form className="form-shell set-password-shell" onSubmit={handleSubmit} noValidate>
        {isSuccess ? (
          <p className="success-text">{t("setPasswordSuccess")}</p>
        ) : (
          <>
            <EnrollmentPasswordField
              id="password"
              label={t("setPasswordLabel")}
              value={password}
              onChange={setPassword}
              error={errors.password}
            />

            <EnrollmentPasswordField
              id="confirmPassword"
              label={t("setPasswordConfirmLabel")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            />

            {submitError ? <p className="error-text">{submitError}</p> : null}

            <div className="actions">
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? t("formSubmitting") : t("setPasswordSubmit")}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}

interface EnrollmentPasswordFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function EnrollmentPasswordField({
  id,
  label,
  value,
  error,
  onChange
}: EnrollmentPasswordFieldProps): JSX.Element {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}
