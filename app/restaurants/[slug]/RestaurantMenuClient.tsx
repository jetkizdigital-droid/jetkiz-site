"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { useWebAuth } from "../../components/WebAuthProvider";
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 4.5h2.5l1.55 9.1a2.15 2.15 0 0 0 2.12 1.8h7.45a2.15 2.15 0 0 0 2.08-1.6L20 8H6.05" />
      <circle cx="9.2" cy="19" r="1.35" />
      <circle cx="17.1" cy="19" r="1.35" />
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

export function RestaurantMenuClient({
  restaurant,
  menu,
}: {
  restaurant: PublicRestaurant;
  menu: PublicMenu;
}) {
  const { lang, setLang } = useLanguage();
  const { user, loading: authLoading, openLogin } = useWebAuth();
  const ru = lang === "ru";
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
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
      // Keep cart in memory when storage is unavailable.
    }
  }, [cart, cartKey, cartLoaded]);

  const categories = useMemo(
    () =>
      [...(menu.categories ?? [])].sort(
        (left, right) => Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0),
      ),
    [menu.categories],
  );

  const items = menu.items ?? menu.products ?? [];

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (!normalized) return true;
      return [
        item.titleRu,
        item.titleKk,
        item.composition,
        item.description,
        item.weight,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized));
    });
  }, [activeCategory, items, query]);

  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const totalPrice = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const cover = apiAssetUrl(restaurant.coverImageUrl);

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
            ? { ...line, quantity: nextQuantity, price: item.price, imageUrl: item.imageUrl }
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

  const activeCategoryTitle =
    activeCategory === "all"
      ? ru ? "Все блюда" : "Барлық тағамдар"
      : ru
        ? categories.find((category) => category.id === activeCategory)?.titleRu
        : categories.find((category) => category.id === activeCategory)?.titleKk ||
          categories.find((category) => category.id === activeCategory)?.titleRu;

  return (
    <div className="restaurant-menu-v2">
      <header className="restaurant-menu-topbar">
        <Link className="restaurant-menu-topbar__brand" href="/restaurants" aria-label="JETKIZ">
          <img src="/jetkiz-logo.svg" alt="JETKIZ" />
        </Link>

        <div className="restaurant-menu-topbar__city">
          <span className="market-location-dot" aria-hidden="true" />
          <strong>Щучинск</strong>
          <span aria-hidden="true">⌄</span>
        </div>

        <label className="restaurant-menu-topbar__search">
          <SearchIcon />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ru ? "Поиск по меню" : "Мәзірден іздеу"}
            autoComplete="off"
          />
        </label>

        <nav className="restaurant-menu-topbar__nav" aria-label={ru ? "Навигация" : "Навигация"}>
          <Link className="is-active" href="/restaurants">{ru ? "Рестораны" : "Мейрамханалар"}</Link>
          <Link href="/delivery">{ru ? "Как заказать" : "Қалай тапсырыс беру"}</Link>
          <Link href="/partners/restaurants">{ru ? "Для ресторанов" : "Мейрамханаларға"}</Link>
          <Link href="/couriers">{ru ? "Курьерам" : "Курьерлерге"}</Link>
        </nav>

        <div className="restaurant-menu-topbar__lang">
          <button className={ru ? "is-active" : ""} onClick={() => setLang("ru")}>RU</button>
          <button className={!ru ? "is-active" : ""} onClick={() => setLang("kz")}>KZ</button>
        </div>

        <button
          type="button"
          className="restaurant-menu-topbar__profile"
          onClick={user ? () => { window.location.href = "/account"; } : openLogin}
          disabled={authLoading}
          aria-label={ru ? "Профиль" : "Профиль"}
        >
          <ProfileIcon />
        </button>

        {totalCount > 0 && (
          <Link className="restaurant-menu-topbar__cart" href={`/restaurants/${publicSlug}/checkout`}>
            <CartIcon />
            <span>{ru ? "Корзина" : "Себет"}</span>
            <b>{totalCount}</b>
          </Link>
        )}
      </header>

      <main className="restaurant-menu-v2__main">
        <section className="restaurant-menu-hero">
          <div className="restaurant-menu-hero__scene" aria-hidden="true">
            <img
              className="restaurant-menu-hero__photo restaurant-menu-hero__photo--hq"
              src="/generated/jetkiz-courier-hq-final.webp"
              alt=""
            />
          </div>

          <div className="restaurant-menu-hero__info">
            <div className="restaurant-menu-hero__logo">
              {cover ? (
                <img src={cover} alt={restaurantName || "JETKIZ"} />
              ) : (
                <img src="/jetkiz-logo.svg" alt="" />
              )}
            </div>

            <div className="restaurant-menu-hero__copy">
              <Link href="/restaurants">← {ru ? "Все рестораны" : "Барлық мейрамханалар"}</Link>
              <h1>{restaurantName}</h1>
              {restaurant.address && <p>{restaurant.address}</p>}
              <div className="restaurant-menu-hero__badges">
                <span className={restaurant.isOpenNow ? "is-open" : ""}>
                  {restaurant.isOpenNow
                    ? ru ? "Открыто" : "Ашық"
                    : ru ? "Закрыто" : "Жабық"}
                </span>
                {restaurant.workingHours && <span>{restaurant.workingHours}</span>}
                {restaurant.isPickupEnabled && <span>{ru ? "Самовывоз" : "Алып кету"}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="restaurant-menu-layout">
          <aside className="restaurant-menu-sidebar" aria-label={ru ? "Категории меню" : "Мәзір санаттары"}>
            <h2>{ru ? "Меню" : "Мәзір"}</h2>
            <button
              type="button"
              className={activeCategory === "all" ? "is-active" : ""}
              onClick={() => setActiveCategory("all")}
            >
              <span>{ru ? "Все блюда" : "Барлық тағамдар"}</span>
              <b>{items.length}</b>
            </button>
            {categories.map((category) => {
              const count = items.filter((item) => item.categoryId === category.id).length;
              return (
                <button
                  type="button"
                  key={category.id}
                  className={activeCategory === category.id ? "is-active" : ""}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <span>{ru ? category.titleRu : category.titleKk || category.titleRu}</span>
                  {count > 0 && <b>{count}</b>}
                </button>
              );
            })}
          </aside>

          <div className="restaurant-menu-products">
            <div className="restaurant-menu-products__head">
              <div>
                <h2>{activeCategoryTitle}</h2>
                <span>{visibleItems.length}</span>
              </div>
              <label className="restaurant-menu-products__search">
                <SearchIcon />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={ru ? "Поиск по меню..." : "Мәзірден іздеу..."}
                />
              </label>
            </div>

            <div className="restaurant-menu-mobile-categories" role="tablist">
              <button
                type="button"
                className={activeCategory === "all" ? "is-active" : ""}
                onClick={() => setActiveCategory("all")}
              >
                {ru ? "Все блюда" : "Барлық тағамдар"}
              </button>
              {categories.map((category) => (
                <button
                  type="button"
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
              <div className="restaurant-menu-product-grid">
                {visibleItems.map((item) => {
                  const quantity = quantityFor(item.id);
                  const image = apiAssetUrl(item.imageUrl);
                  const title = ru ? item.titleRu : item.titleKk || item.titleRu;
                  const description = item.composition || item.description;
                  return (
                    <article
                      className={item.isAvailable ? "restaurant-menu-product" : "restaurant-menu-product is-unavailable"}
                      key={item.id}
                    >
                      <div className="restaurant-menu-product__image">
                        {image ? (
                          <img src={image} alt={title} loading="lazy" />
                        ) : (
                          <div className="restaurant-menu-product__placeholder">
                            <img src="/jetkiz-logo.svg" alt="" />
                          </div>
                        )}
                      </div>

                      <div className="restaurant-menu-product__body">
                        <h3>{title}</h3>
                        <strong>{formatKzt(item.price)}</strong>
                        {description && <p>{description}</p>}
                        {item.weight && <small>{item.weight}</small>}

                        {!item.isAvailable ? (
                          <button className="restaurant-menu-product__disabled" disabled>
                            {ru ? "Нет в наличии" : "Қолжетімсіз"}
                          </button>
                        ) : quantity === 0 ? (
                          <button
                            className="restaurant-menu-product__add"
                            onClick={() => changeQuantity(item, 1)}
                          >
                            + {ru ? "Добавить" : "Қосу"}
                          </button>
                        ) : (
                          <div className="restaurant-menu-product__qty">
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

          <aside className="restaurant-menu-cart">
            <div className="restaurant-menu-cart__head">
              <h2>{ru ? "Корзина" : "Себет"}</h2>
              {totalCount > 0 && <span>{totalCount}</span>}
            </div>

            {cart.length === 0 ? (
              <div className="restaurant-menu-cart__empty">
                <CartIcon />
                <strong>{ru ? "Корзина пока пуста" : "Себет әзірге бос"}</strong>
                <p>{ru ? "Добавьте блюда из меню" : "Мәзірден тағам қосыңыз"}</p>
              </div>
            ) : (
              <>
                <div className="restaurant-menu-cart__lines">
                  {cart.map((line) => {
                    const image = apiAssetUrl(line.imageUrl);
                    return (
                      <div className="restaurant-menu-cart__line" key={line.productId}>
                        <div className="restaurant-menu-cart__thumb">
                          {image ? <img src={image} alt="" /> : <img src="/jetkiz-logo.svg" alt="" />}
                        </div>
                        <div className="restaurant-menu-cart__line-copy">
                          <strong>{ru ? line.titleRu : line.titleKk || line.titleRu}</strong>
                          <span>{formatKzt(line.price)}</span>
                        </div>
                        <div className="restaurant-menu-cart__line-qty">
                          <button onClick={() => changeCartLine(line, -1)}>−</button>
                          <span>{line.quantity}</span>
                          <button onClick={() => changeCartLine(line, 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="restaurant-menu-cart__total">
                  <span>{ru ? "Итого" : "Барлығы"}</span>
                  <strong>{formatKzt(totalPrice)}</strong>
                </div>

                {restaurant.canAcceptOrders ? (
                  <Link
                    className="restaurant-menu-cart__checkout"
                    href={`/restaurants/${publicSlug}/checkout`}
                  >
                    {ru ? "Перейти к оформлению" : "Рәсімдеуге өту"} →
                  </Link>
                ) : (
                  <button className="restaurant-menu-cart__checkout is-disabled" disabled>
                    {ru ? "Ресторан не принимает заказы" : "Мейрамхана тапсырыс қабылдамайды"}
                  </button>
                )}
              </>
            )}
          </aside>
        </section>
      </main>

      {totalCount > 0 && (
        <div className="restaurant-menu-mobile-cart">
          <div className="restaurant-menu-mobile-cart__label">
            <CartIcon />
            <span>
              <strong>{ru ? "Корзина" : "Себет"}</strong>
              <small>{totalCount} {ru ? "товара" : "тауар"}</small>
            </span>
          </div>
          <strong>{formatKzt(totalPrice)}</strong>
          {restaurant.canAcceptOrders ? (
            <Link href={`/restaurants/${publicSlug}/checkout`}>
              {ru ? "Оформить" : "Рәсімдеу"} ›
            </Link>
          ) : (
            <span className="is-disabled">{ru ? "Закрыто" : "Жабық"}</span>
          )}
        </div>
      )}
    </div>
  );
}
