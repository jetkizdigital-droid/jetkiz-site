"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useWebAuth } from "../components/WebAuthProvider";
import { apiAssetUrl, restaurantPublicSlug, type PublicRestaurant } from "../lib/jetkiz-api";

type Filter = "all" | "delivery" | "pickup" | "open" | "rating" | "promo";

const categories = [
  { slug: "burgers", ru: "Бургеры", kz: "Бургерлер", icon: "🍔", mobile: true },
  { slug: "pizza", ru: "Пицца", kz: "Пицца", icon: "🍕", mobile: true },
  { slug: "sushi", ru: "Суши", kz: "Суши", icon: "🍣", mobile: false },
  { slug: "doner", ru: "Донер", kz: "Донер", icon: "🌯", mobile: true },
  { slug: "shashlik", ru: "Шашлык", kz: "Кәуап", icon: "🍢", mobile: false },
  { slug: "desserts", ru: "Десерты", kz: "Десерттер", icon: "🍰", mobile: true },
  { slug: "coffee", ru: "Кофе", kz: "Кофе", icon: "☕", mobile: false },
  { slug: "breakfasts", ru: "Завтраки", kz: "Таңғы ас", icon: "🍳", mobile: false },
] as const;

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
      <path d="M3 4h2l2 11h10l2-7H7" />
      <circle cx="9" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </svg>
  );
}

function LocationDot() {
  return <span className="market-location-dot" aria-hidden="true" />;
}

export function RestaurantsCatalogClient({ restaurants }: { restaurants: PublicRestaurant[] }) {
  const { lang, setLang } = useLanguage();
  const { user, loading: authLoading, openLogin } = useWebAuth();
  const ru = lang === "ru";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cartCount, setCartCount] = useState(0);
  const [cartHref, setCartHref] = useState("/restaurants");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const rows = restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalized ||
        [restaurant.nameRu, restaurant.nameKk, restaurant.address]
          .some((value) => String(value ?? "").toLowerCase().includes(normalized));

      if (!matchesQuery) return false;
      if (filter === "open") return restaurant.isOpenNow === true;
      if (filter === "pickup") return restaurant.isPickupEnabled === true;
      return true;
    });

    if (filter === "rating") {
      return [...rows].sort(
        (left, right) => Number(right.ratingAvg ?? 0) - Number(left.ratingAvg ?? 0),
      );
    }

    return rows;
  }, [query, filter, restaurants]);

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

  const resetCatalog = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <div className="jetkiz-marketplace">
      <header className="market-figma-header">
        <div className="market-figma-header__inner">
          <Link className="market-figma-brand" href="/restaurants" aria-label="JETKIZ">
            jetkiz
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
        <section className="market-figma-promos" aria-label={ru ? "Предложения JETKIZ" : "JETKIZ ұсыныстары"}>
          <article className="market-figma-promo market-figma-promo--green">
            <div className="market-figma-promo__visual market-figma-promo__visual--feast" />
          </article>
          <article className="market-figma-promo market-figma-promo--yellow">
            <div className="market-figma-promo__visual market-figma-promo__visual--table" />
          </article>
          <article className="market-figma-promo market-figma-promo--orange">
            <div className="market-figma-promo__visual market-figma-promo__visual--burabay" />
          </article>
        </section>

        <nav className="market-figma-categories" aria-label={ru ? "Категории еды" : "Тағам санаттары"}>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shchuchinsk/${category.slug}`}
              className={category.mobile ? "market-figma-category is-mobile" : "market-figma-category"}
            >
              <span className="market-figma-category__icon" aria-hidden="true">{category.icon}</span>
              <span>{ru ? category.ru : category.kz}</span>
            </Link>
          ))}
        </nav>

        <section className="market-figma-filters" aria-label={ru ? "Фильтры ресторанов" : "Мейрамхана сүзгілері"}>
          {([
            ["all", ru ? "Все рестораны" : "Барлық мейрамханалар"],
            ["delivery", ru ? "Доставка" : "Жеткізу"],
            ["pickup", ru ? "Самовывоз" : "Алып кету"],
            ["open", ru ? "Открыто сейчас" : "Қазір ашық"],
            ["rating", ru ? "Рейтинг" : "Рейтинг"],
            ["promo", ru ? "Акции" : "Акциялар"],
          ] as Array<[Filter, string]>).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? "is-active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </section>

        <section className="market-figma-restaurants" aria-live="polite">
          <div className="market-figma-section-head">
            <h1>{ru ? "Популярные рестораны" : "Танымал мейрамханалар"}</h1>
            <button type="button" onClick={resetCatalog}>
              {ru ? "Смотреть все" : "Барлығын көру"} <span aria-hidden="true">→</span>
            </button>
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
                    ? "Измените запрос или выберите другой фильтр."
                    : "Сұрауды немесе сүзгіні өзгертіңіз."}
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

          <h2 className="market-figma-nearby">{ru ? "Рядом с вами" : "Жаныңызда"}</h2>
        </section>
      </main>

      <Link className="market-floating-cart" href={cartHref} aria-label={ru ? "Открыть корзину" : "Себетті ашу"}>
        <span className="market-floating-cart__icon"><CartIcon /></span>
        {cartCount > 0 && <span className="market-floating-cart__badge">{cartCount > 99 ? "99+" : cartCount}</span>}
      </Link>

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
