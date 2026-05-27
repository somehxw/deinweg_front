import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEnrollmentRequestStatus } from "../../../shared/api/enrollmentApi";
import { ApiError } from "../../../shared/api/httpClient";
import { getDefaultRouteByRole, getUserRoleFromToken } from "../../../shared/auth/roles";
import { setAccessToken } from "../../../shared/auth/tokenStorage";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { EnrollmentRequestStatus } from "../../../shared/types/enrollment";
import { EnrollmentStatusBadge } from "./EnrollmentStatusBadge";

interface EnrollmentSuccessProps {
  requestId: string;
  initialStatus?: EnrollmentRequestStatus;
}

const POLL_INTERVAL_MS = 3500;

export function EnrollmentSuccess({
  requestId,
  initialStatus = "waiting"
}: EnrollmentSuccessProps): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<EnrollmentRequestStatus>(initialStatus);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [authDone, setAuthDone] = useState(false);

  const shouldPoll = useMemo(() => {
    return status === "waiting" || status === "setw" || status === "pending";
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function pollStatus(): Promise<void> {
      try {
        const response = await getEnrollmentRequestStatus(requestId);
        if (cancelled) {
          return;
        }

        setStatus(response.status);

        if (response.status === "set" && response.access) {
          setAccessToken(response.access);
          const role = getUserRoleFromToken();
          const nextRoute = getDefaultRouteByRole(role);
          setAuthDone(true);
          navigate(nextRoute, { replace: true });
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError) {
            setLookupError(`${t("statusLookupError")} (${error.status})`);
          } else {
            setLookupError(t("statusLookupError"));
          }
        }
      }
    }

    if (shouldPoll && !authDone) {
      const intervalId = window.setInterval(() => {
        void pollStatus();
      }, POLL_INTERVAL_MS);

      void pollStatus();

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [authDone, navigate, requestId, shouldPoll, t]);

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(requestId);
    setCopied(true);
  }

  return (
    <section className="panel">
      <h1 className="headline">{t("requestSuccessTitle")}</h1>
      <p className="subline">{t("requestSuccessDescription")}</p>
      <p>
        <strong>{t("requestIdLabel")}:</strong> {requestId}
      </p>
      <EnrollmentStatusBadge status={status} />
      {lookupError ? <p className="error-text">{lookupError}</p> : null}
      {status === "set" && !authDone ? <p>{t("statusSetAuthPending")}</p> : null}
      <div className="row">
        <button type="button" className="button secondary" onClick={handleCopy}>
          {copied ? t("copiedRequestId") : t("copyRequestId")}
        </button>
        <Link className="button secondary" to={`/enrollment-status/${requestId}`}>
          {t("goToStatus")}
        </Link>
      </div>
    </section>
  );
}
