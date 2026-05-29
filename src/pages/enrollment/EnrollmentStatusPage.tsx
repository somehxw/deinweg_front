import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EnrollmentStatusBadge } from "../../features/enrollment/components/EnrollmentStatusBadge";
import { getEnrollmentRequestStatus } from "../../shared/api/enrollmentApi";
import { ApiError } from "../../shared/api/httpClient";
import { getDefaultRouteByRole, getUserRoleFromToken } from "../../shared/auth/roles";
import { setAccessToken } from "../../shared/auth/tokenStorage";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { EnrollmentRequestStatusResponseDto } from "../../shared/types/enrollment";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENROLLMENT_TOKEN_PATTERN = /^[A-Za-z0-9._~\-]{16,512}$/;

export function EnrollmentStatusPage(): JSX.Element {
  const { requestId } = useParams<{ requestId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const statusToken = searchParams.get("token")?.trim() ?? "";

  const [inputValue, setInputValue] = useState(requestId ?? "");
  const [result, setResult] = useState<EnrollmentRequestStatusResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authDone, setAuthDone] = useState(false);

  useEffect(() => {
    if (!requestId) {
      return;
    }
    setInputValue(requestId);
    void handleLookup(requestId);
  }, [requestId, statusToken]);

  async function handleLookup(id: string): Promise<void> {
    if (!UUID_PATTERN.test(id)) {
      setResult(null);
      setError(t("formValidationUuid"));
      return;
    }
    if (!statusToken) {
      setResult(null);
      setError(t("statusTokenMissing"));
      return;
    }
    if (!ENROLLMENT_TOKEN_PATTERN.test(statusToken)) {
      setResult(null);
      setError(t("statusTokenInvalid"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getEnrollmentRequestStatus(id, statusToken);
      setResult(response);
      if (response.status === "set" && response.access) {
        setAccessToken(response.access);
        const role = getUserRoleFromToken();
        setAuthDone(true);
        navigate(getDefaultRouteByRole(role), { replace: true });
      }
    } catch (lookupError) {
      if (lookupError instanceof ApiError && lookupError.status === 404) {
        setError(t("generalError"));
      } else {
        setError(t("generalError"));
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await handleLookup(inputValue.trim());
  }

  useEffect(() => {
    if (!result || authDone) {
      return;
    }

    if (result.status !== "waiting" && result.status !== "setw" && result.status !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void handleLookup(result.id);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [authDone, result, statusToken]);

  return (
    <section>
      <h1 className="headline">{t("pageStatusTitle")}</h1>
      <p className="subline">{t("pageStatusDescription")}</p>

      <form className="form-shell status-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t("statusInputLabel")}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </label>
        <div className="actions">
          <button type="submit" className="button" disabled={loading}>
            {loading ? t("statusLoading") : t("statusSubmit")}
          </button>
        </div>
      </form>

      {error ? <p className="error-text">{error}</p> : null}

      {result ? (
        <div className="status-result">
          <EnrollmentStatusBadge status={result.status} />
          {result.moderation_comment ? (
            <p>
              <strong>{t("moderationCommentLabel")}:</strong> {result.moderation_comment}
            </p>
          ) : null}

          {result.status === "needs_relink" ? (
            <button type="button" className="button secondary" onClick={() => navigate("/")}>
              {t("submitNewRequest")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
