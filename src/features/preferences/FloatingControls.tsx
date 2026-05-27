import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useI18n } from "../../shared/i18n/I18nProvider";

export function FloatingControls(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function toggleLocale(): void {
    setLocale(locale === "ua" ? "de" : "ua");
  }

  return (
    <div
      ref={rootRef}
      className={`floating-controls${open ? " open" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="floating-fab"
        type="button"
        aria-label={t("labelSettings")}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      </button>

      <div className="floating-panel">
        <button
          className="floating-mini"
          type="button"
          aria-label={t("labelTheme")}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          )}
        </button>

        <button
          className="floating-mini"
          type="button"
          aria-label={t("labelLanguage")}
          onClick={toggleLocale}
        >
          <span className="mini-label">{locale.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
}
