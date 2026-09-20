"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../components/LanguageProvider";
import { useWebAuth } from "../../../components/WebAuthProvider";
import {
  formatKzt,
  restaurantPublicSlug,
  type PublicRestaurant,
} from "../../../lib/jetkiz-api";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

type CartLine = {
  productId: string;
  titleRu: string;
  titleKk?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type Address = {
  id: string;
  title?: string;
  address?: string;
  floor?: string | null;
  door?: string | null;
};

type SavedPaymentMethod = {
  id: string;
  brand?: string | null;
  last4?: string | null;
  issuerBank?: string | null;
  isDefault?: boolean;
};

type Fulfillment = "DELIVERY" | "PICKUP";

function apiHeaders(extra?: Record<string, string>) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-App": "website",
    "X-Platform": "web",
    "X-App-Version": "web-1",
    "X-Locale": "ru",
    "X-Timezone": "Asia/Almaty",
    ...extra,
  };
}

async function json(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function message(payload: unknown, fallback: string) {
  const root = object(payload);
  const raw = root?.message ?? root?.error;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length) return String(raw[0]);
  return fallback;
}

function list<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const root = object(payload);
  if (!root) return [];
  for (const key of ["items", "addresses", "methods", "data", "result"]) {
    const value = root[key];
    if (Array.isArray(value)) return value as T[];
    const nested = object(value);
    if (nested && Array.isArray(nested.items)) return nested.items as T[];
  }
  return [];
}

function orderIdFrom(payload: unknown) {
  const root = object(payload);
  if (!root) return "";
  const direct = String(root.id ?? "").trim();
  if (direct) return direct;
  for (const key of ["order", "data", "item", "result"]) {
    const nested = object(root[key]);
    const id = String(nested?.id ?? "").trim();
    if (id) return id;
  }
  return "";
}

function checkoutUrlFrom(payload: unknown) {
  const root = object(payload);
  if (!root) return "";
  return String(root.checkoutUrl ?? "").trim();
}

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `web-order-${crypto.randomUUID()}`;
  }
  return `web-order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutClient({ restaurant }: { restaurant: PublicRestaurant }) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const { user, loading: authLoading, openLogin } = useWebAuth();
  const publicSlug = restaurantPublicSlug(restaurant);
  const cartKey = `jetkiz-cart:${restaurant.id}`;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("DELIVERY");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressTitle, setNewAddressTitle] = useState(ru ? "Дом" : "Үй");
  const [newAddress, setNewAddress] = useState("");
  const [comment, setComment] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("new");
  const [saveNewCard, setSaveNewCard] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey);
      setLines(raw ? (JSON.parse(raw) as CartLine[]) : []);
    } catch {
      setLines([]);
    }
  }, [cartKey]);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setAddressId("");
      return;
    }

    let cancelled = false;
    setAddressLoading(true);

    void fetch(`${API_BASE_URL}/addresses/my`, {
      headers: apiHeaders(),
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await json(response);
        if (!response.ok) throw new Error(message(payload, "Не удалось загрузить адреса."));
        if (cancelled) return;
        const next = list<Address>(payload);
        setAddresses(next);
        if (!addressId && next[0]?.id) setAddressId(next[0].id);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setAddressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, addressId]);

  useEffect(() => {
    if (!user) {
      setPaymentMethods([]);
      setPaymentMethodId("new");
      return;
    }

    let cancelled = false;
    void fetch(`${API_BASE_URL}/payments/methods`, {
      headers: apiHeaders(),
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await json(response);
        if (!response.ok || cancelled) return;
        const next = list<SavedPaymentMethod>(payload);
        setPaymentMethods(next);
        const preferred = next.find((method) => method.isDefault) ?? next[0];
        setPaymentMethodId(preferred?.id || "new");
      })
      .catch(() => {
        if (!cancelled) {
          setPaymentMethods([]);
          setPaymentMethodId("new");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!restaurant.isPickupEnabled && fulfillment === "PICKUP") {
      setFulfillment("DELIVERY");
    }
  }, [restaurant.isPickupEnabled, fulfillment]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const createAddress = async () => {
    if (!newAddress.trim()) {
      setError(ru ? "Укажите адрес доставки." : "Жеткізу мекенжайын көрсетіңіз.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: apiHeaders(),
        credentials: "include",
        body: JSON.stringify({
          title: newAddressTitle.trim() || (ru ? "Дом" : "Үй"),
          address: newAddress.trim(),
        }),
      });
      const payload = await json(response);
      if (!response.ok) {
        throw new Error(message(payload, ru ? "Не удалось сохранить адрес." : "Мекенжайды сақтау мүмкін болмады."));
      }

      const root = object(payload);
      const nested =
        object(root?.address) ||
        object(root?.item) ||
        object(root?.data) ||
        root;
      const saved = nested as Address | null;

      if (!saved?.id) throw new Error(ru ? "Сервер не вернул адрес." : "Сервер мекенжайды қайтармады.");

      setAddresses((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setAddressId(saved.id);
      setShowNewAddress(false);
      setNewAddress("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const startPayment = async (orderId: string) => {
    const useNewCard = paymentMethodId === "new";
    const paymentResponse = await fetch(`${API_BASE_URL}/payments`, {
      method: "POST",
      headers: apiHeaders(),
      credentials: "include",
      body: JSON.stringify({
        orderId,
        ...(useNewCard
          ? { saveCard: saveNewCard }
          : { savedPaymentMethodId: paymentMethodId }),
      }),
    });

    const paymentPayload = await json(paymentResponse);
    if (!paymentResponse.ok) {
      throw new Error(
        message(
          paymentPayload,
          ru ? "Не удалось открыть оплату." : "Төлемді ашу мүмкін болмады.",
        ),
      );
    }

    const checkoutUrl = checkoutUrlFrom(paymentPayload);
    const parsed = (() => {
      try {
        return new URL(checkoutUrl);
      } catch {
        return null;
      }
    })();

    if (!parsed || parsed.protocol !== "https:") {
      throw new Error(
        ru
          ? "Платёжный сервис вернул некорректную ссылку."
          : "Төлем сервисі қате сілтеме қайтарды.",
      );
    }

    window.localStorage.setItem(
      "jetkiz:web:pending-payment",
      JSON.stringify({
        orderId,
        cartKey,
        restaurantId: restaurant.id,
        restaurantSlug: publicSlug,
        createdAt: new Date().toISOString(),
      }),
    );

    window.location.assign(parsed.toString());
  };

  const submit = async () => {
    if (!user) {
      openLogin();
      return;
    }

    if (!lines.length) {
      setError(ru ? "Корзина пуста." : "Себет бос.");
      return;
    }

    if (!restaurant.canAcceptOrders) {
      setError(
        ru
          ? "Ресторан сейчас не принимает заказы."
          : "Мейрамхана қазір тапсырыс қабылдамайды.",
      );
      return;
    }

    if (fulfillment === "DELIVERY" && !addressId) {
      setError(
        ru
          ? "Выберите или добавьте адрес доставки."
          : "Жеткізу мекенжайын таңдаңыз немесе қосыңыз.",
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (createdOrderId) {
        await startPayment(createdOrderId);
        return;
      }

      const idempotencyKey = newIdempotencyKey();
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: apiHeaders({ "Idempotency-Key": idempotencyKey }),
        credentials: "include",
        body: JSON.stringify({
          restaurantId: restaurant.id,
          paymentMethod: "CARD",
          fulfillmentType: fulfillment,
          ...(fulfillment === "DELIVERY" ? { addressId } : {}),
          leaveAtDoor: fulfillment === "DELIVERY" ? leaveAtDoor : false,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
          ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        }),
      });

      const payload = await json(response);
      if (!response.ok) {
        throw new Error(
          message(
            payload,
            ru ? "Не удалось создать заказ." : "Тапсырыс жасау мүмкін болмады.",
          ),
        );
      }

      const orderId = orderIdFrom(payload);
      if (!orderId) {
        throw new Error(
          ru
            ? "Сервер создал заказ, но не вернул его номер."
            : "Сервер тапсырысты жасады, бірақ оның нөмірін қайтармады.",
        );
      }

      setCreatedOrderId(orderId);
      await startPayment(orderId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="checkout-page">
      <div className="checkout-content">
        <Link className="restaurant-back-compact" href={`/restaurants/${publicSlug}`}>
          ← {ru ? "Вернуться в меню" : "Мәзірге оралу"}
        </Link>

        <div className="checkout-title">
          <span>JETKIZ CHECKOUT</span>
          <h1>{ru ? "Оформление заказа" : "Тапсырысты рәсімдеу"}</h1>
          <p>
            {ru
              ? "Проверьте заказ, выберите способ оплаты и завершите оплату картой."
              : "Тапсырысты тексеріп, төлем тәсілін таңдап, картамен төлемді аяқтаңыз."}
          </p>
        </div>

        {!authLoading && !user && (
          <div className="checkout-login-card">
            <div>
              <strong>{ru ? "Сначала войдите" : "Алдымен кіріңіз"}</strong>
              <p>
                {ru
                  ? "Вход нужен, чтобы сохранить заказ, адрес и показать его статус после оплаты."
                  : "Тапсырысты, мекенжайды сақтау және төлемнен кейін күйін көрсету үшін кіру қажет."}
              </p>
            </div>
            <button onClick={openLogin}>{ru ? "Войти по телефону" : "Телефонмен кіру"}</button>
          </div>
        )}

        <div className="checkout-section">
          <h2>{ru ? "Как получить заказ" : "Тапсырысты қалай аласыз"}</h2>
          <div className="fulfillment-switch">
            <button
              className={fulfillment === "DELIVERY" ? "is-active" : ""}
              onClick={() => setFulfillment("DELIVERY")}
            >
              <strong>{ru ? "Доставка" : "Жеткізу"}</strong>
              <span>{ru ? "Курьер привезёт по адресу" : "Курьер мекенжайға жеткізеді"}</span>
            </button>
            {restaurant.isPickupEnabled && (
              <button
                className={fulfillment === "PICKUP" ? "is-active" : ""}
                onClick={() => setFulfillment("PICKUP")}
              >
                <strong>{ru ? "Самовывоз" : "Алып кету"}</strong>
                <span>{restaurant.address || "Щучинск"}</span>
              </button>
            )}
          </div>
        </div>

        {fulfillment === "DELIVERY" && (
          <div className="checkout-section">
            <div className="checkout-section__head">
              <h2>{ru ? "Адрес доставки" : "Жеткізу мекенжайы"}</h2>
              <button className="checkout-link-button" onClick={() => setShowNewAddress((value) => !value)}>
                {showNewAddress ? (ru ? "Отмена" : "Бас тарту") : ru ? "+ Новый адрес" : "+ Жаңа мекенжай"}
              </button>
            </div>

            {addressLoading ? (
              <p className="checkout-muted">{ru ? "Загружаем адреса…" : "Мекенжайлар жүктелуде…"}</p>
            ) : addresses.length > 0 ? (
              <div className="checkout-address-list">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    className={addressId === address.id ? "is-active" : ""}
                    onClick={() => setAddressId(address.id)}
                  >
                    <strong>{address.title || (ru ? "Адрес" : "Мекенжай")}</strong>
                    <span>{address.address}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="checkout-muted">
                {ru ? "Сохранённых адресов пока нет." : "Сақталған мекенжайлар әзірге жоқ."}
              </p>
            )}

            {(showNewAddress || addresses.length === 0) && user && (
              <div className="checkout-new-address">
                <input
                  value={newAddressTitle}
                  onChange={(event) => setNewAddressTitle(event.target.value)}
                  placeholder={ru ? "Название: Дом, Работа" : "Атауы: Үй, Жұмыс"}
                />
                <input
                  value={newAddress}
                  onChange={(event) => setNewAddress(event.target.value)}
                  placeholder={ru ? "Улица, дом, квартира" : "Көше, үй, пәтер"}
                />
                <button onClick={() => void createAddress()} disabled={busy}>
                  {ru ? "Сохранить адрес" : "Мекенжайды сақтау"}
                </button>
              </div>
            )}

            <label className="checkout-checkbox">
              <input
                type="checkbox"
                checked={leaveAtDoor}
                onChange={(event) => setLeaveAtDoor(event.target.checked)}
              />
              <span>{ru ? "Оставить у двери" : "Есіктің алдына қалдыру"}</span>
            </label>
          </div>
        )}

        <div className="checkout-section checkout-section--fields">
          <label>
            <span>{ru ? "Комментарий ресторану и курьеру" : "Мейрамхана мен курьерге түсініктеме"}</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={ru ? "Например: не звонить в домофон" : "Мысалы: домофонға қоңырау шалмаңыз"}
            />
          </label>
          <label>
            <span>{ru ? "Промокод" : "Промокод"}</span>
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              placeholder={ru ? "Если есть" : "Бар болса"}
            />
          </label>
        </div>

        <div className="checkout-section checkout-payment-methods">
          <div className="checkout-section__head">
            <div>
              <h2>{ru ? "Способ оплаты" : "Төлем тәсілі"}</h2>
              <p>{ru ? "Выберите сохранённую карту или добавьте новую." : "Сақталған картаны таңдаңыз немесе жаңасын қосыңыз."}</p>
            </div>
          </div>

          <div className="checkout-card-options">
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method.id}
                className={paymentMethodId === method.id ? "is-active" : ""}
                onClick={() => setPaymentMethodId(method.id)}
              >
                <span className="checkout-card-brand">{String(method.brand || "CARD").toUpperCase()}</span>
                <span>
                  <strong>•••• {method.last4 || "••••"}</strong>
                  <small>{method.issuerBank || (method.isDefault ? (ru ? "Основная карта" : "Негізгі карта") : (ru ? "Сохранённая карта" : "Сақталған карта"))}</small>
                </span>
                <i />
              </button>
            ))}

            <button
              type="button"
              className={paymentMethodId === "new" ? "is-active checkout-card-option--new" : "checkout-card-option--new"}
              onClick={() => setPaymentMethodId("new")}
            >
              <span className="checkout-card-brand">＋</span>
              <span>
                <strong>{ru ? "Новая карта" : "Жаңа карта"}</strong>
                <small>{ru ? "Добавить новую карту" : "Жаңа карта қосу"}</small>
              </span>
              <i />
            </button>
          </div>

          {paymentMethodId === "new" && (
            <label className="checkout-checkbox checkout-save-card">
              <input type="checkbox" checked={saveNewCard} onChange={(event) => setSaveNewCard(event.target.checked)} />
              <span>{ru ? "Сохранить карту для следующих заказов" : "Картаны келесі тапсырыстар үшін сақтау"}</span>
            </label>
          )}

          <div className="checkout-payment-note checkout-payment-note--inline">
            <div className="checkout-payment-icon">••••</div>
            <div>
              <strong>{ru ? "Оплата картой" : "Картамен төлеу"}</strong>
              <p>{ru ? "Данные карты защищены и не отображаются в JETKIZ." : "Карта деректері қорғалған және JETKIZ ішінде көрсетілмейді."}</p>
            </div>
          </div>
        </div>

        {error && <div className="checkout-error" role="alert">{error}</div>}
      </div>

      <aside className="checkout-summary checkout-summary--production">
        <span className="kicker">{ru ? "ВАШ ЗАКАЗ" : "СІЗДІҢ ТАПСЫРЫСЫҢЫЗ"}</span>
        <h2>{restaurant.nameRu || restaurant.nameKk}</h2>
        {lines.length === 0 ? (
          <p>{ru ? "Корзина пуста." : "Себет бос."}</p>
        ) : (
          lines.map((line) => (
            <div className="checkout-line" key={line.productId}>
              <span>
                {line.quantity} × {ru ? line.titleRu : line.titleKk || line.titleRu}
              </span>
              <strong>{formatKzt(line.price * line.quantity)}</strong>
            </div>
          ))
        )}
        <div className="checkout-total">
          <span>{ru ? "Товары" : "Тауарлар"}</span>
          <strong>{formatKzt(total)}</strong>
        </div>
        <p className="checkout-summary__hint">
          {ru
            ? "Доставка, скидки и итоговая сумма пересчитываются сервером при создании заказа."
            : "Жеткізу, жеңілдіктер және қорытынды сома тапсырыс жасалған кезде серверде қайта есептеледі."}
        </p>
        <button
          className="checkout-submit"
          type="button"
          onClick={() => void submit()}
          disabled={busy || authLoading || lines.length === 0}
        >
          {busy
            ? ru ? "Подготавливаем оплату…" : "Төлем дайындалуда…"
            : createdOrderId
              ? ru ? "Повторить переход к оплате" : "Төлемге қайта өту"
              : ru ? "Перейти к оплате" : "Төлемге өту"}
        </button>
      </aside>
    </section>
  );
}
