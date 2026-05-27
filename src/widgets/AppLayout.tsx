import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { FloatingControls } from "../features/preferences/FloatingControls";
import { clearAccessToken, hasAccessToken } from "../shared/auth/tokenStorage";
import { useI18n } from "../shared/i18n/I18nProvider";
import { AppSidebar } from "./AppSidebar";

export function AppLayout(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isAuthorized = hasAccessToken();

  function handleLogout(): void {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-row">
          <Link to="/home" className="brand">
            <span className="brand-mark">d</span>
            <span>{t("appTitle")}</span>
          </Link>
          <nav className="nav">
            <NavLink to="/enrollment-request">
              {t("navEnrollmentForm")}
            </NavLink>
            {isAuthorized ? (
              <button type="button" className="topbar-logout" onClick={handleLogout}>
                {t("logout")}
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      {isAuthorized ? (
        <main className="section app-main-auth">
          <div className="container app-main-grid">
            <AppSidebar />
            <div className="app-main-content">
              <Outlet />
            </div>
          </div>
        </main>
      ) : (
        <main className="section">
          <div className="container">
            <Outlet />
          </div>
        </main>
      )}
      <FloatingControls />
    </div>
  );
}
