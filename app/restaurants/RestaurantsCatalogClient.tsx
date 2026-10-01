"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useWebAuth } from "../components/WebAuthProvider";
import {
  apiAssetUrl,
  restaurantPublicSlug,
  type PublicHomeCms,
  type PublicRestaurant,
} from "../lib/jetkiz-api";

type Filter = "all" | "open";

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
}: {
  restaurants: PublicRestaurant[];
  home: PublicHomeCms;
}) {
  const { lang, setLang } = useLanguage();
  const { user, loading: authLoading, openLogin } = useWebAuth();
  const ru = lang === "ru";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartHref, setCartHref] = useState("/restaurants");

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

  const categoryRestaurantIds = useMemo(() => {
    if (!categoryId) return null;
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return null;
    return new Set(
      (category.products || [])
        .map((item) => item?.product?.restaurantId)
        .filter((value): value is string => Boolean(value)),
    );
  }, [categories, categoryId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalized ||
        [restaurant.nameRu, restaurant.nameKk, restaurant.address]
          .some((value) => String(value ?? "").toLowerCase().includes(normalized));

      if (!matchesQuery) return false;
      if (filter === "open" && restaurant.isOpenNow !== true) return false;
      if (categoryRestaurantIds && !categoryRestaurantIds.has(restaurant.id)) return false;
      return true;
    });
  }, [query, filter, restaurants, categoryRestaurantIds]);

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
              const image = apiAssetUrl(category.imageUrl);
              const title = ru ? category.titleRu : category.titleKk || category.titleRu;
              const active = categoryId === category.id;
              return (
                <button
                  type="button"
                  key={category.id}
                  className={`market-figma-category${index < 4 ? " is-mobile" : ""}${active ? " is-active" : ""}`}
                  onClick={() => setCategoryId(active ? null : category.id)}
                >
                  <span className="market-figma-category__icon" aria-hidden="true">
                    {image ? <img src={image} alt="" /> : <span>•</span>}
                  </span>
                  <span>{title}</span>
                </button>
              );
            })}
          </nav>
        )}

        <section className="market-figma-filters" aria-label={ru ? "Фильтры ресторанов" : "Мейрамхана сүзгілері"}>
          <button
            type="button"
            className={filter === "all" ? "is-active" : ""}
            onClick={() => {
              setFilter("all");
              setCategoryId(null);
            }}
          >
            {ru ? "Все рестораны" : "Барлық мейрамханалар"}
          </button>
          <button
            type="button"
            className={filter === "open" ? "is-active" : ""}
            onClick={() => setFilter("open")}
          >
            {ru ? "Открыто сейчас" : "Қазір ашық"}
          </button>
        </section>

        <section className="market-figma-restaurants" aria-live="polite">
          <div className="market-figma-section-head">
            <h1>{ru ? "Популярные рестораны" : "Танымал мейрамханалар"}</h1>
          </div>

          {filtered.length === 0 ? (
            <div className="market-figma-empty">
              <strong>{ru ? "Ничего не нашли" : "Ештеңе табылмады"}</strong>
              <p>
                {restaurants.length === 0
                  ? ru
                    ? "Список ресторанов сейчас недоступен. Обновите страницу чуть позже."
                    : "Мейрамханалар тізімі қазір қолжетімсіз. Кейінірек жаңартыңыз."
                  : ru
                    ? "Измените запрос, категорию или фильтр."
                    : "Сұрауды, санатты немесе сүзгіні өзгертіңіз."}
              </p>
            </div>
          ) : (
            <div className="market-figma-grid">
              {filtered.map((restaurant) => {
                const cover = apiAssetUrl(restaurant.coverImageUrl);
                const isOpen = restaurant.isOpenNow === true;
                const canAccept = restaurant.canAcceptOrders === true;
                const publicSlug = restaurantPublicSlug(restaurant);
                const name = ru
                  ? restaurant.nameRu || restaurant.nameKk
                  : restaurant.nameKk || restaurant.nameRu;
                const rating = Number(restaurant.ratingAvg ?? 0);

                return (
                  <Link className="market-figma-card" href={`/restaurants/${publicSlug}`} key={restaurant.id}>
                    <div className="market-figma-card__media">
                      {cover ? (
                        <img src={cover} alt={name || "JETKIZ"} loading="lazy" />
                      ) : (
                        <div className="market-figma-card__placeholder" aria-hidden="true" />
                      )}
                      <span className={isOpen ? "market-figma-open is-open" : "market-figma-open"}>
                        {isOpen ? (ru ? "Открыто" : "Ашық") : ru ? "Закрыто" : "Жабық"}
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
                            : ru ? "Меню доступно" : "Мәзір қолжетімді"}
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
