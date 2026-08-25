import type { Metadata } from "next";
import { PageShell, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { getPublicRestaurants } from "../lib/jetkiz-api";
import { RestaurantsCatalogClient } from "./RestaurantsCatalogClient";

export const metadata: Metadata = {
  title: "Рестораны Щучинска — меню и самовывоз | JETKIZ",
  description:
    "Рестораны Щучинска в JETKIZ: актуальные меню, цены, режим работы и оформление демонстрационного заказа на самовывоз.",
  alternates: { canonical: "/restaurants" },
};

export default async function RestaurantsPage() {
  const restaurants = await getPublicRestaurants();

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <RestaurantsCatalogClient restaurants={restaurants} />
      <SiteFooter />
    </PageShell>
  );
}
