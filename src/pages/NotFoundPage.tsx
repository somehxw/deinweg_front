import { Link } from "react-router-dom";
import { useI18n } from "../shared/i18n/I18nProvider";

export function NotFoundPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="panel">
      <h1>{t("notFoundTitle")}</h1>
      <Link to="/" className="button">
        {t("notFoundBack")}
      </Link>
    </section>
  );
}
