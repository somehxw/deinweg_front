import { Navigate } from "react-router-dom";
import { getDefaultRouteByRole, getUserRoleFromToken } from "../../shared/auth/roles";

export function RoleHomeRedirect(): JSX.Element {
  const role = getUserRoleFromToken();
  return <Navigate to={getDefaultRouteByRole(role)} replace />;
}
