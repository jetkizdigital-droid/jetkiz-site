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
  const cartKey = `jetkiz-cart:${restaurant.id}`;
  const publicSlug = restaurantPublicSlug(restaurant);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey);
      setCart(raw ? (JSON.parse(raw) as CartLine[]) : []);
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
      // Keep the in-memory cart if storage is unavailable.
    }
  }, [cart, cartKey, cartLoaded]);

  const categories = menu.categories ?? [];
  const items = menu.items ?? menu.products ?? [];
  const visibleItems = useMemo(
    () =>
      activeCategory === "all"
        ? items
        : items.filter((item) => item.categoryId === activeCategory),
    [activeCategory, items],
  );

  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const cover = apiAssetUrl(restaurant.coverImageUrl);
  const description = ru
    ? restaurant.descriptionRu || restaurant.descriptionKk
    : restaurant.descriptionKk || restaurant.descriptionRu;

  const quantityFor = (productId: string) =>
    cart.find((line) => line.productId === productId)?.quantity ?? 0;

  const changeQuantity = (item: PublicMenuItem, delta: number) => {
    if (!item.isAvailable) return;

    setCart((current) => {
      const existing = current.find((line) => line.productId === item.id);
      const nextQuantity = Math.max(0, (existing?.quantity ?? 0) + delta);

      if (nextQuantity === 0) {
        return current.filter((line) => line.productId !== item.id);
      }

      if (existing) {
        return current.map((line) =>
          line.productId === item.id
            ? { ...line, quantity: nextQuantity, price: item.price }
            : line,
        );
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

  const changeCartLine = (line: CartLine, delta: number) => {
    const item = items.find((candidate) => candidate.id === line.productId);
    if (item) changeQuantity(item, delta);
  };

  const restaurantName = ru
    ? restaurant.nameRu || restaurant.nameKk
    : restaurant.nameKk || restaurant.nameRu;

  return (
    <div className="restaurant-marketplace-page">
      <section className="restaurant-summary">
        <div className="restaurant-summary__media">
          {cover ? (
            <img src={cover} alt={restaurantName || "JETKIZ"} />
          ) : (
            <div className="restaurant-summary__placeholder">
              <img src="/jetkiz-logo.svg" alt="" />
            </div>
          )}
        </div>
        <div className="restaurant-summary__content">
          <Link className="restaurant-back-compact" href="/restaurants">
            ← {ru ? "Все рестораны" : "Барлық мейрамханалар"}
          </Link>
          <div className="restaurant-summary__title-row">
            <div>
              <h1>{restaurantName}</h1>
              <p>{restaurant.address || "Щучинск"}</p>
            </div>
            {Number(restaurant.ratingCount ?? 0) > 0 && (
              <span className="restaurant-summary__rating">
                ★ {Number(restaurant.ratingAvg ?? 0).toFixed(1)}
              </span>
            )}
          </div>
          <div className="restaurant-summary__badges">
            <span className={restaurant.isOpenNow ? "is-open" : ""}>
              {restaurant.isOpenNow
                ? ru ? "Открыто" : "Ашық"
                : ru ? "Закрыто" : "Жабық"}
            </span>
            {restaurant.workingHours && <span>{restaurant.workingHours}</span>}
            {restaurant.isPickupEnabled && (
              <span>{ru ? "Самовывоз" : "Алып кету"}</span>
            )}
          </div>
          {description && <p className="restaurant-summary__description">{description}</p>}
        </div>
      </section>

      <section className="menu-marketplace-layout">
        <aside className="menu-sidebar" aria-label={ru ? "Категории" : "Санаттар"}>
          <strong>{ru ? "Меню" : "Мәзір"}</strong>
          <button
            className={activeCategory === "all" ? "is-active" : ""}
            onClick={() => setActiveCategory("all")}
          >
            {ru ? "Все" : "Барлығы"}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "is-active" : ""}
              onClick={() => setActiveCategory(category.id)}
            >
              {ru ? category.titleRu : category.titleKk || category.titleRu}
            </button>
          ))}
        </aside>

        <div className="menu-products-column">
          <div className="menu-products-heading">
            <h2>
              {activeCategory === "all"
                ? ru ? "Все блюда" : "Барлық тағамдар"
                : ru
                  ? categories.find((category) => category.id === activeCategory)?.titleRu
                  : categories.find((category) => category.id === activeCategory)?.titleKk ||
                    categories.find((category) => category.id === activeCategory)?.titleRu}
            </h2>
            <span>{visibleItems.length}</span>
          </div>

          <div className="menu-mobile-categories" role="tablist">
            <button
              className={activeCategory === "all" ? "is-active" : ""}
              onClick={() => setActiveCategory("all")}
            >
              {ru ? "Все" : "Барлығы"}
            </button>
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
            <div className="marketplace-empty marketplace-empty--compact">
              <strong>{ru ? "В этой категории пока пусто" : "Бұл санат әзірге бос"}</strong>
            </div>
          ) : (
            <div className="menu-grid-compact">
              {visibleItems.map((item) => {
                const quantity = quantityFor(item.id);
                const image = apiAssetUrl(item.imageUrl);
                const title = ru ? item.titleRu : item.titleKk || item.titleRu;
                const subtitle = item.weight || item.description || item.composition;

                return (
                  <article className={item.isAvailable ? "menu-product-card" : "menu-product-card is-unavailable"} key={item.id}>
                    <div className="menu-product-card__image">
                      {image ? (
                        <img src={image} alt={title} loading="lazy" />
                      ) : (
                        <div className="menu-product-card__placeholder">
                          <img src="/jetkiz-logo.svg" alt="" />
                        </div>
                      )}
                    </div>
                    <div className="menu-product-card__body">
                      <strong className="menu-product-card__price">{formatKzt(item.price)}</strong>
                      <h3>{title}</h3>
                      {subtitle && <p>{subtitle}</p>}
                      {!item.isAvailable ? (
                        <button className="menu-product-card__disabled" disabled>
                          {ru ? "Нет в наличии" : "Қолжетімсіз"}
                        </button>
                      ) : quantity === 0 ? (
                        <button className="menu-product-card__add" onClick={() => changeQuantity(item, 1)}>
                          + {ru ? "Добавить" : "Қосу"}
                        </button>
                      ) : (
                        <div className="menu-product-card__qty">
                          <button onClick={() => changeQuantity(item, -1)}>−</button>
                          <span>{quantity}</span>
                          <button onClick={() => changeQuantity(item, 1)}>+</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="menu-cart">
          <div className="menu-cart__head">
            <h2>{ru ? "Корзина" : "Себет"}</h2>
            {totalCount > 0 && <span>{totalCount}</span>}
          </div>

          {cart.length === 0 ? (
            <div className="menu-cart__empty">
              <div>+</div>
              <strong>{ru ? "Корзина пока пуста" : "Себет әзірге бос"}</strong>
              <p>{ru ? "Добавьте блюда из меню" : "Мәзірден тағам қосыңыз"}</p>
            </div>
          ) : (
            <>
              <div className="menu-cart__lines">
                {cart.map((line) => (
                  <div className="menu-cart__line" key={line.productId}>
                    <div>
                      <strong>{ru ? line.titleRu : line.titleKk || line.titleRu}</strong>
                      <span>{formatKzt(line.price * line.quantity)}</span>
                    </div>
                    <div className="menu-cart__line-qty">
                      <button onClick={() => changeCartLine(line, -1)}>−</button>
                      <span>{line.quantity}</span>
                      <button onClick={() => changeCartLine(line, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="menu-cart__total">
                <span>{ru ? "Итого" : "Барлығы"}</span>
                <strong>{formatKzt(totalPrice)}</strong>
              </div>

              {restaurant.canAcceptOrders ? (
                <Link className="menu-cart__checkout" href={`/restaurants/${publicSlug}/checkout`}>
                  {ru ? "Перейти к оформлению" : "Рәсімдеуге өту"}
                </Link>
              ) : (
                <button className="menu-cart__checkout is-disabled" disabled>
                  {ru ? "Ресторан не принимает заказы" : "Мейрамхана тапсырыс қабылдамайды"}
                </button>
              )}
            </>
          )}
        </aside>
      </section>

      {totalCount > 0 && (
        <div className="mobile-cart-bar">
          <div>
            <small>{totalCount} {ru ? "поз." : "позиция"}</small>
            <strong>{formatKzt(totalPrice)}</strong>
          </div>
          {restaurant.canAcceptOrders ? (
            <Link href={`/restaurants/${publicSlug}/checkout`}>{ru ? "Корзина" : "Себет"} →</Link>
          ) : (
            <span>{ru ? "Закрыто" : "Жабық"}</span>
          )}
        </div>
      )}
    </div>
  );
}
