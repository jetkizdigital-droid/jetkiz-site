import type { Metadata } from "next";
import { PageShell, SiteFooter } from "../components/SiteChrome";
import { getPublicHomeCms, getPublicRestaurants } from "../lib/jetkiz-api";
import { RestaurantsCatalogClient } from "./RestaurantsCatalogClient";

export const metadata: Metadata = {
  title: "Доставка еды в Щучинске",
  description:
    "JETKIZ — доставка еды в Щучинске. Рестораны города, актуальные меню и цены, заказ онлайн и оплата картой.",
  alternates: { canonical: "/restaurants" },
  openGraph: {
    title: "JETKIZ — доставка еды в Щучинске",
    description:
      "Рестораны Щучинска, актуальные меню и цены. Заказ еды онлайн через JETKIZ.",
    url: "https://jetkiz.asia/restaurants",
  },
};

export default async function RestaurantsPage() {
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
