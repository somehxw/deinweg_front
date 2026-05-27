import { useI18n } from "../../../shared/i18n/I18nProvider";
import { EnrollmentRequestStatus } from "../../../shared/types/enrollment";

interface EnrollmentStatusBadgeProps {
  status: EnrollmentRequestStatus;
}

export function EnrollmentStatusBadge({
  status
}: EnrollmentStatusBadgeProps): JSX.Element {
  const { t } = useI18n();

  const label =
    status === "waiting" || status === "pending"
      ? t("statusPending")
      : status === "setw"
        ? t("statusSetw")
        : status === "set"
          ? t("statusSet")
          : status === "approved"
            ? t("statusApproved")
            : status === "rejected"
              ? t("statusRejected")
              : t("statusNeedsRelink");

  return <p className={`status status-${status}`}>{label}</p>;
}
