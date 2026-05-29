import { useI18n } from "../../shared/i18n/I18nProvider";
import { newsTranslations } from "../../shared/i18n/newsTranslations";
import "./NewsPage.css";

const LANDING_URL = "file:///D:/%D1%81%D0%B5%D1%81%D1%81%D0%B8%D1%8F/front-end/landing/index.html";

export function NewsPage(): JSX.Element {
  const { locale } = useI18n();
  const content = newsTranslations[locale];

  return (
    <section className="news-page">
      <div className="news-top-links" aria-label={content.menuNews}>
        <a href={`${LANDING_URL}#about`}>{content.menuAbout}</a>
        <a href={`${LANDING_URL}#programs`}>{content.menuPrograms}</a>
        <a href={`${LANDING_URL}#pricing`}>{content.menuFormats}</a>
        <a href={`${LANDING_URL}#events`}>{content.menuEvents}</a>
        <a href={`${LANDING_URL}#news`} className="active">
          {content.menuNews}
        </a>
      </div>

      <div className="news-header">
        <div className="news-heading-block">
          <p className="kicker">{content.kicker}</p>
          <h1 className="news-title">{content.title}</h1>
          <p className="subline news-subline">{content.subtitle}</p>
        </div>
        <div className="news-header-actions">
          <a href={LANDING_URL} className="news-home-link">
            {content.backToHome}
          </a>
        </div>
      </div>

      <div className="news-list">
        {content.articles.map((article) => (
          <article className="news-card" key={article.id}>
            <span className="news-date-chip">{article.date}</span>
            <h2 className="news-card-title">{article.title}</h2>
            <p className="news-card-description">{article.description}</p>

            <div className="news-images-grid">
              <img src={article.images[0]} alt={article.title} loading="lazy" />
              <img src={article.images[1]} alt={article.title} loading="lazy" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
