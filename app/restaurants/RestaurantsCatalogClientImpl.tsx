"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useWebAuth } from "../components/WebAuthProvider";
import {
  apiAssetUrl,
  restaurantPublicSlug,
  type PublicHomeCms,
  type PublicRestaurant,
} from "../lib/jetkiz-api";
import {
  trackWebsiteSearch,
  trackWebsiteSearchClick,
  type WebsiteSearchTrackResult,
} from "../lib/search-analytics";

type Filter = "home" | "all" | "open";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 5.7a5.4 5.4 0 0 0-7.7 0L12 6.8l-1.1-1.1a5.4 5.4 0 1 0-7.7 7.6L12 22l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.6-4.2 3.1-6.3 7.5-6.3s6.9 2.1 7.5 6.3" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 4.5h2.5l1.55 9.1a2.15 2.15 0 0 0 2.12 1.8h7.45a2.15 2.15 0 0 0 2.08-1.6L20 8H6.05" />
      <path d="M9.1 11.4h7.7" />
      <circle cx="9.2" cy="19" r="1.35" />
      <circle cx="17.1" cy="19" r="1.35" />
    </svg>
  );
}

function LocationDot() {
  return <span className="market-location-dot" aria-hidden="true" />;
}

export function RestaurantsCatalogClient({
  restaurants,
  home,
  pinnedRestaurantIds,
}: {
  restaurants: PublicRestaurant[];
  home: PublicHomeCms;
  pinnedRestaurantIds: string[];
}) {
  const { lang, setLang } = useLanguage();
  const { user, loading: authLoading, openLogin } = useWebAuth();
  const ru = lang === "ru";
  const hasPinnedRestaurants = pinnedRestaurantIds.length > 0;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(hasPinnedRestaurants ? "home" : "all");
  const [cartCount, setCartCount] = useState(0);
  const [cartHref, setCartHref] = useState("/restaurants");
  const [searchResult, setSearchResult] = useState<WebsiteSearchTrackResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const lastTrackedSearch = useRef<{ query: string; searchQueryLogId: string | null }>({
    query: "",
    searchQueryLogId: null,
  });

  const promos = useMemo(
    () =>
      [...(home.promos || [])]
        .filter((item) => item?.isActive !== false)
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
        .slice(0, 8),
    [home.promos],
  );

  const categories = useMemo(
    () =>
      [...(home.categories || [])]
        .filter((item) => item?.isActive !== false)
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
        .slice(0, 12),
    [home.categories],
  );

  const pinnedOrder = useMemo(
    () => new Map(pinnedRestaurantIds.map((id, index) => [id, index])),
    [pinnedRestaurantIds],
  );

  const filtered = useMemo(() => {
    const result = restaurants.filter((restaurant) => {
      if (
        filter === "home" &&
        hasPinnedRestaurants &&
        !pinnedOrder.has(restaurant.id)
      ) {
        return false;
      }

      if (filter === "open" && restaurant.canAcceptOrders !== true) return false;
      return true;
    });

    if (filter === "home" && hasPinnedRestaurants) {
      result.sort(
        (left, right) =>
          (pinnedOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (pinnedOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }

    return result;
  }, [filter, restaurants, hasPinnedRestaurants, pinnedOrder]);

  const sectionTitle = query.trim()
    ? ru ? "Результаты поиска" : "Іздеу нәтижелері"
    : filter === "home" && hasPinnedRestaurants
      ? ru ? "Рестораны" : "Мейрамханалар"
      : filter === "open"
        ? ru ? "Принимают заказы" : "Тапсырыс қабылдайды"
        : ru ? "Все рестораны" : "Барлық мейрамханалар";

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSearchResult(null);
      setSearchLoading(false);
      setSearchFailed(false);
      lastTrackedSearch.current = { query: "", searchQueryLogId: null };
      return;
    }

    setSearchResult(null);
    setSearchLoading(true);
    setSearchFailed(false);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void trackWebsiteSearch(trimmed, "website_catalog").then((result) => {
        if (cancelled) return;

        if (!result) {
          setSearchFailed(true);
          setSearchLoading(false);
          return;
        }

        lastTrackedSearch.current = {
          query: result.query,
          searchQueryLogId: result.searchQueryLogId,
        };
        setSearchResult(result);
        setSearchFailed(false);
        setSearchLoading(false);
      });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const searchedRestaurants = useMemo(() => {
    if (!searchResult) return [];

    return searchResult.restaurants
      .map((item) => restaurants.find((restaurant) => restaurant.id === item.id))
      .filter((item): item is PublicRestaurant => Boolean(item));
  }, [restaurants, searchResult]);

  const searchedProducts = searchResult?.products ?? [];

  useEffect(() => {
    const readCart = () => {
      let nextCount = 0;
      let nextHref = "/restaurants";
      let destinationChosen = false;

      try {
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (!key?.startsWith("jetkiz-cart:")) continue;

          const restaurantId = key.slice("jetkiz-cart:".length);
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;

          const lines = JSON.parse(raw) as Array<{ quantity?: number }>;
          const count = Array.isArray(lines)
            ? lines.reduce((sum, line) => sum + Math.max(0, Number(line?.quantity ?? 0)), 0)
            : 0;

          nextCount += count;

          if (count > 0 && !destinationChosen) {
            const restaurant = restaurants.find((item) => item.id === restaurantId);
            if (restaurant) {
              nextHref = `/restaurants/${restaurantPublicSlug(restaurant)}/checkout`;
              destinationChosen = true;
            }
          }
        }
      } catch {
        nextCount = 0;
        nextHref = "/restaurants";
      }

      setCartCount(nextCount);
      setCartHref(nextHref);
    };

    readCart();
    window.addEventListener("storage", readCart);
    window.addEventListener("focus", readCart);
    return () => {
      window.removeEventListener("storage", readCart);
      window.removeEventListener("focus", readCart);
    };
  }, [restaurants]);

  return (
    <div className="jetkiz-marketplace">
      <header className="market-figma-header">
        <div className="market-figma-header__inner">
          <Link className="market-figma-brand" href="/restaurants" aria-label="JETKIZ">
            <img src="/jetkiz-logo.svg" alt="JETKIZ" />
          </Link>

          <label className="market-figma-search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ru ? "Найти ресторан, кухню или блюдо" : "Мейрамхана немесе тағам табу"}
              autoComplete="off"
            />
          </label>

          <div className="market-figma-location" aria-label={ru ? "Город Щучинск" : "Щучинск қаласы"}>
            <LocationDot />
            <strong>Щучинск</strong>
            <span aria-hidden="true">⌄</span>
          </div>

          <button
            type="button"
            className="market-figma-lang"
            onClick={() => setLang(ru ? "kz" : "ru")}
            aria-label={ru ? "Переключить на казахский" : "Орыс тіліне ауысу"}
          >
            {ru ? "RU" : "KZ"}
          </button>

          <button
            type="button"
            className="market-figma-login"
            onClick={user ? () => { window.location.href = "/account"; } : openLogin}
            disabled={authLoading}
          >
            {authLoading ? "…" : user ? (ru ? "Профиль" : "Профиль") : ru ? "Войти" : "Кіру"}
          </button>
        </div>
      </header>

      <main className="market-figma-main">
        {promos.length > 0 && (
          <section
            className={`market-figma-promos market-figma-promos--${Math.min(promos.length, 3)}`}
            aria-label={ru ? "Акции JETKIZ" : "JETKIZ акциялары"}
          >
            {promos.map((promo) => {
              const image = apiAssetUrl(promo.imageUrl);
              const title = (ru ? promo.titleRu || promo.titleKk : promo.titleKk || promo.titleRu) || "";
              return (
                <article className="market-figma-promo market-figma-promo--cms" key={promo.id}>
                  {image ? <img className="market-figma-promo__image" src={image} alt={title || "JETKIZ"} /> : null}
                </article>
              );
            })}
          </section>
        )}

        {categories.length > 0 && (
          <nav className="market-figma-categories" aria-label={ru ? "Категории еды" : "Тағам санаттары"}>
            {categories.map((category, index) => {
              const title = ru ? category.titleRu : category.titleKk || category.titleRu;
              return (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.id)}`}
                  className={`market-figma-category${index < 4 ? " is-mobile" : ""}`}
                >
                  <span>{title}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <section className="market-figma-filters" aria-label={ru ? "Фильтры ресторанов" : "Мейрамхана сүзгілері"}>
          {hasPinnedRestaurants ? (
            <button
              type="button"
              className={filter === "home" ? "is-active" : ""}
              onClick={() => setFilter("home")}
            >
              {ru ? "На главной" : "Басты бетте"}
            </button>
          ) : null}
          <button
            type="button"
            className={filter === "all" ? "is-active" : ""}
            onClick={() => setFilter("all")}
          >
            {ru ? "Все рестораны" : "Барлық мейрамханалар"}
          </button>
          <button
            type="button"
            className={filter === "open" ? "is-active" : ""}
            onClick={() => setFilter("open")}
          >
            {ru ? "Принимают заказы" : "Тапсырыс қабылдайды"}
          </button>
        </section>

        <section className="market-figma-restaurants" aria-live="polite">
          <div className="market-figma-section-head">
            <h1>{sectionTitle}</h1>
          </div>

          {trimmedQuery ? (
            searchLoading ? (
              <div className="market-figma-empty">
                <strong>{ru ? "Ищем…" : "Іздеп жатырмыз…"}</strong>
                <p>{ru ? "Проверяем рестораны и блюда." : "Мейрамханалар мен тағамдарды тексеріп жатырмыз."}</p>
              </div>
            ) : searchFailed ? (
              <div className="market-figma-empty">
                <strong>{ru ? "Поиск временно недоступен" : "Іздеу уақытша қолжетімсіз"}</strong>
                <p>{ru ? "Попробуйте ещё раз." : "Қайта байқап көріңіз."}</p>
              </div>
            ) : searchResult &&
              searchedRestaurants.length === 0 &&
              searchedProducts.length === 0 ? (
              <div className="market-figma-empty">
                <strong>{ru ? "Ничего не нашли" : "Ештеңе табылмады"}</strong>
                <p>{ru ? "Измените запрос." : "Сұрауды өзгертіңіз."}</p>
              </div>
            ) : (
              <div className="market-search-results">
                {searchedRestaurants.length > 0 ? (
                  <div className="market-search-group">
                    <h2 className="market-search-group__title">
                      {ru ? "Рестораны" : "Мейрамханалар"}
                    </h2>
                    <div className="market-figma-grid">
                      {searchedRestaurants.map((restaurant, index) => {
                        const cover = apiAssetUrl(restaurant.coverImageUrl);
                        const isOpen = restaurant.isOpenNow === true;
                        const canAccept = restaurant.canAcceptOrders === true;
                        const publicSlug = restaurantPublicSlug(restaurant);
                        const name = ru
                          ? restaurant.nameRu || restaurant.nameKk
                          : restaurant.nameKk || restaurant.nameRu;
                        const rating = Number(restaurant.ratingAvg ?? 0);

                        return (
                          <Link
                            className="market-figma-card"
                            href={`/restaurants/${publicSlug}`}
                            key={restaurant.id}
                            onClick={() => {
                              void trackWebsiteSearchClick({
                                query: trimmedQuery,
                                searchQueryLogId: searchResult?.searchQueryLogId ?? null,
                                entityType: "restaurant",
                                entityId: restaurant.id,
                                position: index + 1,
                                metadata: {
                                  source: "website_catalog",
                                  title: name || restaurant.nameRu,
                                  restaurantId: restaurant.id,
                                  restaurantName: name || restaurant.nameRu,
                                  ratingAvg: rating,
                                  ...(restaurant.address ? { address: restaurant.address } : {}),
                                },
                              });
                            }}
                          >
                            <div className="market-figma-card__media">
                              {cover ? (
                                <img src={cover} alt={name || "JETKIZ"} loading="lazy" />
                              ) : (
                                <div className="market-figma-card__placeholder" aria-hidden="true" />
                              )}
                              <span className={canAccept ? "market-figma-open is-open" : "market-figma-open"}>
                                {canAccept
                                  ? ru ? "Принимает заказы" : "Тапсырыс қабылдайды"
                                  : isOpen
                                    ? ru ? "Не принимает заказы" : "Тапсырыс қабылдамайды"
                                    : ru ? "Закрыто" : "Жабық"}
                              </span>
                            </div>

                            <div className="market-figma-card__body">
                              <div className="market-figma-card__title">
                                <h2>{name}</h2>
                                {rating > 0 && (
                                  <span className="market-figma-rating">
                                    <b>★</b> {rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <p>{restaurant.address || "Щучинск"}</p>
                              <div className="market-figma-card__meta">
                                <span className="market-figma-time">◷&nbsp; 30–60 мин</span>
                                <span className={canAccept ? "market-figma-accept is-active" : "market-figma-accept"}>
                                  {canAccept
                                    ? ru ? "Принимает заказы" : "Тапсырыс қабылдайды"
                                    : ru ? "Недоступно" : "Қолжетімсіз"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {searchedProducts.length > 0 ? (
                  <div className="market-search-group">
                    <h2 className="market-search-group__title">
                      {ru ? "Блюда и напитки" : "Тағамдар мен сусындар"}
                    </h2>
                    <div className="market-figma-grid">
                      {searchedProducts.map((product, index) => {
                        const restaurant = restaurants.find(
                          (item) => item.id === product.restaurantId,
                        );
                        if (!restaurant) return null;

                        const href = `/restaurants/${restaurantPublicSlug(restaurant)}`;
                        const image = apiAssetUrl(
                          product.effectiveImageUrl || product.imageUrl,
                        );
                        const title = ru
                          ? product.titleRu || product.titleKk || product.title
                          : product.titleKk || product.titleRu || product.title;
                        const restaurantName = ru
                          ? restaurant.nameRu || restaurant.nameKk
                          : restaurant.nameKk || restaurant.nameRu;
                        const position = searchedRestaurants.length + index + 1;

                        return (
                          <Link
                            className="market-figma-card market-figma-card--product"
                            href={href}
                            key={product.id}
                            onClick={() => {
                              void trackWebsiteSearchClick({
                                query: trimmedQuery,
                                searchQueryLogId: searchResult?.searchQueryLogId ?? null,
                                entityType: "product",
                                entityId: product.id,
                                position,
                                metadata: {
                                  source: "website_catalog",
                                  title,
                                  productId: product.id,
                                  productTitle: title,
                                  restaurantId: product.restaurantId,
                                  restaurantName,
                                  price: product.price,
                                },
                              });
                            }}
                          >
                            <div className="market-figma-card__media">
                              {image ? (
                                <img src={image} alt={title} loading="lazy" />
                              ) : (
                                <div className="market-figma-card__placeholder" aria-hidden="true" />
                              )}
                              <span className="market-figma-open is-open">
                                {ru ? "Блюдо" : "Тағам"}
                              </span>
                            </div>
                            <div className="market-figma-card__body">
                              <div className="market-figma-card__title">
                                <h2>{title}</h2>
                              </div>
                              <p>{restaurantName}</p>
                              <div className="market-figma-card__meta">
                                <span className="market-search-product-price">
                                  {new Intl.NumberFormat("ru-KZ").format(product.price)} ₸
                                </span>
                                <span className="market-figma-accept is-active">
                                  {ru ? "Открыть ресторан" : "Мейрамхананы ашу"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          ) : filtered.length === 0 ? (
            <div className="market-figma-empty">
              <strong>{ru ? "Ничего не нашли" : "Ештеңе табылмады"}</strong>
              <p>
                {restaurants.length === 0
                  ? ru
                    ? "Список ресторанов сейчас недоступен. Обновите страницу чуть позже."
                    : "Мейрамханалар тізімі қазір қолжетімсіз. Кейінірек жаңартыңыз."
                  : ru
                    ? "Измените фильтр."
                    : "Сүзгіні өзгертіңіз."}
              </p>
            </div>
          ) : (
            <div className="market-figma-grid">
              {filtered.map((restaurant, index) => {
                const cover = apiAssetUrl(restaurant.coverImageUrl);
                const isOpen = restaurant.isOpenNow === true;
                const canAccept = restaurant.canAcceptOrders === true;
                const publicSlug = restaurantPublicSlug(restaurant);
                const name = ru
                  ? restaurant.nameRu || restaurant.nameKk
                  : restaurant.nameKk || restaurant.nameRu;
                const rating = Number(restaurant.ratingAvg ?? 0);

                return (
                  <Link
                    className="market-figma-card"
                    href={`/restaurants/${publicSlug}`}
                    key={restaurant.id}
                  >
                    <div className="market-figma-card__media">
                      {cover ? (
                        <img src={cover} alt={name || "JETKIZ"} loading="lazy" />
                      ) : (
                        <div className="market-figma-card__placeholder" aria-hidden="true" />
                      )}
                      <span className={canAccept ? "market-figma-open is-open" : "market-figma-open"}>
                        {canAccept
                          ? ru ? "Принимает заказы" : "Тапсырыс қабылдайды"
                          : isOpen
                            ? ru ? "Не принимает заказы" : "Тапсырыс қабылдамайды"
                            : ru ? "Закрыто" : "Жабық"}
                      </span>
                      <span className="market-figma-heart" aria-hidden="true">♡</span>
                    </div>

                    <div className="market-figma-card__body">
                      <div className="market-figma-card__title">
                        <h2>{name}</h2>
                        {rating > 0 && (
                          <span className="market-figma-rating">
                            <b>★</b> {rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <p>{restaurant.address || "Щучинск"}</p>

                      <div className="market-figma-card__meta">
                        <span className="market-figma-time">◷&nbsp; 30–60 мин</span>
                        <span className={canAccept ? "market-figma-accept is-active" : "market-figma-accept"}>
                          {canAccept
                            ? ru ? "Принимает заказы" : "Тапсырыс қабылдайды"
                            : isOpen
                              ? ru ? "Заказы остановлены" : "Тапсырыстар тоқтатылған"
                              : ru ? "Закрыто" : "Жабық"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {cartCount > 0 && (
        <Link className="market-floating-cart" href={cartHref} aria-label={ru ? "Открыть корзину" : "Себетті ашу"}>
          <span className="market-floating-cart__icon"><CartIcon /></span>
          <span className="market-floating-cart__badge">{cartCount > 99 ? "99+" : cartCount}</span>
        </Link>
      )}

      <nav className="market-mobile-bottom" aria-label={ru ? "Основная навигация" : "Негізгі навигация"}>
        <Link className="is-active" href="/restaurants">
          <HomeIcon />
          <span>{ru ? "Главная" : "Басты бет"}</span>
        </Link>
        <Link href="/account#favorites">
          <HeartIcon />
          <span>{ru ? "Избранное" : "Таңдаулы"}</span>
        </Link>
        <Link href="/account">
          <ProfileIcon />
          <span>{ru ? "Профиль" : "Профиль"}</span>
        </Link>
      </nav>
    </div>
  );
}
