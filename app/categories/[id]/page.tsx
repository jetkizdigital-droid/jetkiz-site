import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import {
  getPublicHomeCms,
  getPublicMenu,
  getPublicRestaurants,
  restaurantPublicSlug,
  type PublicMenuItem,
} from "../../lib/jetkiz-api";
import {
  CategoryProductsClient,
  type CategoryClientGroup,
  type CategoryClientTab,
} from "./CategoryProductsClient";

type PageProps = { params: Promise<{ id: string }> };

async function loadCategory(id: string) {
  const [home, restaurants] = await Promise.all([
    getPublicHomeCms(),
    getPublicRestaurants(),
  ]);

  const category = (home.categories || []).find(
    (item) => item.id === id && item.isActive !== false,
  );

  if (!category) return null;

  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const restaurantIds = Array.from(
    new Set(
      (category.products || [])
        .filter((row) => row.isActive !== false && row.product?.isAvailable !== false)
        .map((row) => row.product?.restaurantId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const menuRows = await Promise.all(
    restaurantIds.map(async (restaurantId) => [
      restaurantId,
      await getPublicMenu(restaurantId),
    ] as const),
  );
  const menuByRestaurant = new Map(menuRows);

  const groupByRestaurant = new Map<string, CategoryClientGroup>();

  for (const row of category.products || []) {
    if (row.isActive === false || row.product?.isAvailable === false) continue;

    const restaurant = restaurantById.get(row.product.restaurantId);
    if (!restaurant) continue;

    const menu = menuByRestaurant.get(restaurant.id);
    const mergedRestaurant = { ...restaurant, ...(menu?.restaurant || {}) };

    // Keep the web category contract identical to the client app: only
    // products from restaurants that can currently accept an order are shown.
    if (mergedRestaurant.canAcceptOrders !== true) continue;

    const fullItem =
      (menu?.items ?? menu?.products ?? []).find((item) => item.id === row.productId) ?? null;

    const item: PublicMenuItem = fullItem ?? {
      id: row.product.id,
      titleRu: row.product.titleRu || "",
      titleKk: row.product.titleKk,
      price: Number(row.product.price ?? 0),
      imageUrl: row.product.imageUrl,
      isAvailable: row.product.isAvailable !== false,
    };

    if (
      item.isAvailable === false ||
      !item.titleRu ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) <= 0
    ) {
      continue;
    }

    let group = groupByRestaurant.get(mergedRestaurant.id);
    if (!group) {
      group = {
        restaurant: {
          id: mergedRestaurant.id,
          slug: restaurantPublicSlug(mergedRestaurant),
          nameRu: mergedRestaurant.nameRu,
          nameKk: mergedRestaurant.nameKk,
          address: mergedRestaurant.address,
        },
        items: [],
      };
      groupByRestaurant.set(mergedRestaurant.id, group);
    }

    group.items.push({
      id: item.id,
      titleRu: item.titleRu,
      titleKk: item.titleKk,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      description: item.composition || item.description || null,
      weight: item.weight || null,
    });
  }

  const categories: CategoryClientTab[] = [...(home.categories || [])]
    .filter((item) => item.isActive !== false)
    .sort((left, right) => Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0))
    .map((item) => ({
      id: item.id,
      titleRu: item.titleRu,
      titleKk: item.titleKk,
    }));

  return {
    category: {
      id: category.id,
      titleRu: category.titleRu,
      titleKk: category.titleKk,
    } satisfies CategoryClientTab,
    categories,
    groups: Array.from(groupByRestaurant.values()),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadCategory(id);
  if (!data) return { title: "Категория не найдена — JETKIZ" };

  const title = `${data.category.titleRu} в Щучинске — JETKIZ`;
  const description = `${data.category.titleRu}: актуальные блюда и цены из подключённых ресторанов JETKIZ.`;

  return {
    title,
    description,
    alternates: { canonical: `/categories/${encodeURIComponent(data.category.id)}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadCategory(id);
  if (!data) notFound();

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <CategoryProductsClient
        category={data.category}
        categories={data.categories}
        groups={data.groups}
      />
      <SiteFooter />
    </PageShell>
  );
}
