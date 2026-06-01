import { Link, Outlet, useMatches, useNavigate } from "react-router-dom";
import { FloatingControls } from "../features/preferences/FloatingControls";
import { clearAccessToken, hasAccessToken } from "../shared/auth/tokenStorage";
import { useI18n } from "../shared/i18n/I18nProvider";
import { AppSidebar } from "./AppSidebar";

export function AppLayout(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const matches = useMatches();
  const isAuthorized = hasAccessToken();
  const hideChrome = matches.some((match) => {
    const handle = match.handle as { hideChrome?: boolean } | undefined;
    return Boolean(handle?.hideChrome);
  });

  function handleLogout(): void {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`app-shell${hideChrome ? " app-shell-not-found" : ""}`}>
      <header className={`topbar${hideChrome ? " topbar-not-found" : ""}`}>
        <div className={`container topbar-row${hideChrome ? " topbar-row-centered" : ""}`}>
          <Link to={isAuthorized && !hideChrome ? "/home" : "/"} className="brand">
            <span className="brand-mark">d</span>
            <span>{t("appTitle")}</span>
          </Link>
          {!hideChrome ? (
            <nav className="nav">
              {isAuthorized ? (
                <button type="button" className="topbar-logout" onClick={handleLogout}>
                  {t("logout")}
                </button>
              ) : null}
            </nav>
          ) : null}
        </div>
      </header>
      {isAuthorized && !hideChrome ? (
        <main className="section app-main-auth">
          <div className="container app-main-grid">
            <AppSidebar />
            <div className="app-main-content">
              <Outlet />
            </div>
          </div>
        </main>
      ) : (
        <main className={`section${hideChrome ? " section-not-found" : ""}`}>
          <div className="container">
            <Outlet />
          </div>
        </main>
      )}
      {!hideChrome ? <FloatingControls /> : null}
    </div>
  );
}
