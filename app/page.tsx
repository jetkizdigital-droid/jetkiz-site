import type { Metadata } from "next";
import { PageShell, SiteFooter } from "./components/SiteChrome";
import { getPublicHomeCms, getPublicRestaurants } from "./lib/jetkiz-api";
import { RestaurantsCatalogClient } from "./restaurants/RestaurantsCatalogClient";

export const metadata: Metadata = {
  title: { absolute: "JETKIZ — доставка еды в Щучинске" },
  description:
    "Доставка еды в Щучинске. Рестораны Щучинска, актуальные меню и цены, заказ онлайн и оплата картой через JETKIZ.",
  alternates: { canonical: "/restaurants" },
  openGraph: {
    title: "JETKIZ — доставка еды в Щучинске",
    description:
      "Рестораны Щучинска, актуальные меню и цены. Заказ еды онлайн через JETKIZ.",
    url: "https://jetkiz.asia/restaurants",
  },
};

export default async function Home() {
  const [restaurants, home] = await Promise.all([
    getPublicRestaurants(),
    getPublicHomeCms(),
  ]);

  return (
    <PageShell>
      <RestaurantsCatalogClient restaurants={restaurants} home={home} />
      <SiteFooter />
    </PageShell>
  );
}
