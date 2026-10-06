"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { apiAssetUrl, formatKzt } from "../../lib/jetkiz-api";

export type CategoryClientItem = {
  id: string;
  titleRu: string;
  titleKk?: string | null;
  price: number;
  imageUrl?: string | null;
  description?: string | null;
  weight?: string | null;
};

export type CategoryClientRestaurant = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk?: string | null;
  address?: string | null;
};

export type CategoryClientGroup = {
  restaurant: CategoryClientRestaurant;
  items: CategoryClientItem[];
};

export type CategoryClientTab = {
  id: string;
  titleRu: string;
  titleKk?: string | null;
};

export function CategoryProductsClient({
  category,
  categories,
  groups,
}: {
  category: CategoryClientTab;
  categories: CategoryClientTab[];
  groups: CategoryClientGroup[];
}) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  const restaurants = useMemo(
    () =>
      groups.map((group) => ({
        id: group.restaurant.id,
        name: ru
          ? group.restaurant.nameRu || group.restaurant.nameKk || "Ресторан"
          : group.restaurant.nameKk || group.restaurant.nameRu || "Мейрамхана",
        count: group.items.length,
      })),
    [groups, ru],
  );

  const visibleGroups = useMemo(
    () =>
      selectedRestaurantId
        ? groups.filter((group) => group.restaurant.id === selectedRestaurantId)
        : groups,
    [groups, selectedRestaurantId],
  );

  const totalItems = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);
  const categoryTitle = ru ? category.titleRu : category.titleKk || category.titleRu;

  return (
    <main className="app-category-page">
      <div className="app-category-page__head">
        <div>
          <Link href="/restaurants" className="app-category-back">
            ← {ru ? "Назад" : "Артқа"}
          </Link>
          <h1>{categoryTitle}</h1>
          <p>
            {selectedRestaurantId
              ? ru
                ? `${totalItems} позиций из выбранного ресторана`
                : `Таңдалған мейрамханадан ${totalItems} позиция`
              : ru
                ? `${totalItems} позиций из ${groups.length} ресторанов`
                : `${groups.length} мейрамханадан ${totalItems} позиция`}
          </p>
        </div>

        <label className="app-category-filter">
          <span>{ru ? "Ресторан" : "Мейрамхана"}</span>
          <select
            value={selectedRestaurantId}
            onChange={(event) => setSelectedRestaurantId(event.target.value)}
          >
            <option value="">{ru ? "Все рестораны" : "Барлық мейрамханалар"}</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} · {restaurant.count}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="app-category-tabs" aria-label={ru ? "Категории" : "Санаттар"}>
        {categories.map((item) => (
          <Link
            key={item.id}
            className={item.id === category.id ? "is-active" : ""}
            href={`/categories/${encodeURIComponent(item.id)}`}
          >
            {ru ? item.titleRu : item.titleKk || item.titleRu}
          </Link>
        ))}
      </nav>

      {restaurants.length > 1 ? (
        <div
          className="app-category-restaurant-chips"
          aria-label={ru ? "Фильтр по ресторанам" : "Мейрамхана сүзгісі"}
        >
          <button
            type="button"
            className={selectedRestaurantId === "" ? "is-active" : ""}
            onClick={() => setSelectedRestaurantId("")}
          >
            {ru ? "Все рестораны" : "Барлық мейрамханалар"}
          </button>
          {restaurants.map((restaurant) => (
            <button
              type="button"
              key={restaurant.id}
              className={selectedRestaurantId === restaurant.id ? "is-active" : ""}
              onClick={() => setSelectedRestaurantId(restaurant.id)}
            >
              {restaurant.name}
              <span>{restaurant.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {visibleGroups.length === 0 ? (
        <div className="app-category-empty">
          <strong>{ru ? "Нет доступных блюд" : "Қолжетімді тағамдар жоқ"}</strong>
          <p>
            {ru
              ? "В этой категории сейчас нет блюд из ресторанов, принимающих заказы."
              : "Бұл санатта қазір тапсырыс қабылдайтын мейрамханалардың тағамдары жоқ."}
          </p>
        </div>
      ) : (
        <div className="app-category-groups">
          {visibleGroups.map((group) => {
            const restaurantName = ru
              ? group.restaurant.nameRu || group.restaurant.nameKk || "Ресторан"
              : group.restaurant.nameKk || group.restaurant.nameRu || "Мейрамхана";

            return (
              <section className="app-category-group" key={group.restaurant.id}>
                <div className="app-category-group__head">
                  <div>
                    <Link href={`/restaurants/${group.restaurant.slug}`}>{restaurantName}</Link>
                    {group.restaurant.address ? <p>{group.restaurant.address}</p> : null}
                  </div>
                  <Link
                    className="app-category-group__menu"
                    href={`/restaurants/${group.restaurant.slug}`}
                  >
                    {ru ? "Открыть меню" : "Мәзірді ашу"} →
                  </Link>
                </div>

                <div className="app-category-grid">
                  {group.items.map((item) => {
                    const title = ru ? item.titleRu : item.titleKk || item.titleRu;
                    const image = apiAssetUrl(item.imageUrl);

                    return (
                      <article className="app-category-product" key={item.id}>
                        <Link
                          className="app-category-product__image"
                          href={`/restaurants/${group.restaurant.slug}`}
                        >
                          {image ? (
                            <img src={image} alt={title} loading="lazy" />
                          ) : (
                            <span className="app-category-product__placeholder">
                              <img src="/jetkiz-logo.svg" alt="" />
                            </span>
                          )}
                        </Link>
                        <div className="app-category-product__body">
                          <h2>{title}</h2>
                          <strong>{formatKzt(item.price)}</strong>
                          {item.description ? <p>{item.description}</p> : null}
                          {item.weight ? <small>{item.weight}</small> : null}
                          <Link href={`/restaurants/${group.restaurant.slug}`}>
                            {ru ? "В ресторан" : "Мейрамханаға"}
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
