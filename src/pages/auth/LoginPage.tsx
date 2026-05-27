import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createJwt } from "../../shared/api/authApi";
import { ApiError } from "../../shared/api/httpClient";
import { setAuthTokens } from "../../shared/auth/tokenStorage";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function LoginPage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegistered = searchParams.get("registered") === "1";
  const isPasswordSet = searchParams.get("password_set") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t("formValidationRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createJwt({
        email: email.trim(),
        password
      });

      if (!response.access) {
        setError(t("loginError"));
        return;
      }

      if (!response.refresh) {
        setError(t("loginError"));
        return;
      }
      setAuthTokens(response.access, response.refresh);
      navigate("/home", { replace: true });
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError(t("loginInvalidCredentials"));
      } else {
        setError(t("loginError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h1 className="headline">{t("loginTitle")}</h1>
      <p className="subline">{t("loginDescription")}</p>

      <form className="form-shell login-shell" onSubmit={onSubmit} noValidate>
        <div className="login-success-stack">
          {isRegistered ? <p className="success-text">{t("loginRegisteredSuccess")}</p> : null}
          {isPasswordSet ? <p className="success-text">{t("loginPasswordSetSuccess")}</p> : null}
        </div>

        <div className="form-grid">
          <label className="field">
            <span>{t("loginEmailLabel")}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>{t("loginPasswordLabel")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="actions">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? t("formSubmitting") : t("loginSubmit")}
          </button>
        </div>

        <div className="login-helper">
          <p className="login-helper-text">
            {t("loginNoAccount")}{" "}
            <Link className="inline-link" to="/enrollment-request">
              {t("loginGoToEnrollment")}
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}
