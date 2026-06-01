import { useI18n } from "../shared/i18n/I18nProvider";

export function NotFoundPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <section className="not-found-page" aria-labelledby="not-found-code">
      <div className="not-found-simple">
        <h1 className="not-found-code" id="not-found-code">404</h1>
        <p className="not-found-description">{t("notFoundDescription")}</p>
      </div>
    </section>
  );
}
