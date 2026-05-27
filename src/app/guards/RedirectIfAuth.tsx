import { Navigate, Outlet } from "react-router-dom";
import { hasAccessToken } from "../../shared/auth/tokenStorage";

export function RedirectIfAuth(): JSX.Element {
  if (hasAccessToken()) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
