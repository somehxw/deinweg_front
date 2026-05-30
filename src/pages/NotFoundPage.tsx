import { Link } from "react-router-dom";
import { useI18n } from "../shared/i18n/I18nProvider";

export function NotFoundPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="not-found-page panel">
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <h1 className="headline">{t("notFoundTitle")}</h1>
      <p className="subline not-found-subline">{t("notFoundDescription")}</p>
      <div className="not-found-actions">
        <Link to="/home" className="button">
          {t("notFoundBack")}
        </Link>
        <Link to="/news" className="button secondary">
          {t("notFoundActionNews")}
        </Link>
        <Link to="/enrollment-request" className="button secondary">
          {t("notFoundActionEnrollment")}
        </Link>
      </div>
    </section>
  );
}
