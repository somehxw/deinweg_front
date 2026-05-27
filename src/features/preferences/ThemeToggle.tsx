import { useTheme } from "../../app/providers/ThemeProvider";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function ThemeToggle(): JSX.Element {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" className="button secondary" onClick={toggleTheme}>
      {t("labelTheme")}: {theme === "light" ? t("themeLight") : t("themeDark")}
    </button>
  );
}
