"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../components/LanguageProvider";
import { formatKzt } from "../../lib/jetkiz-api";

type DemoOrder = {
  id: string;
  createdAt: string;
  restaurant: { id: string; slug: string; name: string; address?: string | null };
  fulfillmentType: "PICKUP";
  paymentMethod: "PAY_ON_PICKUP";
  lines: Array<{
    productId: string;
    titleRu: string;
    titleKk?: string | null;
    price: number;
    quantity: number;
  }>;
  total: number;
  pickupCode: string;
};

const DEMO_STAGES = [0, 7, 15, 24];
const DEMO_ORDER_TTL_MS = 24 * 60 * 60 * 1000;

export function DemoOrderStatusClient({ id }: { id: string }) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const storageKey = `jetkiz-demo-order:${id}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setOrder(null);
        return;
      }
      const parsed = JSON.parse(raw) as DemoOrder;
      const createdAt = new Date(parsed.createdAt).getTime();
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > DEMO_ORDER_TTL_MS) {
        window.localStorage.removeItem(storageKey);
        setOrder(null);
        return;
      }
      setOrder(parsed);
    } catch {
      setOrder(null);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStage = useMemo(() => {
    if (!order) return 0;
    const elapsed = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 1000));
    if (elapsed >= DEMO_STAGES[3]) return 3;
    if (elapsed >= DEMO_STAGES[2]) return 2;
    if (elapsed >= DEMO_STAGES[1]) return 1;
    return 0;
  }, [now, order]);

  if (order === undefined) {
    return <section className="order-status-shell section-pad"><p>{ru ? "Загрузка заказа…" : "Тапсырыс жүктелуде…"}</p></section>;
  }

  if (!order) {
    return (
      <section className="order-status-shell section-pad">
        <span className="kicker">JETKIZ · DEMO</span>
        <h1>{ru ? "Заказ не найден" : "Тапсырыс табылмады"}</h1>
        <p>{ru ? "Демонстрационный заказ хранится только в этом браузере и автоматически удаляется через 24 часа." : "Демонстрациялық тапсырыс тек осы браузерде сақталады және 24 сағаттан кейін автоматты түрде жойылады."}</p>
        <Link className="button button--dark" href="/restaurants">{ru ? "К ресторанам" : "Мейрамханаларға"}</Link>
      </section>
    );
  }

  const stages = ru
    ? ["Заказ создан", "Принят", "Готовится", "Можно забирать"]
    : ["Тапсырыс жасалды", "Қабылданды", "Дайындалуда", "Алып кетуге болады"];

  return (
    <section className="order-status-shell section-pad">
      <div className="order-status-hero">
        <span className="kicker">JETKIZ · {order.id}</span>
        <h1>{activeStage === 3 ? (ru ? "Можно забирать" : "Алып кетуге болады") : stages[activeStage]}</h1>
        <p>{order.restaurant.name}</p>
      </div>

      <div className="demo-notice">
        <strong>{ru ? "Это демонстрация интерфейса" : "Бұл интерфейс демонстрациясы"}</strong>
        <p>{ru ? "Заказ не передан ресторану и не создан в backend JETKIZ. Статусы меняются автоматически только для демонстрации будущего веб-сценария." : "Тапсырыс мейрамханаға жіберілмеді және JETKIZ backend жүйесінде жасалмады. Күйлер болашақ web-сценарийді көрсету үшін ғана автоматты түрде өзгереді."}</p>
      </div>

      <div className="order-status-grid">
        <div className="order-progress-card">
          <h2>{ru ? "Статус заказа" : "Тапсырыс күйі"}</h2>
          <ol className="order-progress">
            {stages.map((stage, index) => (
              <li className={index <= activeStage ? "is-done" : ""} key={stage}>
                <span>{index < activeStage ? "✓" : index + 1}</span>
                <div><strong>{stage}</strong><small>{index === 3 ? (ru ? "Покажите код при получении" : "Алу кезінде кодты көрсетіңіз") : ru ? "Демонстрационный этап" : "Демонстрациялық кезең"}</small></div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="pickup-code-card">
          <small>{ru ? "КОД САМОВЫВОЗА" : "АЛЫП КЕТУ КОДЫ"}</small>
          <strong>{order.pickupCode}</strong>
          <p>{ru ? "В реальном сценарии этот код подтверждает выдачу заказа." : "Нақты сценарийде бұл код тапсырыстың берілгенін растайды."}</p>
        </aside>
      </div>

      <div className="order-receipt">
        <div className="order-receipt__header">
          <div><small>{ru ? "Ресторан" : "Мейрамхана"}</small><strong>{order.restaurant.name}</strong><span>{order.restaurant.address}</span></div>
          <div><small>{ru ? "Получение" : "Алу"}</small><strong>{ru ? "Самовывоз" : "Алып кету"}</strong><span>{ru ? "Оплата при получении" : "Алу кезінде төлем"}</span></div>
        </div>
        {order.lines.map((line) => (
          <div className="order-receipt__line" key={line.productId}>
            <span>{line.quantity} × {ru ? line.titleRu : line.titleKk || line.titleRu}</span>
            <strong>{formatKzt(line.price * line.quantity)}</strong>
          </div>
        ))}
        <div className="order-receipt__total"><span>{ru ? "Итого" : "Барлығы"}</span><strong>{formatKzt(order.total)}</strong></div>
      </div>

      <div className="order-status-actions">
        <Link href={`/restaurants/${order.restaurant.slug}`}>{ru ? "Вернуться в меню" : "Мәзірге оралу"}</Link>
        <Link href="/restaurants">{ru ? "Все рестораны" : "Барлық мейрамханалар"}</Link>
      </div>
    </section>
  );
}
