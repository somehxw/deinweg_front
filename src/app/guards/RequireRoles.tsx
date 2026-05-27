import { Navigate, Outlet } from "react-router-dom";
import { getDefaultRouteByRole, getUserRoleFromToken, UserRole } from "../../shared/auth/roles";

interface RequireRolesProps {
  allowed: UserRole[];
}

export function RequireRoles({ allowed }: RequireRolesProps): JSX.Element {
  const role = getUserRoleFromToken();
  if (!allowed.includes(role)) {
    return <Navigate to={getDefaultRouteByRole(role)} replace />;
  }

  return <Outlet />;
}
