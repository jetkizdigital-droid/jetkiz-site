import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { apiAssetUrl, getPublicMenu, getPublicRestaurantBySlug, restaurantPublicSlug } from "../../lib/jetkiz-api";
import { RestaurantMenuClient } from "./RestaurantMenuClient";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) return { title: "Ресторан не найден — JETKIZ" };

  const title = `${restaurant.nameRu} — заказать еду в Щучинске`;
  const description = restaurant.descriptionRu?.trim() ||
    `Меню ресторана ${restaurant.nameRu} в Щучинске: актуальные блюда и цены, доставка и самовывоз через JETKIZ.`;
  const publicSlug = restaurantPublicSlug(restaurant);

  return {
    title,
    description,
    alternates: { canonical: `/restaurants/${publicSlug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: restaurant.coverImageUrl ? [apiAssetUrl(restaurant.coverImageUrl) || ""] : undefined,
    },
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const publicSlug = restaurantPublicSlug(restaurant);
  const requestedSlug = decodeURIComponent(slug).trim().toLowerCase();
  if (requestedSlug !== publicSlug) {
    redirect(`/restaurants/${publicSlug}`);
  }

  const menu = await getPublicMenu(restaurant.id);
  if (!menu) notFound();

  const mergedRestaurant = { ...restaurant, ...menu.restaurant };
  const canonicalUrl = `https://jetkiz.asia/restaurants/${publicSlug}`;
  const cover = apiAssetUrl(mergedRestaurant.coverImageUrl);
  const ratingCount = Number(mergedRestaurant.ratingCount ?? 0);
  const ratingAvg = Number(mergedRestaurant.ratingAvg ?? 0);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: mergedRestaurant.nameRu || mergedRestaurant.nameKk,
    url: canonicalUrl,
    ...(cover ? { image: cover } : {}),
    ...(mergedRestaurant.phone ? { telephone: mergedRestaurant.phone } : {}),
    ...(mergedRestaurant.address ? { address: mergedRestaurant.address } : {}),
    ...(mergedRestaurant.workingHours ? { openingHours: mergedRestaurant.workingHours } : {}),
    hasMenu: canonicalUrl,
    ...(ratingCount > 0 && ratingAvg > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg,
            ratingCount,
          },
        }
      : {}),
  };

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <RestaurantMenuClient restaurant={mergedRestaurant} menu={menu} />
      <SiteFooter />
    </PageShell>
  );
}
