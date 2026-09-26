import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { getPublicRestaurants } from "../lib/jetkiz-api";
import { getFeaturedSeoCategories } from "../lib/seo-catalog";
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
  const [restaurants, featuredCategories] = await Promise.all([\n    getPublicRestaurants(),\n    Promise.resolve(getFeaturedSeoCategories()),\n  ]);

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <nav className="seo-category-strip" aria-label="Популярные блюда в Щучинске">
        {featuredCategories.map((category) => (
          <Link key={category.slug} href={`/shchuchinsk/${category.slug}`}>
            {category.label}
          </Link>
        ))}
      </nav>
      <RestaurantsCatalogClient restaurants={restaurants} />
      <SiteFooter />
    </PageShell>
  );
}
