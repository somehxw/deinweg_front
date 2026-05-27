import { useEffect } from "react";
import { EnrollmentForm } from "../../features/enrollment/components/EnrollmentForm";
import { EnrollmentRequestCreateResponseDto } from "../../shared/types/enrollment";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../shared/auth/tokenStorage";

export function EnrollmentRequestPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("enrollment-request-page");
    return () => {
      document.body.classList.remove("enrollment-request-page");
    };
  }, []);

  function handleSuccess(_: EnrollmentRequestCreateResponseDto): void {
    clearAccessToken();
    navigate("/login?registered=1", { replace: true });
  }

  return <EnrollmentForm onSuccess={handleSuccess} />;
}
