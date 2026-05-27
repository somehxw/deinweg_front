import { Locale } from "../../shared/i18n/translations";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function LanguageSwitcher(): JSX.Element {
  const { t, locale, locales, setLocale } = useI18n();

  return (
    <label className="control" aria-label={t("labelLanguage")}>
      <select
        aria-label={t("labelLanguage")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
