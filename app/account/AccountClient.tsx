"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useWebAuth } from "../components/WebAuthProvider";
import { formatKzt } from "../lib/jetkiz-api";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

type Profile = {
  id?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type Address = {
  id?: string;
  title?: string;
  address?: string;
  floor?: string | null;
  door?: string | null;
  entrance?: string | null;
  intercom?: string | null;
  contactPhone?: string | null;
};

type Order = {
  id?: string;
  number?: number;
  status?: string;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  fulfillmentType?: string;
  restaurant?: { name?: string; nameRu?: string };
  restaurantName?: string;
};

type SavedPaymentMethod = {
  id: string;
  brand?: string | null;
  last4?: string | null;
  issuerBank?: string | null;
  isDefault?: boolean;
};

function headers() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-App": "website",
    "X-Platform": "web",
    "X-App-Version": "web-1",
    "X-Locale": "ru",
    "X-Timezone": "Asia/Almaty",
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>) : null;
}

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const root = asObject(payload);
  if (!root) return [];
  for (const key of ["items", "orders", "addresses", "methods", "data", "result"]) {
    const value = root[key];
    if (Array.isArray(value)) return value as T[];
    const nested = asObject(value);
    if (nested && Array.isArray(nested.items)) return nested.items as T[];
  }
  return [];
}

function extractProfile(payload: unknown): Profile | null {
  const root = asObject(payload);
  if (!root) return null;
  for (const key of ["user", "data", "item", "result"]) {
    const nested = asObject(root[key]);
    if (nested) return nested as Profile;
  }
  return root as Profile;
}

function errorMessage(payload: unknown, fallback: string) {
  const root = asObject(payload);
  const raw = root?.message ?? root?.error;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length) return String(raw[0]);
  return fallback;
}

function statusLabel(status: string | undefined, ru: boolean) {
  const value = String(status ?? "").toUpperCase();
  const labels: Record<string, [string, string]> = {
    CREATED: ["Создан", "Құрылды"],
    ACCEPTED: ["Принят", "Қабылданды"],
    COOKING: ["Готовится", "Дайындалуда"],
    READY: ["Готов", "Дайын"],
    ON_THE_WAY: ["В пути", "Жолда"],
    DELIVERED: ["Доставлен", "Жеткізілді"],
    CANCELED: ["Отменён", "Бас тартылды"],
    CANCELLED: ["Отменён", "Бас тартылды"],
    REJECTED: ["Отклонён", "Қабылданбады"],
  };
  return labels[value]?.[ru ? 0 : 1] ?? value;
}

function formatDate(value: string | undefined, ru: boolean) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(ru ? "ru-RU" : "kk-KZ", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function AccountClient() {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const { user, loading: authLoading, openLogin, logout, refreshUser } = useWebAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressTitle, setAddressTitle] = useState(ru ? "Дом" : "Үй");
  const [addressText, setAddressText] = useState("");
  const [addressBusy, setAddressBusy] = useState(false);

  const loadAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileResponse, addressesResponse, ordersResponse, methodsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me`, { headers: headers(), credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE_URL}/addresses/my`, { headers: headers(), credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE_URL}/orders/my?page=1&limit=20`, { headers: headers(), credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE_URL}/payments/methods`, { headers: headers(), credentials: "include", cache: "no-store" }),
      ]);

      const [profilePayload, addressesPayload, ordersPayload, methodsPayload] = await Promise.all([
        readJson(profileResponse), readJson(addressesResponse), readJson(ordersResponse), readJson(methodsResponse),
      ]);

      const nextProfile = profileResponse.ok ? extractProfile(profilePayload) : null;
      setProfile(nextProfile);
      setAddresses(addressesResponse.ok ? extractList<Address>(addressesPayload) : []);
      setOrders(ordersResponse.ok ? extractList<Order>(ordersPayload) : []);
      setPaymentMethods(methodsResponse.ok ? extractList<SavedPaymentMethod>(methodsPayload) : []);
      setFirstName(String(nextProfile?.firstName ?? ""));
      setLastName(String(nextProfile?.lastName ?? ""));
      setEmail(String(nextProfile?.email ?? ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setProfile(null); setOrders([]); setAddresses([]); setPaymentMethods([]);
      return;
    }
    void loadAccount();
  }, [user]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [orders],
  );

  const saveProfile = async () => {
    if (!firstName.trim()) {
      setMessage(ru ? "Укажите имя." : "Атыңызды көрсетіңіз.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH", headers: headers(), credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(errorMessage(payload, ru ? "Не удалось сохранить профиль." : "Профильді сақтау мүмкін болмады."));
      const next = extractProfile(payload);
      if (next) setProfile(next);
      await refreshUser();
      setMessage(ru ? "Сохранено" : "Сақталды");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const createAddress = async () => {
    if (!addressText.trim()) return;
    setAddressBusy(true); setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST", headers: headers(), credentials: "include",
        body: JSON.stringify({
          title: addressTitle.trim() || (ru ? "Дом" : "Үй"),
          address: addressText.trim(),
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(errorMessage(payload, ru ? "Не удалось добавить адрес." : "Мекенжайды қосу мүмкін болмады."));
      setAddressText("");
      setShowAddressForm(false);
      await loadAccount();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Ошибка");
    } finally { setAddressBusy(false); }
  };

  const deleteAddress = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/addresses/${encodeURIComponent(id)}`, {
      method: "DELETE", headers: headers(), credentials: "include",
    });
    if (response.ok) setAddresses((current) => current.filter((item) => item.id !== id));
  };

  const deletePaymentMethod = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/methods/${encodeURIComponent(id)}`, {
      method: "DELETE", headers: headers(), credentials: "include",
    });
    if (response.ok) setPaymentMethods((current) => current.filter((item) => item.id !== id));
  };

  const setDefaultPaymentMethod = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/methods/${encodeURIComponent(id)}/default`, {
      method: "PATCH", headers: headers(), credentials: "include",
    });
    if (response.ok) {
      setPaymentMethods((current) => current.map((item) => ({ ...item, isDefault: item.id === id })));
    }
  };

  if (authLoading) {
    return <section className="account-shell"><div className="account-loading">JETKIZ</div></section>;
  }

  if (!user) {
    return (
      <section className="account-shell account-shell--guest">
        <div className="account-guest-card">
          <img src="/jetkiz-logo.svg" alt="JETKIZ" />
          <h1>{ru ? "Войдите в аккаунт" : "Аккаунтқа кіріңіз"}</h1>
          <p>{ru ? "Здесь будут ваши адреса, карты и история заказов." : "Мұнда мекенжайлар, карталар және тапсырыстар тарихы болады."}</p>
          <button onClick={openLogin}>{ru ? "Войти по номеру телефона" : "Телефон нөмірімен кіру"}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-shell account-shell--v2">
      <div className="account-heading account-heading--v2">
        <div>
          <span>JETKIZ</span>
          <h1>{ru ? "Мой аккаунт" : "Менің аккаунтым"}</h1>
          <p>{profile?.phone || user.phone}</p>
        </div>
        <button className="account-logout" onClick={async () => { await logout(); window.location.href = "/restaurants"; }}>
          {ru ? "Выйти" : "Шығу"}
        </button>
      </div>

      <div className="account-dashboard">
        <div className="account-dashboard__main">
          <article className="account-card account-card--orders account-orders-v2">
            <div className="account-card__head account-card__head--actions">
              <div>
                <h2>{ru ? "Заказы" : "Тапсырыстар"}</h2>
                <p>{ru ? "История и текущие статусы" : "Тарих және ағымдағы күйлер"}</p>
              </div>
              <Link href="/restaurants">{ru ? "Заказать снова" : "Қайта тапсырыс беру"}</Link>
            </div>

            {loading ? (
              <div className="account-skeleton">{ru ? "Загружаем заказы…" : "Тапсырыстар жүктелуде…"}</div>
            ) : sortedOrders.length === 0 ? (
              <div className="account-empty account-empty--orders">
                <strong>{ru ? "Заказов пока нет" : "Тапсырыстар әзірге жоқ"}</strong>
                <p>{ru ? "Выберите ресторан — первый заказ появится здесь." : "Мейрамхананы таңдаңыз — бірінші тапсырыс осында көрінеді."}</p>
                <Link href="/restaurants">{ru ? "Открыть рестораны" : "Мейрамханаларды ашу"}</Link>
              </div>
            ) : (
              <div className="order-history-list">
                {sortedOrders.map((order, index) => {
                  const id = String(order.id ?? "");
                  const total = Number(order.total ?? order.totalAmount ?? 0);
                  const restaurant = order.restaurant?.nameRu || order.restaurant?.name || order.restaurantName || "JETKIZ";
                  const status = String(order.status ?? "").toUpperCase();
                  return (
                    <Link href={id ? `/order/${encodeURIComponent(id)}` : "#"} className="order-history-card" key={id || index}>
                      <div className="order-history-card__icon">{restaurant.slice(0, 1).toUpperCase()}</div>
                      <div className="order-history-card__content">
                        <div className="order-history-card__top">
                          <div>
                            <strong>{restaurant}</strong>
                            <span>№{order.number ?? "—"} · {formatDate(order.createdAt, ru)}</span>
                          </div>
                          <span className={`order-history-status status-${status.toLowerCase()}`}>{statusLabel(order.status, ru)}</span>
                        </div>
                        <div className="order-history-card__bottom">
                          <span>{String(order.fulfillmentType).toUpperCase() === "PICKUP" ? (ru ? "Самовывоз" : "Алып кету") : (ru ? "Доставка" : "Жеткізу")}</span>
                          <strong>{total > 0 ? formatKzt(total) : "—"}</strong>
                        </div>
                      </div>
                      <span className="order-history-card__arrow">›</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>
        </div>

        <aside className="account-dashboard__side">
          <article className="account-card account-card--compact">
            <div className="account-card__head account-card__head--actions">
              <h2>{ru ? "Адреса" : "Мекенжайлар"}</h2>
              <button type="button" onClick={() => setShowAddressForm((value) => !value)}>
                {showAddressForm ? "×" : ru ? "+ Добавить" : "+ Қосу"}
              </button>
            </div>
            <div className="account-addresses account-addresses--v2">
              {addresses.map((address, index) => (
                <div className="account-address-row" key={address.id || index}>
                  <span className="account-address-row__pin">⌖</span>
                  <div>
                    <strong>{address.title || (ru ? "Адрес" : "Мекенжай")}</strong>
                    <span>{address.address}</span>
                  </div>
                  {address.id && <button type="button" onClick={() => void deleteAddress(address.id!)} aria-label={ru ? "Удалить адрес" : "Мекенжайды жою"}>×</button>}
                </div>
              ))}
              {!addresses.length && !showAddressForm && <p className="account-muted">{ru ? "Сохранённых адресов пока нет." : "Сақталған мекенжайлар жоқ."}</p>}
            </div>
            {showAddressForm && (
              <div className="account-address-form">
                <input value={addressTitle} onChange={(e) => setAddressTitle(e.target.value)} placeholder={ru ? "Дом" : "Үй"} />
                <input value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder={ru ? "Улица, дом, квартира" : "Көше, үй, пәтер"} />
                <button type="button" onClick={() => void createAddress()} disabled={addressBusy || !addressText.trim()}>
                  {addressBusy ? "…" : ru ? "Сохранить" : "Сақтау"}
                </button>
              </div>
            )}
          </article>

          <article className="account-card account-card--compact">
            <div className="account-card__head account-card__head--actions">
              <h2>{ru ? "Карты" : "Карталар"}</h2>
              <Link href="/restaurants">{ru ? "+ Добавить" : "+ Қосу"}</Link>
            </div>
            <div className="account-payment-methods">
              {paymentMethods.map((method) => (
                <div className="account-payment-card" key={method.id}>
                  <div className="account-payment-card__mark">••</div>
                  <div>
                    <strong>{String(method.brand || "CARD").toUpperCase()} •••• {method.last4 || "••••"}</strong>
                    <span>{method.issuerBank || (method.isDefault ? (ru ? "Основная карта" : "Негізгі карта") : (ru ? "Сохранённая карта" : "Сақталған карта"))}</span>
                  </div>
                  <div className="account-payment-card__actions">
                    {!method.isDefault && <button type="button" onClick={() => void setDefaultPaymentMethod(method.id)}>{ru ? "Основная" : "Негізгі"}</button>}
                    <button type="button" onClick={() => void deletePaymentMethod(method.id)}>×</button>
                  </div>
                </div>
              ))}
              {!paymentMethods.length && <p className="account-muted">{ru ? "Сохранённых карт пока нет. Новую карту можно сохранить при оплате заказа." : "Сақталған карталар жоқ. Жаңа картаны тапсырыс төлеу кезінде сақтауға болады."}</p>}
            </div>
            <p className="account-card-note">{ru ? "Новую карту можно добавить и сохранить при следующей оплате." : "Жаңа картаны келесі төлем кезінде қосып, сақтауға болады."}</p>
          </article>

          <article className="account-card account-card--compact account-profile-compact">
            <div className="account-card__head"><h2>{ru ? "Личные данные" : "Жеке деректер"}</h2></div>
            <div className="account-form">
              <label>{ru ? "Имя" : "Аты"}<input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
              <label>{ru ? "Фамилия" : "Тегі"}<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
              <label className="account-form__wide">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            </div>
            {message && <p className="account-message">{message}</p>}
            <button className="account-save" onClick={() => void saveProfile()} disabled={saving}>{saving ? "…" : ru ? "Сохранить" : "Сақтау"}</button>
          </article>
        </aside>
      </div>
    </section>
  );
}
