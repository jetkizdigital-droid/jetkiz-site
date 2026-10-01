import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import {
  apiAssetUrl,
  formatKzt,
  getPublicHomeCms,
  getPublicMenu,
  getPublicRestaurants,
  restaurantPublicSlug,
  type PublicMenuItem,
} from "../../lib/jetkiz-api";

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

  const entries = (category.products || [])
    .filter((row) => row.isActive !== false && row.product?.isAvailable !== false)
    .map((row) => {
      const restaurant = restaurantById.get(row.product.restaurantId);
      if (!restaurant) return null;

      const menu = menuByRestaurant.get(restaurant.id);
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

      if (!item.titleRu || !Number.isFinite(Number(item.price)) || Number(item.price) <= 0) {
        return null;
      }

      return {
        restaurant: { ...restaurant, ...(menu?.restaurant || {}) },
        restaurantSlug: restaurantPublicSlug(restaurant),
        item,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    home,
    category,
    entries,
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

  const categories = [...(data.home.categories || [])]
    .filter((item) => item.isActive !== false)
    .sort((left, right) => Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0));

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <main className="live-category-page">
        <div className="live-category-page__head">
          <Link href="/restaurants">← Все рестораны</Link>
          <h1>{data.category.titleRu}</h1>
          <p>{data.entries.length} позиций из актуальных меню ресторанов</p>
        </div>

        <nav className="live-category-tabs" aria-label="Категории">
          {categories.map((category) => (
            <Link
              key={category.id}
              className={category.id === data.category.id ? "is-active" : ""}
              href={`/categories/${encodeURIComponent(category.id)}`}
            >
              {category.titleRu}
            </Link>
          ))}
        </nav>

        {data.entries.length === 0 ? (
          <div className="marketplace-empty marketplace-empty--compact">
            <strong>В этой категории пока нет доступных блюд</strong>
            <p>Страница обновляется автоматически из меню ресторанов.</p>
          </div>
        ) : (
          <section className="live-category-grid">
            {data.entries.map(({ restaurant, restaurantSlug, item }) => {
              const image = apiAssetUrl(item.imageUrl);
              const description = item.composition || item.description;

              return (
                <article className="live-category-product" key={`${restaurant.id}:${item.id}`}>
                  <Link
                    className="live-category-product__image"
                    href={`/restaurants/${restaurantSlug}`}
                  >
                    {image ? (
                      <img src={image} alt={item.titleRu} loading="lazy" />
                    ) : (
                      <span className="restaurant-menu-product__placeholder">
                        <img src="/jetkiz-logo.svg" alt="" />
                      </span>
                    )}
                  </Link>

                  <div className="live-category-product__body">
                    <h2>{item.titleRu}</h2>
                    <strong>{formatKzt(Number(item.price))}</strong>
                    <Link
                      className="live-category-product__restaurant"
                      href={`/restaurants/${restaurantSlug}`}
                    >
                      {restaurant.nameRu}
                    </Link>
                    {description && <p>{description}</p>}
                    {item.weight && <small>{item.weight}</small>}
                    <Link
                      className="live-category-product__button"
                      href={`/restaurants/${restaurantSlug}`}
                    >
                      Открыть меню
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <SiteFooter />
    </PageShell>
  );
}
