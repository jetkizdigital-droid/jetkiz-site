"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import {
  apiAssetUrl,
  formatKzt,
  restaurantPublicSlug,
  type PublicMenu,
  type PublicMenuItem,
  type PublicRestaurant,
} from "../../lib/jetkiz-api";

type CartLine = {
  productId: string;
  titleRu: string;
  titleKk?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export function RestaurantMenuClient({
  restaurant,
  menu,
}: {
  restaurant: PublicRestaurant;
  menu: PublicMenu;
}) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const cartKey = `jetkiz-demo-cart:${restaurant.id}`;
  const publicSlug = restaurantPublicSlug(restaurant);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey);
      setCart(raw ? JSON.parse(raw) as CartLine[] : []);
    } catch {
      setCart([]);
    } finally {
      setCartLoaded(true);
    }
  }, [cartKey]);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      window.localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {
      // Cart remains usable for the current tab even if storage is unavailable.
    }
  }, [cart, cartKey, cartLoaded]);

  const categories = menu.categories ?? [];
  const items = menu.items ?? menu.products ?? [];
  const visibleItems = useMemo(
    () => activeCategory === "all" ? items : items.filter((item) => item.categoryId === activeCategory),
    [activeCategory, items],
  );

  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const cover = apiAssetUrl(restaurant.coverImageUrl);
  const description = ru
    ? restaurant.descriptionRu || restaurant.descriptionKk
    : restaurant.descriptionKk || restaurant.descriptionRu;

  const quantityFor = (productId: string) => cart.find((line) => line.productId === productId)?.quantity ?? 0;

  const changeQuantity = (item: PublicMenuItem, delta: number) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === item.id);
      const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);
      if (nextQuantity === 0) return current.filter((line) => line.productId !== item.id);
      if (existing) {
        return current.map((line) => line.productId === item.id ? { ...line, quantity: nextQuantity, price: item.price } : line);
      }
      return [
        ...current,
        {
          productId: item.id,
          titleRu: item.titleRu,
          titleKk: item.titleKk,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      ];
    });
  };

  return (
    <>
      <section className="restaurant-profile">
        <div className="restaurant-profile__cover">
          {cover ? <img src={cover} alt={restaurant.nameRu} /> : <div className="restaurant-profile__placeholder">JETKIZ</div>}
          <div className="restaurant-profile__shade" />
        </div>
        <div className="restaurant-profile__content">
          <Link className="restaurant-back" href="/restaurants">← {ru ? "Все рестораны" : "Барлық мейрамханалар"}</Link>
          <div className="restaurant-profile__status-row">
            <span className={restaurant.isOpenNow ? "restaurant-state is-open" : "restaurant-state"}>
              {restaurant.isOpenNow ? (ru ? "Открыто" : "Ашық") : ru ? "Закрыто" : "Жабық"}
            </span>
            {Number(restaurant.ratingCount ?? 0) > 0 && <span className="restaurant-rating">★ {Number(restaurant.ratingAvg ?? 0).toFixed(1)} · {restaurant.ratingCount}</span>}
          </div>
          <h1>{restaurant.nameRu || restaurant.nameKk}</h1>
          {description && <p className="restaurant-profile__description">{description}</p>}
          <div className="restaurant-profile__facts">
            <span><small>{ru ? "Адрес" : "Мекенжай"}</small>{restaurant.address || "Щучинск"}</span>
            <span><small>{ru ? "График" : "Кесте"}</small>{restaurant.workingHours || (ru ? "Уточняется" : "Нақтылануда")}</span>
            <span><small>{ru ? "Получение" : "Алу тәсілі"}</small>{ru ? "Самовывоз" : "Алып кету"}</span>
          </div>
        </div>
      </section>

      <section className="menu-shell section-pad">
        <div className="menu-heading">
          <div>
            <span className="kicker">JETKIZ MENU</span>
            <h2>{ru ? "Меню" : "Мәзір"}</h2>
          </div>
          <p>
            {restaurant.canAcceptOrders
              ? ru ? "Ресторан сейчас принимает заказы. На сайте доступен демонстрационный сценарий самовывоза." : "Мейрамхана қазір тапсырыс қабылдайды. Сайтта алып кетудің демонстрациялық сценарийі қолжетімді."
              : ru ? "Сейчас ресторан не принимает реальные заказы, но меню и демонстрационное оформление доступны." : "Қазір мейрамхана нақты тапсырыс қабылдамайды, бірақ мәзір мен демонстрациялық рәсімдеу қолжетімді."}
          </p>
        </div>

        <div className="menu-categories" role="tablist" aria-label={ru ? "Категории меню" : "Мәзір санаттары"}>
          <button className={activeCategory === "all" ? "is-active" : ""} onClick={() => setActiveCategory("all")}>{ru ? "Все" : "Барлығы"}</button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "is-active" : ""}
              onClick={() => setActiveCategory(category.id)}
            >
              {ru ? category.titleRu : category.titleKk || category.titleRu}
            </button>
          ))}
        </div>

        {visibleItems.length === 0 ? (
          <div className="marketplace-empty"><strong>{ru ? "В этой категории пока пусто" : "Бұл санат әзірге бос"}</strong></div>
        ) : (
          <div className="menu-grid">
            {visibleItems.map((item) => {
              const quantity = quantityFor(item.id);
              const image = apiAssetUrl(item.imageUrl);
              const title = ru ? item.titleRu : item.titleKk || item.titleRu;
              return (
                <article className="menu-card" key={item.id}>
                  <div className="menu-card__media">
                    {image ? <img src={image} alt={title} loading="lazy" /> : <div className="menu-card__placeholder">JETKIZ</div>}
                  </div>
                  <div className="menu-card__body">
                    <div>
                      <h3>{title}</h3>
                      {(item.description || item.composition) && <p>{item.description || item.composition}</p>}
                      {item.weight && <small>{item.weight}</small>}
                    </div>
                    <div className="menu-card__bottom">
                      <strong>{formatKzt(item.price)}</strong>
                      {quantity === 0 ? (
                        <button onClick={() => changeQuantity(item, 1)} aria-label={`${ru ? "Добавить" : "Қосу"} ${title}`}>+</button>
                      ) : (
                        <div className="quantity-control">
                          <button onClick={() => changeQuantity(item, -1)} aria-label={ru ? "Уменьшить" : "Азайту"}>−</button>
                          <span>{quantity}</span>
                          <button onClick={() => changeQuantity(item, 1)} aria-label={ru ? "Добавить" : "Қосу"}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {totalCount > 0 && (
        <div className="mobile-cart-bar">
          <div><small>{totalCount} {ru ? "поз." : "позиция"}</small><strong>{formatKzt(totalPrice)}</strong></div>
          <Link href={`/restaurants/${publicSlug}/checkout`}>{ru ? "Корзина" : "Себет"} →</Link>
        </div>
      )}
    </>
  );
}
