"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { apiAssetUrl, restaurantPublicSlug, type PublicRestaurant } from "../lib/jetkiz-api";

export function RestaurantsCatalogClient({ restaurants }: { restaurants: PublicRestaurant[] }) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const ru = lang === "ru";

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return restaurants;
    return restaurants.filter((restaurant) => {
      const values = [restaurant.nameRu, restaurant.nameKk, restaurant.address];
      return values.some((value) => String(value ?? "").toLowerCase().includes(normalized));
    });
  }, [query, restaurants]);

  return (
    <>
      <section className="marketplace-hero">
        <div className="marketplace-hero__copy">
          <span className="kicker">JETKIZ · ЩУЧИНСК</span>
          <h1>{ru ? "Рестораны Щучинска" : "Щучинск мейрамханалары"}</h1>
          <p>
            {ru
              ? "Реальные меню, актуальные цены и заказ на самовывоз в одном месте."
              : "Нақты мәзірлер, өзекті бағалар және алып кетуге тапсырыс — бәрі бір жерде."}
          </p>
        </div>
        <div className="marketplace-search">
          <label htmlFor="restaurant-search">{ru ? "Найти ресторан" : "Мейрамхана табу"}</label>
          <input
            id="restaurant-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ru ? "Название или адрес" : "Атауы немесе мекенжайы"}
            autoComplete="off"
          />
        </div>
      </section>

      <section className="restaurant-catalog section-pad" aria-live="polite">
        <div className="restaurant-catalog__heading">
          <div>
            <span>{String(filtered.length).padStart(2, "0")}</span>
            <h2>{ru ? "Доступные рестораны" : "Қолжетімді мейрамханалар"}</h2>
          </div>
          <p>
            {ru
              ? "Статус и график приходят напрямую из JETKIZ. Закрытый ресторан можно посмотреть, но реальный приём заказов зависит от его текущего режима."
              : "Күйі мен жұмыс кестесі JETKIZ жүйесінен тікелей келеді. Жабық мейрамхананың мәзірін көруге болады, ал нақты тапсырыс қабылдау оның ағымдағы режиміне байланысты."}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="marketplace-empty">
            <strong>{ru ? "Рестораны не найдены" : "Мейрамханалар табылмады"}</strong>
            <p>
              {restaurants.length === 0
                ? ru
                  ? "Публичный список ресторанов сейчас недоступен. Попробуйте обновить страницу позже."
                  : "Мейрамханалардың ашық тізімі қазір қолжетімсіз. Бетті кейінірек жаңартып көріңіз."
                : ru
                  ? "Попробуйте другой запрос."
                  : "Басқа сұрау енгізіп көріңіз."}
            </p>
          </div>
        ) : (
          <div className="restaurant-grid">
            {filtered.map((restaurant) => {
              const cover = apiAssetUrl(restaurant.coverImageUrl);
              const isOpen = restaurant.isOpenNow === true;
              const canAccept = restaurant.canAcceptOrders === true;
              const publicSlug = restaurantPublicSlug(restaurant);
              return (
                <Link className="restaurant-card" href={`/restaurants/${publicSlug}`} key={restaurant.id}>
                  <div className="restaurant-card__media">
                    {cover ? <img src={cover} alt={restaurant.nameRu} loading="lazy" /> : <div className="restaurant-card__placeholder">JETKIZ</div>}
                    <span className={isOpen ? "restaurant-state is-open" : "restaurant-state"}>
                      {isOpen ? (ru ? "Открыто" : "Ашық") : ru ? "Закрыто" : "Жабық"}
                    </span>
                  </div>
                  <div className="restaurant-card__body">
                    <div className="restaurant-card__topline">
                      <h3>{restaurant.nameRu || restaurant.nameKk}</h3>
                      {Number(restaurant.ratingCount ?? 0) > 0 && (
                        <span>★ {Number(restaurant.ratingAvg ?? 0).toFixed(1)}</span>
                      )}
                    </div>
                    <p>{restaurant.address || "Щучинск"}</p>
                    <div className="restaurant-card__meta">
                      <span>{restaurant.workingHours || (ru ? "График уточняется" : "Кесте нақтылануда")}</span>
                      <span>{canAccept ? (ru ? "Принимает заказы" : "Тапсырыс қабылдайды") : ru ? "Меню доступно" : "Мәзір қолжетімді"}</span>
                    </div>
                    <strong className="restaurant-card__action">{ru ? "Открыть меню →" : "Мәзірді ашу →"}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
