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

  const title = `${restaurant.nameRu} — меню, цены и доставка в Щучинске`;
  const description = restaurant.descriptionRu?.trim() ||
    `Меню ресторана ${restaurant.nameRu} в Щучинске: актуальные блюда и цены, доставка и самовывоз через JETKIZ.`;
  const publicSlug = restaurantPublicSlug(restaurant);
  const canonical = `/restaurants/${publicSlug}`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      `${restaurant.nameRu} Щучинск`,
      `${restaurant.nameRu} меню`,
      `${restaurant.nameRu} доставка`,
      `${restaurant.nameRu} цены`,
      "рестораны Щучинск",
      "доставка еды Щучинск",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://jetkiz.asia${canonical}`,
      images: restaurant.coverImageUrl ? [apiAssetUrl(restaurant.coverImageUrl) || ""] : undefined,
      locale: "ru_KZ",
      siteName: "JETKIZ",
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
  const items = menu.items ?? menu.products ?? [];
  const availableItems = items.filter(
    (item) =>
      item.isAvailable !== false &&
      Number.isFinite(Number(item.price)) &&
      Number(item.price) > 0,
  );

  const menuSections = (menu.categories ?? [])
    .map((category) => {
      const sectionItems = availableItems
        .filter((item) => item.categoryId === category.id)
        .slice(0, 80)
        .map((item) => {
          const image = apiAssetUrl(item.imageUrl);
          const description = item.composition || item.description || item.weight;

          return {
            "@type": "MenuItem",
            name: item.titleRu || item.titleKk,
            ...(description ? { description } : {}),
            ...(image ? { image } : {}),
            offers: {
              "@type": "Offer",
              price: Number(item.price),
              priceCurrency: "KZT",
              availability: "https://schema.org/InStock",
              url: canonicalUrl,
            },
          };
        });

      if (sectionItems.length === 0) return null;

      return {
        "@type": "MenuSection",
        name: category.titleRu || category.titleKk,
        hasMenuItem: sectionItems,
      };
    })
    .filter(Boolean);

  const restaurantStructuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: mergedRestaurant.nameRu || mergedRestaurant.nameKk,
    url: canonicalUrl,
    inLanguage: ["ru-KZ", "kk-KZ"],
    ...(cover ? { image: cover } : {}),
    ...(mergedRestaurant.phone ? { telephone: mergedRestaurant.phone } : {}),
    ...(mergedRestaurant.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: mergedRestaurant.address,
            addressLocality: "Щучинск",
            addressRegion: "Акмолинская область",
            addressCountry: "KZ",
          },
        }
      : {}),
    ...(mergedRestaurant.workingHours ? { openingHours: mergedRestaurant.workingHours } : {}),
    hasMenu: {
      "@type": "Menu",
      name: `Меню ${mergedRestaurant.nameRu || mergedRestaurant.nameKk}`,
      url: canonicalUrl,
      ...(menuSections.length > 0 ? { hasMenuSection: menuSections } : {}),
    },
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

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JETKIZ",
        item: "https://jetkiz.asia/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Рестораны Щучинска",
        item: "https://jetkiz.asia/restaurants",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: mergedRestaurant.nameRu || mergedRestaurant.nameKk,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantStructuredData).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c") }}
      />
      <RestaurantMenuClient restaurant={mergedRestaurant} menu={menu} />
      <SiteFooter />
    </PageShell>
  );
}
