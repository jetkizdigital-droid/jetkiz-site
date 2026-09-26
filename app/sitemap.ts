import type { MetadataRoute } from "next";
import { getPublicRestaurants, restaurantPublicSlug } from "./lib/jetkiz-api";
import { getIndexedSeoCategorySlugs } from "./lib/seo-catalog";

const BASE_URL = "https://jetkiz.asia";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, seoCategorySlugs] = await Promise.all([
    getPublicRestaurants(),
    getIndexedSeoCategorySlugs(),
  ]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/restaurants`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shchuchinsk`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/partners/restaurants`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/couriers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/payment`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/offer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/contacts`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const restaurantRoutes: MetadataRoute.Sitemap = restaurants.map((restaurant) => ({
    url: `${BASE_URL}/restaurants/${restaurantPublicSlug(restaurant)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = seoCategorySlugs.map((slug) => ({
    url: `${BASE_URL}/shchuchinsk/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...restaurantRoutes];
}
