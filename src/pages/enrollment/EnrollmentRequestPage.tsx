import { EnrollmentForm } from "../../features/enrollment/components/EnrollmentForm";
import { EnrollmentRequestCreateResponseDto } from "../../shared/types/enrollment";
import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "../../shared/auth/tokenStorage";

export function EnrollmentRequestPage(): JSX.Element {
  const navigate = useNavigate();

  function handleSuccess(_: EnrollmentRequestCreateResponseDto): void {
    clearAccessToken();
    navigate("/login?registered=1", { replace: true });
  }

  return <EnrollmentForm onSuccess={handleSuccess} />;
}
