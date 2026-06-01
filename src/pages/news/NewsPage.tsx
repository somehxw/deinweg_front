import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNewsById, getNewsList, toggleNewsLike } from "../../shared/api/newsApi";
import { env } from "../../shared/config/env";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { newsTranslations } from "../../shared/i18n/newsTranslations";
import { NewsItemDto } from "../../shared/types/news";
import "./NewsPage.css";

export function NewsPage(): JSX.Element {
  const { locale } = useI18n();
  const t = newsTranslations[locale];
  const [newsItems, setNewsItems] = useState<NewsItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [likePendingById, setLikePendingById] = useState<Record<string, boolean>>({});
  const [likeErrorById, setLikeErrorById] = useState<Record<string, string | null>>({});

  const dateLocale = useMemo(() => (locale === "de" ? "de-DE" : "uk-UA"), [locale]);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await getNewsList();
      const sorted = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (sorted.length === 0) {
        setNewsItems([]);
        return;
      }

      const latestId = sorted[0].id;
      const latest = await getNewsById(latestId);
      const merged = [latest, ...sorted.filter((item) => item.id !== latestId)];
      setNewsItems(merged);
    } catch {
      setLoadError(t.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  async function onToggleLike(newsId: string): Promise<void> {
    setLikePendingById((current) => ({ ...current, [newsId]: true }));
    setLikeErrorById((current) => ({ ...current, [newsId]: null }));

    try {
      const response = await toggleNewsLike(newsId);
      setNewsItems((current) =>
        current.map((item) => {
          if (item.id !== newsId || item.is_liked === response.liked) {
            return item;
          }
          return {
            ...item,
            is_liked: response.liked,
            likes_count: response.liked ? item.likes_count + 1 : Math.max(0, item.likes_count - 1)
          };
        })
      );
    } catch {
      setLikeErrorById((current) => ({ ...current, [newsId]: t.likeError }));
    } finally {
      setLikePendingById((current) => ({ ...current, [newsId]: false }));
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

      {isLoading ? <p className="news-state-text">{t.loading}</p> : null}

      {!isLoading && loadError ? (
        <div className="news-state-block">
          <p className="error-text news-state-text">{loadError}</p>
          <button type="button" className="button secondary news-retry-button" onClick={() => void loadNews()}>
            {t.retry}
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError && newsItems.length === 0 ? (
        <p className="news-state-text">{t.empty}</p>
      ) : null}

      {!isLoading && !loadError && newsItems.length > 0 ? (
        <div className="news-list">
          {newsItems.map((article) => {
            const imageUrls = article.images
              .map((image) => resolveNewsImageUrl(image.image_url || image.image))
              .filter((value): value is string => Boolean(value));

            const isLikePending = likePendingById[article.id] ?? false;
            const likeError = likeErrorById[article.id];

            return (
              <article className="news-card" key={article.id}>
                <span className="news-date-chip">{formatNewsDate(article.created_at, dateLocale)}</span>
                <h2 className="news-card-title">{article.title}</h2>
                <p className="news-card-description">{article.text}</p>

                {imageUrls.length > 0 ? (
                  <NewsMediaCarousel
                    mediaUrls={imageUrls}
                    title={article.title}
                    carouselId={article.id}
                  />
                ) : null}

                <div className="news-meta-row">
                  <span>
                    {t.views}: {article.views_count}
                  </span>
                  <span>
                    {t.likes}: {article.likes_count}
                  </span>
                </div>

                <div className="news-card-actions">
                  <button
                    type="button"
                    className={`button secondary news-like-button${article.is_liked ? " active" : ""}`}
                    disabled={isLikePending}
                    onClick={() => void onToggleLike(article.id)}
                  >
                    {article.is_liked ? t.unlike : t.like}
                  </button>
                  {likeError ? <small className="error-text news-like-error">{likeError}</small> : null}
                </div>
              </article>
            );
          })}
        </div>
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

interface NewsMediaCarouselProps {
  mediaUrls: string[];
  title: string;
  carouselId: string;
}

function NewsMediaCarousel({ mediaUrls, title, carouselId }: NewsMediaCarouselProps): JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = mediaUrls.length > 1;

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const nextIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    setActiveIndex(Math.min(Math.max(nextIndex, 0), mediaUrls.length - 1));
  }, [mediaUrls.length]);

  function scrollToIndex(index: number): void {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.scrollTo({
      left: track.clientWidth * index,
      behavior: "smooth"
    });
  }

  function goPrev(): void {
    const prevIndex = activeIndex === 0 ? mediaUrls.length - 1 : activeIndex - 1;
    scrollToIndex(prevIndex);
  }

  function goNext(): void {
    const nextIndex = activeIndex === mediaUrls.length - 1 ? 0 : activeIndex + 1;
    scrollToIndex(nextIndex);
  }

  return (
    <div className="news-carousel">
      <div className="news-carousel-track" ref={trackRef} onScroll={onScroll}>
        {mediaUrls.map((mediaUrl, index) => (
          <div className="news-carousel-slide" key={`${carouselId}-${index}`}>
            <img src={mediaUrl} alt={title} loading="lazy" />
          </div>
        ))}
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            className="news-carousel-arrow news-carousel-arrow-left"
            onClick={goPrev}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="news-carousel-arrow news-carousel-arrow-right"
            onClick={goNext}
            aria-label="Next image"
          >
            ›
          </button>

          <div className="news-carousel-dots" role="tablist" aria-label="Media navigation">
            {mediaUrls.map((_, index) => (
              <button
                key={`${carouselId}-dot-${index}`}
                type="button"
                className={`news-carousel-dot${index === activeIndex ? " active" : ""}`}
                aria-label={`Go to image ${index + 1}`}
                aria-selected={index === activeIndex}
                onClick={() => scrollToIndex(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
