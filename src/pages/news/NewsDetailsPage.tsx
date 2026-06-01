import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getNewsById, toggleNewsLike } from "../../shared/api/newsApi";
import { env } from "../../shared/config/env";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { newsTranslations } from "../../shared/i18n/newsTranslations";
import { NewsItemDto } from "../../shared/types/news";
import "./NewsPage.css";

export function NewsDetailsPage(): JSX.Element {
  const { locale } = useI18n();
  const t = newsTranslations[locale];
  const { newsId } = useParams<{ newsId: string }>();
  const [newsItem, setNewsItem] = useState<NewsItemDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  const dateLocale = useMemo(() => (locale === "de" ? "de-DE" : "uk-UA"), [locale]);

  const loadNewsItem = useCallback(async () => {
    if (!newsId) {
      setLoadError(t.loadError);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getNewsById(newsId);
      setNewsItem(response);
    } catch {
      setLoadError(t.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [newsId, t.loadError]);

  useEffect(() => {
    void loadNewsItem();
  }, [loadNewsItem]);

  async function onToggleLike(): Promise<void> {
    if (!newsItem) {
      return;
    }

    setIsLikePending(true);
    setLikeError(null);
    try {
      const response = await toggleNewsLike(newsItem.id);
      setNewsItem((current) => {
        if (!current || current.is_liked === response.liked) {
          return current;
        }
        return {
          ...current,
          is_liked: response.liked,
          likes_count: response.liked
            ? current.likes_count + 1
            : Math.max(0, current.likes_count - 1)
        };
      });
    } catch {
      setLikeError(t.likeError);
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <section className="news-page">
      <div className="news-header">
        <div className="news-heading-block">
          <h1 className="news-title">{t.title}</h1>
          <p className="subline news-subline">{t.subtitle}</p>
        </div>
      </div>

      <div className="news-detail-actions">
        <Link className="button secondary" to="/news">
          {t.backToNews}
        </Link>
      </div>

      {isLoading ? <p className="news-state-text">{t.loading}</p> : null}

      {!isLoading && loadError ? (
        <div className="news-state-block">
          <p className="error-text news-state-text">{loadError}</p>
          <button
            type="button"
            className="button secondary news-retry-button"
            onClick={() => void loadNewsItem()}
          >
            {t.retry}
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError && newsItem ? (
        <NewsDetailsCard
          newsItem={newsItem}
          dateLocale={dateLocale}
          isLikePending={isLikePending}
          likeError={likeError}
          t={t}
          onToggleLike={onToggleLike}
        />
      ) : null}
    </section>
  );
}

function formatNewsDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function resolveNewsImageUrl(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (!env.apiBaseUrl) {
    return value;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${env.apiBaseUrl}${normalized}`;
}

interface NewsDetailsCardProps {
  newsItem: NewsItemDto;
  dateLocale: string;
  isLikePending: boolean;
  likeError: string | null;
  t: (typeof newsTranslations)["ua"];
  onToggleLike: () => Promise<void>;
}

function NewsDetailsCard({
  newsItem,
  dateLocale,
  isLikePending,
  likeError,
  t,
  onToggleLike
}: NewsDetailsCardProps): JSX.Element {
  const imageUrls = newsItem.images
    .map((image) => resolveNewsImageUrl(image.image_url || image.image))
    .filter((value): value is string => Boolean(value));

  return (
    <article className="news-card news-detail-card">
      <span className="news-date-chip">{formatNewsDate(newsItem.created_at, dateLocale)}</span>
      <h2 className="news-card-title">{newsItem.title}</h2>
      <p className="news-card-description">{newsItem.text}</p>

      {imageUrls.length > 0 ? (
        <div className="news-images-grid news-images-grid-detail">
          {imageUrls.map((url, index) => (
            <img key={`${newsItem.id}-${index}`} src={url} alt={newsItem.title} loading="lazy" />
          ))}
        </div>
      ) : null}

      <div className="news-meta-row">
        <span>
          {t.views}: {newsItem.views_count}
        </span>
        <span>
          {t.likes}: {newsItem.likes_count}
        </span>
      </div>

      <div className="news-card-actions">
        <button
          type="button"
          className={`button secondary news-like-button${newsItem.is_liked ? " active" : ""}`}
          disabled={isLikePending}
          onClick={() => void onToggleLike()}
        >
          {newsItem.is_liked ? t.unlike : t.like}
        </button>
        {likeError ? <small className="error-text news-like-error">{likeError}</small> : null}
      </div>
    </article>
  );
}
