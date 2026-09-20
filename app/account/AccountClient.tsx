"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  avatarUrl?: string | null;
};

type Address = {
  id?: string;
  title?: string;
  address?: string;
  contactPhone?: string | null;
};

type Order = {
  id?: string;
  number?: number;
  status?: string;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  restaurant?: { name?: string; nameRu?: string };
  restaurantName?: string;
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
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const root = asObject(payload);
  if (!root) return [];
  for (const key of ["items", "orders", "addresses", "data", "result"]) {
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
  };
  return labels[value]?.[ru ? 0 : 1] ?? value;
}

export function AccountClient() {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const { user, loading: authLoading, openLogin, logout, refreshUser } = useWebAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setOrders([]);
      setAddresses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void Promise.all([
      fetch(`${API_BASE_URL}/users/me`, {
        headers: headers(),
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/addresses/my`, {
        headers: headers(),
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/orders/my?page=1&limit=20`, {
        headers: headers(),
        credentials: "include",
        cache: "no-store",
      }),
    ])
      .then(async ([profileResponse, addressesResponse, ordersResponse]) => {
        const profilePayload = await readJson(profileResponse);
        const addressesPayload = await readJson(addressesResponse);
        const ordersPayload = await readJson(ordersResponse);

        if (cancelled) return;

        const nextProfile = profileResponse.ok ? extractProfile(profilePayload) : null;
        setProfile(nextProfile);
        setAddresses(addressesResponse.ok ? extractList<Address>(addressesPayload) : []);
        setOrders(ordersResponse.ok ? extractList<Order>(ordersPayload) : []);

        setFirstName(String(nextProfile?.firstName ?? ""));
        setLastName(String(nextProfile?.lastName ?? ""));
        setEmail(String(nextProfile?.email ?? ""));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveProfile = async () => {
    if (!firstName.trim()) {
      setMessage(ru ? "Укажите имя." : "Атыңызды көрсетіңіз.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName.trim(),
          ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(
          asObject(payload)?.message?.toString() ||
            (ru ? "Не удалось сохранить профиль." : "Профильді сақтау мүмкін болмады."),
        );
      }
      const nextProfile = extractProfile(payload);
      if (nextProfile) setProfile(nextProfile);
      await refreshUser();
      setMessage(ru ? "Профиль сохранён." : "Профиль сақталды.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Ошибка");
    } finally {
      setSaving(false);
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
          <p>
            {ru
              ? "Профиль, адреса и история заказов доступны после входа по номеру телефона."
              : "Профиль, мекенжайлар және тапсырыстар тарихы телефон нөмірі арқылы кіргеннен кейін қолжетімді."}
          </p>
          <button onClick={openLogin}>{ru ? "Войти по номеру телефона" : "Телефон нөмірімен кіру"}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-shell">
      <div className="account-heading">
        <div>
          <span>JETKIZ ACCOUNT</span>
          <h1>{ru ? "Профиль" : "Профиль"}</h1>
        </div>
        <button
          className="account-logout"
          onClick={async () => {
            await logout();
            window.location.href = "/restaurants";
          }}
        >
          {ru ? "Выйти" : "Шығу"}
        </button>
      </div>

      <div className="account-grid">
        <article className="account-card account-card--profile">
          <div className="account-card__head">
            <h2>{ru ? "Личные данные" : "Жеке деректер"}</h2>
            <span>{profile?.phone || user.phone}</span>
          </div>
          <div className="account-form">
            <label>
              {ru ? "Имя" : "Аты"}
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label>
              {ru ? "Фамилия" : "Тегі"}
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </label>
            <label className="account-form__wide">
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </label>
          </div>
          {message && <p className="account-message">{message}</p>}
          <button className="account-save" onClick={() => void saveProfile()} disabled={saving}>
            {saving ? (ru ? "Сохраняем…" : "Сақталуда…") : ru ? "Сохранить" : "Сақтау"}
          </button>
        </article>

        <article className="account-card">
          <div className="account-card__head">
            <h2>{ru ? "Адреса" : "Мекенжайлар"}</h2>
            <span>{addresses.length}</span>
          </div>
          {loading ? (
            <p>{ru ? "Загрузка…" : "Жүктелуде…"}</p>
          ) : addresses.length === 0 ? (
            <p>{ru ? "Сохранённых адресов пока нет." : "Сақталған мекенжайлар әзірге жоқ."}</p>
          ) : (
            <div className="account-addresses">
              {addresses.map((address, index) => (
                <div key={address.id || index}>
                  <strong>{address.title || (ru ? "Адрес" : "Мекенжай")}</strong>
                  <span>{address.address}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <article className="account-card account-card--orders">
        <div className="account-card__head">
          <h2>{ru ? "Последние заказы" : "Соңғы тапсырыстар"}</h2>
          <span>{orders.length}</span>
        </div>
        {loading ? (
          <p>{ru ? "Загрузка…" : "Жүктелуде…"}</p>
        ) : orders.length === 0 ? (
          <div className="account-empty">
            <p>{ru ? "Заказов пока нет." : "Тапсырыстар әзірге жоқ."}</p>
            <Link href="/restaurants">{ru ? "Выбрать ресторан" : "Мейрамхана таңдау"}</Link>
          </div>
        ) : (
          <div className="account-orders">
            {orders.map((order, index) => {
              const id = String(order.id ?? "");
              const total = Number(order.total ?? order.totalAmount ?? 0);
              const restaurant =
                order.restaurant?.nameRu ||
                order.restaurant?.name ||
                order.restaurantName ||
                "JETKIZ";
              return (
                <Link href={id ? `/order/${encodeURIComponent(id)}` : "#"} key={id || index}>
                  <div>
                    <strong>№{order.number ?? "—"}</strong>
                    <span>{restaurant}</span>
                  </div>
                  <div>
                    <strong>{total > 0 ? formatKzt(total) : ""}</strong>
                    <span>{statusLabel(order.status, ru)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
