"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { apiAssetUrl, restaurantPublicSlug, type PublicRestaurant } from "../lib/jetkiz-api";

type Filter = "all" | "open" | "pickup";

export function RestaurantsCatalogClient({ restaurants }: { restaurants: PublicRestaurant[] }) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const ru = lang === "ru";

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesQuery =
        !normalized ||
        [restaurant.nameRu, restaurant.nameKk, restaurant.address]
          .some((value) => String(value ?? "").toLowerCase().includes(normalized));

      const matchesFilter =
        filter === "all" ||
        (filter === "open" && restaurant.isOpenNow === true) ||
        (filter === "pickup" && restaurant.isPickupEnabled === true);

      return matchesQuery && matchesFilter;
    });
  }, [query, filter, restaurants]);

  return (
    <div className="marketplace-page">
      <section className="marketplace-intro">
        <div>
          <p className="marketplace-eyebrow">JETKIZ · ЩУЧИНСК</p>
          <h1>{ru ? "Доставка еды в Щучинске" : "Щучинскіде тамақ жеткізу"}</h1>
          <p className="marketplace-subtitle">
            {ru
              ? "Рестораны города, актуальные меню и цены. Заказывайте онлайн — быстро и без лишних экранов."
              : "Қала мейрамханалары, өзекті мәзірлер мен бағалар. Онлайн тапсырыс беріңіз — тез әрі артық қадамсыз."}
          </p>
        </div>
        <div className="marketplace-city">
          <span>{ru ? "Город" : "Қала"}</span>
          <strong>Щучинск</strong>
        </div>
      </section>

      <section className="marketplace-toolbar" aria-label={ru ? "Поиск и фильтры" : "Іздеу және сүзгілер"}>
        <div className="marketplace-searchbox">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ru ? "Найти ресторан" : "Мейрамхана табу"}
            autoComplete="off"
          />
        </div>
        <div className="marketplace-filters">
          <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>
            {ru ? "Все" : "Барлығы"}
          </button>
          <button className={filter === "open" ? "is-active" : ""} onClick={() => setFilter("open")}>
            {ru ? "Открыто сейчас" : "Қазір ашық"}
          </button>
          <button className={filter === "pickup" ? "is-active" : ""} onClick={() => setFilter("pickup")}>
            {ru ? "Самовывоз" : "Алып кету"}
          </button>
        </div>
      </section>

      <section className="restaurant-catalog-compact" aria-live="polite">
        <div className="restaurant-section-title">
          <h2>{ru ? "Рестораны" : "Мейрамханалар"}</h2>
          <span>{filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="marketplace-empty marketplace-empty--compact">
            <strong>{ru ? "Ничего не нашли" : "Ештеңе табылмады"}</strong>
            <p>
              {restaurants.length === 0
                ? ru
                  ? "Список ресторанов сейчас недоступен. Обновите страницу чуть позже."
                  : "Мейрамханалар тізімі қазір қолжетімсіз. Бетті сәл кейінірек жаңартыңыз."
                : ru
                  ? "Попробуйте изменить запрос или фильтр."
                  : "Сұрауды немесе сүзгіні өзгертіп көріңіз."}
            </p>
          </div>
        ) : (
          <div className="restaurant-grid-compact">
            {filtered.map((restaurant) => {
              const cover = apiAssetUrl(restaurant.coverImageUrl);
              const isOpen = restaurant.isOpenNow === true;
              const canAccept = restaurant.canAcceptOrders === true;
              const publicSlug = restaurantPublicSlug(restaurant);
              const name = ru
                ? restaurant.nameRu || restaurant.nameKk
                : restaurant.nameKk || restaurant.nameRu;

              return (
                <Link className="restaurant-tile" href={`/restaurants/${publicSlug}`} key={restaurant.id}>
                  <div className="restaurant-tile__media">
                    {cover ? (
                      <img src={cover} alt={name || "JETKIZ"} loading="lazy" />
                    ) : (
                      <div className="restaurant-tile__placeholder">
                        <img src="/jetkiz-logo.svg" alt="" />
                      </div>
                    )}
                    <span className={isOpen ? "restaurant-open-badge is-open" : "restaurant-open-badge"}>
                      {isOpen ? (ru ? "Открыто" : "Ашық") : ru ? "Закрыто" : "Жабық"}
                    </span>
                  </div>

                  <div className="restaurant-tile__body">
                    <div className="restaurant-tile__name-row">
                      <h3>{name}</h3>
                      {Number(restaurant.ratingCount ?? 0) > 0 && (
                        <span className="restaurant-tile__rating">
                          ★ {Number(restaurant.ratingAvg ?? 0).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p>{restaurant.address || "Щучинск"}</p>
                    <div className="restaurant-tile__meta">
                      {restaurant.workingHours && <span>{restaurant.workingHours}</span>}
                      <span>
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
    </div>
  );
}
