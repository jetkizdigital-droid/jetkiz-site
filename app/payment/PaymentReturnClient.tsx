"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

type PaymentReturnClientProps = {
  result: "success" | "failure";
};

type PendingPayment = {
  orderId: string;
  cartKey?: string;
  restaurantId?: string;
  restaurantSlug?: string;
  createdAt?: string;
};

type PaymentState = {
  paymentStatus?: string;
  paymentRecordStatus?: string | null;
  fundsSecured?: boolean;
  captured?: boolean;
  checkoutUrl?: string | null;
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

function readPending(): PendingPayment | null {
  try {
    const raw = window.localStorage.getItem("jetkiz:web:pending-payment");
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingPayment;
    return String(value?.orderId ?? "").trim() ? value : null;
  } catch {
    return null;
  }
}

export function PaymentReturnClient({ result }: PaymentReturnClientProps) {
  const appUrl = `jetkiz://payment/return?result=${result}`;
  const [pending, setPending] = useState<PendingPayment | null | undefined>(undefined);
  const [state, setState] = useState<PaymentState | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPending(readPending());
  }, []);

  useEffect(() => {
    if (pending === undefined || pending) return;
    const timer = window.setTimeout(() => {
      window.location.href = appUrl;
    }, 180);
    return () => window.clearTimeout(timer);
  }, [appUrl, pending]);

  useEffect(() => {
    if (!pending?.orderId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = result === "success" ? 15 : 4;

    const check = async () => {
      attempts += 1;
      setChecking(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/payments/orders/${encodeURIComponent(pending.orderId)}`,
          {
            headers: headers(),
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Сессия истекла. Войдите в аккаунт, чтобы проверить заказ.");
          }
          throw new Error("Не удалось проверить статус оплаты.");
        }

        const next = (await response.json()) as PaymentState;
        if (cancelled) return;

        setState(next);
        const paymentStatus = String(next.paymentStatus ?? "").toUpperCase();
        const recordStatus = String(next.paymentRecordStatus ?? "").toUpperCase();
        const paid =
          next.fundsSecured === true ||
          next.captured === true ||
          paymentStatus === "PAID" ||
          paymentStatus === "AUTHORIZED" ||
          recordStatus === "PAID";

        const failed =
          paymentStatus === "FAILED" ||
          recordStatus === "FAILED" ||
          recordStatus === "CANCELED";

        if (paid) {
          if (pending.cartKey) window.localStorage.removeItem(pending.cartKey);
          window.localStorage.removeItem("jetkiz:web:pending-payment");
          setMessage("Оплата подтверждена. Заказ передан в JETKIZ.");
          setChecking(false);
          return;
        }

        if (failed) {
          setMessage("Оплата не завершена. Заказ сохранён, оплату можно повторить.");
          setChecking(false);
          return;
        }

        if (attempts < maxAttempts) {
          window.setTimeout(check, 2000);
          return;
        }

        setMessage(
          result === "success"
            ? "Платёж ещё подтверждается. Это может занять несколько секунд — статус заказа можно открыть ниже."
            : "Оплата не была завершена. Заказ сохранён в вашем аккаунте.",
        );
        setChecking(false);
      } catch (reason) {
        if (cancelled) return;
        setMessage(reason instanceof Error ? reason.message : "Не удалось проверить оплату.");
        setChecking(false);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [pending, result]);

  const paid = useMemo(() => {
    const paymentStatus = String(state?.paymentStatus ?? "").toUpperCase();
    const recordStatus = String(state?.paymentRecordStatus ?? "").toUpperCase();
    return (
      state?.fundsSecured === true ||
      state?.captured === true ||
      paymentStatus === "PAID" ||
      paymentStatus === "AUTHORIZED" ||
      recordStatus === "PAID"
    );
  }, [state]);

  if (pending === undefined) {
    return (
      <main className="payment-return-page">
        <section className="payment-return-card">
          <img src="/jetkiz-logo.svg" alt="JETKIZ" />
          <h1>Проверяем оплату</h1>
        </section>
      </main>
    );
  }

  if (!pending) {
    return (
      <main className="payment-return-page">
        <section className="payment-return-card">
          <img src="/jetkiz-logo.svg" alt="JETKIZ" />
          <h1>Возвращаемся в JETKIZ</h1>
          <p>Если приложение не открылось автоматически, нажмите кнопку ниже.</p>
          <a className="payment-return-primary" href={appUrl}>Открыть JETKIZ</a>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-return-page">
      <section className="payment-return-card">
        <img src="/jetkiz-logo.svg" alt="JETKIZ" />
        <span className={paid ? "payment-return-status is-success" : result === "failure" ? "payment-return-status is-failure" : "payment-return-status"}>
          {paid ? "Оплачено" : checking ? "Проверяем платёж" : result === "failure" ? "Оплата не завершена" : "Статус оплаты"}
        </span>
        <h1>
          {paid
            ? "Заказ оплачен"
            : checking
              ? "Ещё несколько секунд"
              : result === "failure"
                ? "Оплата не прошла"
                : "Заказ сохранён"}
        </h1>
        <p>{message || "JETKIZ сверяет результат напрямую с платёжным сервисом."}</p>

        <div className="payment-return-actions">
          <Link className="payment-return-primary" href={`/order/${encodeURIComponent(pending.orderId)}`}>
            Открыть заказ
          </Link>
          {pending.restaurantSlug && (
            <Link className="payment-return-secondary" href={`/restaurants/${pending.restaurantSlug}`}>
              Вернуться в ресторан
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
