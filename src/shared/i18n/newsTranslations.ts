import { Locale } from "./translations";

interface NewsArticleTranslation {
  id: string;
  date: string;
  title: string;
  description: string;
  images: [string, string];
}

interface NewsPageTranslation {
  menuAbout: string;
  menuPrograms: string;
  menuFormats: string;
  menuEvents: string;
  menuNews: string;
  backToHome: string;
  kicker: string;
  title: string;
  subtitle: string;
  articles: [NewsArticleTranslation, NewsArticleTranslation];
}

export const newsTranslations: Record<Locale, NewsPageTranslation> = {
  ua: {
    menuAbout: "Про школу",
    menuPrograms: "Програми",
    menuFormats: "Формати",
    menuEvents: "Події",
    menuNews: "Новини",
    backToHome: "На головну",
    kicker: "НОВИНИ ШКОЛИ",
    title: "Новини з життя deinweg",
    subtitle: "Оновлення про заняття, події та нові формати для дітей і родин.",
    articles: [
      {
        id: "summer-workshops",
        date: "28 травня 2026",
        title: "Відкриваємо літню групу творчих майстерень",
        description:
          "З 15 червня стартує літній блок: малювання, музична майстерня та заняття з вишивки. Групи малі, тож щотижня кожна дитина отримує увагу викладача та можливість презентувати власні роботи на відкритому підсумковому дні.",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/a/a0/A_classroom_of_students_%287138907393%29.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/Students_in_classroom.jpg"
        ]
      },
      {
        id: "teen-club",
        date: "24 травня 2026",
        title: "Формуємо нову групу для підліткового клубу",
        description:
          "У червні запускаємо додаткові зустрічі клубу без гаджетів для віку 13-18. У програмі: командні настільні ігри, дискусії українською та малі проєкти, які підлітки презентують наприкінці місяця.",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/Students_in_classroom.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/0/03/Students_and_teacher_in_a_high_school_classroom_in_North_Carolina_07.jpg"
        ]
      }
    ]
  },
  de: {
    menuAbout: "Schule",
    menuPrograms: "Programme",
    menuFormats: "Formate",
    menuEvents: "Ereignisse",
    menuNews: "Neuigkeiten",
    backToHome: "Zur Startseite",
    kicker: "SCHULNACHRICHTEN",
    title: "Neuigkeiten aus dem Leben von deinweg",
    subtitle: "Updates zu Kursen, Ereignissen und neuen Formaten fuer Kinder und Familien.",
    articles: [
      {
        id: "summer-workshops",
        date: "28. Mai 2026",
        title: "Wir starten eine Sommergruppe mit Kreativwerkstaetten",
        description:
          "Am 15. Juni startet unser Sommerblock: Zeichnen, Musikwerkstatt und Stickkurs. Die Gruppen sind klein, daher bekommt jedes Kind woechentlich Aufmerksamkeit und praesentiert eigene Arbeiten am offenen Abschlusstag.",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/a/a0/A_classroom_of_students_%287138907393%29.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/Students_in_classroom.jpg"
        ]
      },
      {
        id: "teen-club",
        date: "24. Mai 2026",
        title: "Neue Gruppe fuer den Jugendklub",
        description:
          "Im Juni starten wir zusaetzliche gadgetfreie Treffen fuer 13- bis 18-Jaehrige. Im Programm: Team-Brettspiele, Diskussionen auf Ukrainisch und kleine Projekte mit Praesentation am Monatsende.",
        images: [
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/Students_in_classroom.jpg",
          "https://upload.wikimedia.org/wikipedia/commons/0/03/Students_and_teacher_in_a_high_school_classroom_in_North_Carolina_07.jpg"
        ]
      }
    ]
  }
};
