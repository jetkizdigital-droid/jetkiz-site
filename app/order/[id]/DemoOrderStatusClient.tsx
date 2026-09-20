"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { formatKzt } from "../../lib/jetkiz-api";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

type OrderLine = {
  productId?: string;
  title?: string;
  titleRu?: string;
  titleKk?: string | null;
  name?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  total?: number;
};

type OrderRestaurant = {
  id?: string;
  slug?: string;
  name?: string;
  nameRu?: string;
  nameKk?: string | null;
  address?: string | null;
};

type OrderData = {
  id?: string;
  number?: number;
  status?: string;
  createdAt?: string;
  fulfillmentType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  pickupCode?: string | null;
  total?: number;
  totalAmount?: number;
  deliveryFee?: number;
  discount?: number;
  restaurant?: OrderRestaurant;
  restaurantName?: string;
  address?: { address?: string } | string | null;
  deliveryAddress?: string | null;
  items?: OrderLine[];
  lines?: OrderLine[];
};

function headers() {
  return {
    Accept: "application/json",
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

function unwrapOrder(payload: unknown): OrderData | null {
  const root = asObject(payload);
  if (!root) return null;
  for (const key of ["order", "data", "item", "result"]) {
    const nested = asObject(root[key]);
    if (nested) return nested as OrderData;
  }
  return root as OrderData;
}

function apiMessage(payload: unknown, fallback: string) {
  const root = asObject(payload);
  const raw = root?.message ?? root?.error;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length) return String(raw[0]);
  return fallback;
}

const FLOW = ["CREATED", "ACCEPTED", "COOKING", "READY", "ON_THE_WAY", "DELIVERED"] as const;

function normalizeStatus(value?: string) {
  const status = String(value ?? "").trim().toUpperCase();
  if (status === "CANCELLED") return "CANCELED";
  return status;
}

function stageLabels(ru: boolean) {
  return ru
    ? {
        CREATED: "Заказ создан",
        ACCEPTED: "Ресторан принял заказ",
        COOKING: "Готовится",
        READY: "Заказ готов",
        ON_THE_WAY: "Курьер в пути",
        DELIVERED: "Доставлен",
      }
    : {
        CREATED: "Тапсырыс жасалды",
        ACCEPTED: "Мейрамхана тапсырысты қабылдады",
        COOKING: "Дайындалуда",
        READY: "Тапсырыс дайын",
        ON_THE_WAY: "Курьер жолда",
        DELIVERED: "Жеткізілді",
      };
}

export function OrderStatusClient({ id }: { id: string }) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(id)}`, {
        headers: headers(),
        credentials: "include",
        cache: "no-store",
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(
          apiMessage(
            payload,
            ru ? "Не удалось загрузить заказ." : "Тапсырысты жүктеу мүмкін болмады.",
          ),
        );
      }
      const next = unwrapOrder(payload);
      if (!next?.id) {
        throw new Error(ru ? "Заказ не найден." : "Тапсырыс табылмады.");
      }
      setOrder(next);
      setError("");
      setLastUpdated(new Date());
    } catch (reason) {
      if (!silent) {
        setError(reason instanceof Error ? reason.message : "Ошибка");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, ru]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const status = normalizeStatus(order?.status);
    if (!order || status === "DELIVERED" || status === "CANCELED") return;

    const timer = window.setInterval(() => {
      void load(true);
    }, 12000);

    return () => window.clearInterval(timer);
  }, [order, load]);

  const status = normalizeStatus(order?.status);
  const labels = stageLabels(ru);
  const activeIndex = Math.max(0, FLOW.indexOf(status as (typeof FLOW)[number]));
  const isCanceled = status === "CANCELED";
  const lines = order?.items ?? order?.lines ?? [];
  const total = Number(order?.total ?? order?.totalAmount ?? 0);

  const restaurantName =
    order?.restaurant?.nameRu ||
    order?.restaurant?.name ||
    order?.restaurantName ||
    "JETKIZ";

  const deliveryAddress = useMemo(() => {
    if (!order) return "";
    if (typeof order.address === "string") return order.address;
    return (
      order.address?.address ||
      order.deliveryAddress ||
      order.restaurant?.address ||
      ""
    );
  }, [order]);

  if (loading) {
    return (
      <section className="order-status-shell section-pad">
        <p>{ru ? "Загружаем заказ…" : "Тапсырыс жүктелуде…"}</p>
      </section>
    );
  }

  if (!order || error) {
    return (
      <section className="order-status-shell section-pad">
        <span className="kicker">JETKIZ</span>
        <h1>{ru ? "Заказ недоступен" : "Тапсырыс қолжетімсіз"}</h1>
        <p>{error || (ru ? "Не удалось получить данные заказа." : "Тапсырыс деректерін алу мүмкін болмады.")}</p>
        <div className="order-status-actions">
          <button type="button" onClick={() => void load()}>{ru ? "Повторить" : "Қайталау"}</button>
          <Link href="/account">{ru ? "Мои заказы" : "Менің тапсырыстарым"}</Link>
          <Link href="/restaurants">{ru ? "К ресторанам" : "Мейрамханаларға"}</Link>
        </div>
      </section>
    );
  }

  const currentLabel = isCanceled
    ? ru ? "Заказ отменён" : "Тапсырыстан бас тартылды"
    : labels[status as keyof typeof labels] ||
      (ru ? "Статус заказа" : "Тапсырыс күйі");

  return (
    <section className="order-status-shell section-pad">
      <div className="order-status-hero">
        <span className="kicker">JETKIZ · №{order.number ?? "—"}</span>
        <h1>{currentLabel}</h1>
        <p>{restaurantName}</p>
        {lastUpdated && (
          <small className="order-status-updated">
            {ru ? "Обновлено" : "Жаңартылды"}{" "}
            {lastUpdated.toLocaleTimeString("ru-KZ", { hour: "2-digit", minute: "2-digit" })}
          </small>
        )}
      </div>

      {isCanceled ? (
        <div className="order-status-canceled">
          <strong>{ru ? "Заказ отменён" : "Тапсырыстан бас тартылды"}</strong>
          <p>{ru ? "Новый заказ можно оформить из каталога ресторанов." : "Жаңа тапсырысты мейрамханалар каталогынан рәсімдеуге болады."}</p>
        </div>
      ) : (
        <div className="order-status-grid">
          <div className="order-progress-card">
            <h2>{ru ? "Статус заказа" : "Тапсырыс күйі"}</h2>
            <ol className="order-progress">
              {FLOW.map((flowStatus, index) => {
                const done = index <= activeIndex;
                return (
                  <li className={done ? "is-done" : ""} key={flowStatus}>
                    <span>{index < activeIndex ? "✓" : index + 1}</span>
                    <div>
                      <strong>{labels[flowStatus]}</strong>
                      <small>
                        {index === activeIndex
                          ? ru ? "Текущий этап" : "Ағымдағы кезең"
                          : index < activeIndex
                            ? ru ? "Готово" : "Дайын"
                            : ru ? "Ожидается" : "Күтілуде"}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {order.pickupCode && (
            <aside className="pickup-code-card">
              <small>{ru ? "КОД ПОЛУЧЕНИЯ" : "АЛУ КОДЫ"}</small>
              <strong>{order.pickupCode}</strong>
              <p>
                {ru
                  ? "Покажите код сотруднику ресторана или курьеру только при получении заказа."
                  : "Кодты тек тапсырысты алған кезде мейрамхана қызметкеріне немесе курьерге көрсетіңіз."}
              </p>
            </aside>
          )}
        </div>
      )}

      <div className="order-receipt">
        <div className="order-receipt__header">
          <div>
            <small>{ru ? "Ресторан" : "Мейрамхана"}</small>
            <strong>{restaurantName}</strong>
            <span>{order.restaurant?.address}</span>
          </div>
          <div>
            <small>{ru ? "Получение" : "Алу тәсілі"}</small>
            <strong>
              {String(order.fulfillmentType).toUpperCase() === "PICKUP"
                ? ru ? "Самовывоз" : "Алып кету"
                : ru ? "Доставка" : "Жеткізу"}
            </strong>
            <span>{deliveryAddress}</span>
          </div>
        </div>

        {lines.map((line, index) => {
          const quantity = Number(line.quantity ?? 1);
          const unitPrice = Number(line.price ?? line.unitPrice ?? 0);
          const lineTotal = Number(line.total ?? unitPrice * quantity);
          const title = ru
            ? line.titleRu || line.title || line.name || "Позиция"
            : line.titleKk || line.titleRu || line.title || line.name || "Позиция";

          return (
            <div className="order-receipt__line" key={line.productId || index}>
              <span>{quantity} × {title}</span>
              <strong>{formatKzt(lineTotal)}</strong>
            </div>
          );
        })}

        <div className="order-receipt__total">
          <span>{ru ? "Итого" : "Барлығы"}</span>
          <strong>{total > 0 ? formatKzt(total) : "—"}</strong>
        </div>
      </div>

      <div className="order-status-actions">
        <button type="button" onClick={() => void load(true)}>{ru ? "Обновить статус" : "Күйді жаңарту"}</button>
        <Link href="/account">{ru ? "Мои заказы" : "Менің тапсырыстарым"}</Link>
        <Link href="/restaurants">{ru ? "Все рестораны" : "Барлық мейрамханалар"}</Link>
      </div>
    </section>
  );
}
