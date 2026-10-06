import type { Metadata } from "next";
import { PageShell, SiteFooter } from "./components/SiteChrome";
import {
  getPinnedPublicRestaurantIds,
  getPublicHomeCms,
  getPublicRestaurants,
} from "./lib/jetkiz-api";
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
  const [restaurants, home, pinnedRestaurantIds] = await Promise.all([
    getPublicRestaurants(),
    getPublicHomeCms(),
    getPinnedPublicRestaurantIds(),
  ]);

  return (
    <PageShell>
      <RestaurantsCatalogClient
        restaurants={restaurants}
        home={home}
        pinnedRestaurantIds={pinnedRestaurantIds}
      />
      <SiteFooter />
    </PageShell>
  );
}
