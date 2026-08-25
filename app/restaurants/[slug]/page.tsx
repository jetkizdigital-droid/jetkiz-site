import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { getPublicMenu, getPublicRestaurantBySlug } from "../../lib/jetkiz-api";
import { RestaurantMenuClient } from "./RestaurantMenuClient";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) return { title: "Ресторан не найден — JETKIZ" };

  const title = `${restaurant.nameRu} — меню и самовывоз в Щучинске | JETKIZ`;
  const description = restaurant.descriptionRu?.trim() ||
    `Меню ресторана ${restaurant.nameRu} в Щучинске: актуальные блюда, цены, режим работы и демонстрационное оформление самовывоза через JETKIZ.`;

  return {
    title,
    description,
    alternates: { canonical: `/restaurants/${restaurant.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const menu = await getPublicMenu(restaurant.id);
  if (!menu) notFound();

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <RestaurantMenuClient restaurant={{ ...restaurant, ...menu.restaurant }} menu={menu} />
      <SiteFooter />
    </PageShell>
  );
}
