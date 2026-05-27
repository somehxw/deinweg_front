import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasAccessToken } from "../../shared/auth/tokenStorage";

export function RequireAuth(): JSX.Element {
  const location = useLocation();

  if (!hasAccessToken()) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${redirectTo}`} replace />;
  }

  return <Outlet />;
}
