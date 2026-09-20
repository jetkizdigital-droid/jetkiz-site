import type { Metadata } from "next";
import { PageShell, SiteFooter, SiteHeader } from "./components/SiteChrome";
import { getPublicRestaurants } from "./lib/jetkiz-api";
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
  const restaurants = await getPublicRestaurants();

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <RestaurantsCatalogClient restaurants={restaurants} />
      <SiteFooter />
    </PageShell>
  );
}
