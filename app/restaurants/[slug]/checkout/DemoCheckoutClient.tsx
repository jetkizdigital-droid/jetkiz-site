"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../components/LanguageProvider";
import { formatKzt, restaurantPublicSlug, type PublicRestaurant } from "../../../lib/jetkiz-api";

type CartLine = {
  productId: string;
  titleRu: string;
  titleKk?: string | null;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type DemoOrder = {
  id: string;
  createdAt: string;
  restaurant: { id: string; slug: string; name: string; address?: string | null };
  customer: { name: string; phone: string; comment: string };
  fulfillmentType: "PICKUP";
  paymentMethod: "PAY_ON_PICKUP";
  lines: CartLine[];
  total: number;
  pickupCode: string;
};

function createDemoId() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DEMO-${Date.now().toString().slice(-6)}-${random}`;
}

export function DemoCheckoutClient({ restaurant }: { restaurant: PublicRestaurant }) {
  const { lang } = useLanguage();
  const ru = lang === "ru";
  const router = useRouter();
  const cartKey = `jetkiz-demo-cart:${restaurant.id}`;
  const publicSlug = restaurantPublicSlug(restaurant);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartKey);
      setLines(raw ? JSON.parse(raw) as CartLine[] : []);
    } catch {
      setLines([]);
    }
  }, [cartKey]);

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.price * line.quantity, 0), [lines]);

  const submit = () => {
    const normalizedName = name.trim();
    const normalizedPhone = phone.replace(/[^\d+]/g, "");
    if (!normalizedName) {
      setError(ru ? "Укажите имя." : "Атыңызды көрсетіңіз.");
      return;
    }
    if (normalizedPhone.replace(/\D/g, "").length < 10) {
      setError(ru ? "Укажите корректный номер телефона." : "Дұрыс телефон нөмірін көрсетіңіз.");
      return;
    }
    if (!lines.length) {
      setError(ru ? "Корзина пуста." : "Себет бос.");
      return;
    }

    const id = createDemoId();
    const order: DemoOrder = {
      id,
      createdAt: new Date().toISOString(),
      restaurant: {
        id: restaurant.id,
        slug: publicSlug,
        name: restaurant.nameRu || restaurant.nameKk || "JETKIZ",
        address: restaurant.address,
      },
      customer: { name: normalizedName, phone: phone.trim(), comment: comment.trim() },
      fulfillmentType: "PICKUP",
      paymentMethod: "PAY_ON_PICKUP",
      lines,
      total,
      pickupCode: String(Math.floor(1000 + Math.random() * 9000)),
    };

    try {
      window.localStorage.setItem(`jetkiz-demo-order:${id}`, JSON.stringify(order));
      window.localStorage.removeItem(cartKey);
    } catch {
      setError(ru ? "Не удалось сохранить демонстрационный заказ в браузере." : "Демонстрациялық тапсырысты браузерде сақтау мүмкін болмады.");
      return;
    }

    router.push(`/order/${encodeURIComponent(id)}`);
  };

  return (
    <section className="checkout-shell section-pad">
      <div className="checkout-main">
        <Link className="restaurant-back" href={`/restaurants/${publicSlug}`}>← {ru ? "Вернуться в меню" : "Мәзірге оралу"}</Link>
        <span className="kicker">JETKIZ · DEMO CHECKOUT</span>
        <h1>{ru ? "Оформление самовывоза" : "Алып кетуге тапсырыс рәсімдеу"}</h1>
        <div className="demo-notice">
          <strong>{ru ? "Демонстрационный заказ" : "Демонстрациялық тапсырыс"}</strong>
          <p>{ru ? "Этот заказ сохраняется только в вашем браузере и не передаётся ресторану. Сценарий показывает, как будет работать веб-заказ после подключения боевого checkout." : "Бұл тапсырыс тек браузеріңізде сақталады және мейрамханаға жіберілмейді. Сценарий нақты web-checkout қосылғаннан кейін тапсырыс қалай жұмыс істейтінін көрсетеді."}</p>
        </div>

        <div className="checkout-form">
          <label>{ru ? "Имя" : "Аты"}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={ru ? "Как к вам обращаться" : "Сізге қалай жүгінеміз"} /></label>
          <label>{ru ? "Телефон" : "Телефон"}<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+7 700 000 00 00" /></label>
          <label>{ru ? "Комментарий" : "Түсініктеме"}<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={ru ? "Например: без приборов" : "Мысалы: құралсыз"} rows={4} /></label>
        </div>

        <div className="checkout-options">
          <div><small>{ru ? "Способ получения" : "Алу тәсілі"}</small><strong>{ru ? "Самовывоз" : "Алып кету"}</strong></div>
          <div><small>{ru ? "Оплата" : "Төлем"}</small><strong>{ru ? "При получении" : "Алу кезінде"}</strong></div>
          <div><small>{ru ? "Ресторан" : "Мейрамхана"}</small><strong>{restaurant.nameRu || restaurant.nameKk}</strong><span>{restaurant.address}</span></div>
        </div>

        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="checkout-submit" type="button" onClick={submit}>{ru ? "Оформить демонстрационный заказ" : "Демонстрациялық тапсырысты рәсімдеу"} →</button>
      </div>

      <aside className="checkout-summary">
        <span className="kicker">{ru ? "ВАШ ЗАКАЗ" : "СІЗДІҢ ТАПСЫРЫСЫҢЫЗ"}</span>
        {lines.length === 0 ? <p>{ru ? "Корзина пуста." : "Себет бос."}</p> : lines.map((line) => (
          <div className="checkout-line" key={line.productId}>
            <span>{line.quantity} × {ru ? line.titleRu : line.titleKk || line.titleRu}</span>
            <strong>{formatKzt(line.price * line.quantity)}</strong>
          </div>
        ))}
        <div className="checkout-total"><span>{ru ? "Итого" : "Барлығы"}</span><strong>{formatKzt(total)}</strong></div>
      </aside>
    </section>
  );
}
