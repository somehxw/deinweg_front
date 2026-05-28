import { useEffect, useState } from "react";
import { EnrollmentForm } from "../../features/enrollment/components/EnrollmentForm";
import { EnrollmentSubmittedModal } from "../../features/enrollment/components/EnrollmentSubmittedModal";
import { EnrollmentRequestCreateResponseDto } from "../../shared/types/enrollment";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../shared/auth/tokenStorage";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function EnrollmentRequestPage(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("enrollment-request-page");
    return () => {
      document.body.classList.remove("enrollment-request-page");
    };
  }, []);

  function handleSuccess(_: EnrollmentRequestCreateResponseDto): void {
    clearAccessToken();
    setIsSubmittedModalOpen(true);
  }

  function closeSubmittedModal(): void {
    setIsSubmittedModalOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <>
      <EnrollmentForm onSuccess={handleSuccess} />
      {isSubmittedModalOpen ? (
        <EnrollmentSubmittedModal
          title={t("enrollmentSubmittedTitle")}
          description={t("enrollmentSubmittedText")}
          closeLabel={t("enrollmentSubmittedClose")}
          onClose={closeSubmittedModal}
        />
      ) : null}
    </>
  );
}
