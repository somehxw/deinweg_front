import { Locale } from "./translations";

interface NewsPageTranslation {
  menuAbout: string;
  menuPrograms: string;
  menuFormats: string;
  menuEvents: string;
  menuNews: string;
  backToHome: string;
  backToNews: string;
  kicker: string;
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  empty: string;
  retry: string;
  like: string;
  unlike: string;
  likes: string;
  views: string;
  likeError: string;
}

export const newsTranslations: Record<Locale, NewsPageTranslation> = {
  ua: {
    menuAbout: "Про школу",
    menuPrograms: "Програми",
    menuFormats: "Формати",
    menuEvents: "Події",
    menuNews: "Новини",
    backToHome: "На головну",
    backToNews: "До новин",
    kicker: "НОВИНИ ШКОЛИ",
    title: "Новини з життя deinweg",
    subtitle: "Оновлення про заняття, події та нові формати для дітей і родин.",
    loading: "Завантаження новин...",
    loadError: "Не вдалося завантажити новини. Спробуйте ще раз.",
    empty: "Новин поки немає.",
    retry: "Спробувати ще раз",
    like: "Подобається",
    unlike: "Забрати лайк",
    likes: "Лайки",
    views: "Перегляди",
    likeError: "Не вдалося змінити лайк."
  },
  de: {
    menuAbout: "Schule",
    menuPrograms: "Programme",
    menuFormats: "Formate",
    menuEvents: "Ereignisse",
    menuNews: "Neuigkeiten",
    backToHome: "Zur Startseite",
    backToNews: "Zurueck zu Neuigkeiten",
    kicker: "SCHULNACHRICHTEN",
    title: "Neuigkeiten aus dem Leben von deinweg",
    subtitle: "Updates zu Kursen, Ereignissen und neuen Formaten fuer Kinder und Familien.",
    loading: "Nachrichten werden geladen...",
    loadError: "Nachrichten konnten nicht geladen werden. Bitte erneut versuchen.",
    empty: "Noch keine Nachrichten.",
    retry: "Erneut versuchen",
    like: "Like",
    unlike: "Like entfernen",
    likes: "Likes",
    views: "Aufrufe",
    likeError: "Like konnte nicht aktualisiert werden."
  }
};
