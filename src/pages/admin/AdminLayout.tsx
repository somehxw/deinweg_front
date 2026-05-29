import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useI18n } from "../../shared/i18n/I18nProvider";

const ADMIN_MOBILE_WARNING_SHOWN_KEY = "deinweg_admin_mobile_warning_shown";

export function AdminLayout(): JSX.Element {
  const { t } = useI18n();
  const [isMobileWarningOpen, setIsMobileWarningOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMobileViewport = window.matchMedia("(max-width: 860px)").matches;
    const wasShown = window.sessionStorage.getItem(ADMIN_MOBILE_WARNING_SHOWN_KEY) === "1";

    if (isMobileViewport && !wasShown) {
      setIsMobileWarningOpen(true);
      window.sessionStorage.setItem(ADMIN_MOBILE_WARNING_SHOWN_KEY, "1");
    }
  }, []);

  return (
    <section className="panel">
      <h1 className="headline">{t("adminPanelTitle")}</h1>
      <p className="subline">{t("adminPanelDescription")}</p>

      {isMobileWarningOpen ? (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-mobile-warning-title"
          onClick={() => setIsMobileWarningOpen(false)}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3 id="admin-mobile-warning-title" className="section-heading">
              {t("adminMobileWarningTitle")}
            </h3>
            <p className="subline">{t("adminMobileWarningText")}</p>
            <div className="actions">
              <button
                type="button"
                className="button"
                onClick={() => setIsMobileWarningOpen(false)}
              >
                {t("adminMobileWarningConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-content">
        <Outlet />
      </div>
    </section>
  );
}
