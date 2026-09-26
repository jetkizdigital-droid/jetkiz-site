import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { apiAssetUrl, formatKzt } from "../../lib/jetkiz-api";
import {
  SEO_FOOD_CATEGORIES,
  getSeoCategoryEntries,
  getSeoFoodCategory,
} from "../../lib/seo-catalog";

const BASE_URL = "https://jetkiz.asia";

type PageProps = {
  params: Promise<{ category: string }>;
};


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getSeoFoodCategory(slug);

  if (!category) {
    return {
      title: "Категория не найдена",
      robots: { index: false, follow: false },
    };
  }

  const entries = await getSeoCategoryEntries(category.slug);
  const canonical = `/shchuchinsk/${category.slug}`;

  return {
    title: category.title,
    description: category.description,
    alternates: { canonical },
    keywords: [
      category.h1.toLowerCase(),
      `доставка ${category.label.toLowerCase()} Щучинск`,
      `${category.label.toLowerCase()} Щучинск цены`,
      "доставка еды Щучинск",
      "JETKIZ",
    ],
    robots: {
      index: entries.length > 0,
      follow: true,
    },
    openGraph: {
      title: category.title,
      description: category.description,
      type: "website",
      url: `${BASE_URL}${canonical}`,
      locale: "ru_KZ",
      siteName: "JETKIZ",
    },
  };
}

export default async function FoodCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getSeoFoodCategory(slug);
  if (!category) notFound();

  const entries = await getSeoCategoryEntries(category.slug);
  const visibleEntries = entries.slice(0, 120);
  const restaurantCount = new Set(entries.map((entry) => entry.restaurant.id)).size;
  const canonicalUrl = `${BASE_URL}/shchuchinsk/${category.slug}`;

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "JETKIZ",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Рестораны Щучинска",
        item: `${BASE_URL}/restaurants`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.label,
        item: canonicalUrl,
      },
    ],
  };

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.h1,
    numberOfItems: entries.length,
    itemListElement: visibleEntries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/restaurants/${entry.restaurantSlug}`,
      name: `${entry.item.titleRu} — ${entry.restaurant.nameRu}`,
    })),
  };

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <main className="seo-food-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        {entries.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(itemListStructuredData).replace(/</g, "\\u003c"),
            }}
          />
        )}

        <nav className="seo-breadcrumbs" aria-label="Хлебные крошки">
          <Link href="/">JETKIZ</Link>
          <span>/</span>
          <Link href="/restaurants">Рестораны Щучинска</Link>
          <span>/</span>
          <strong>{category.label}</strong>
        </nav>

        <section className="seo-food-hero">
          <p className="marketplace-eyebrow">JETKIZ · ЩУЧИНСК</p>
          <h1>{category.h1}</h1>
          <p>{category.intro}</p>
          <div className="seo-food-stats">
            <span><strong>{entries.length}</strong> позиций</span>
            <span><strong>{restaurantCount}</strong> заведений</span>
          </div>
        </section>

        <nav className="seo-category-links" aria-label="Популярные блюда в Щучинске">
          {SEO_FOOD_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              className={item.slug === category.slug ? "is-active" : ""}
              href={`/shchuchinsk/${item.slug}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="seo-food-content">
          <div className="restaurant-section-title">
            <h2>Что можно заказать</h2>
            <span>{entries.length}</span>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="marketplace-empty marketplace-empty--compact">
              <strong>Пока нет доступных позиций</strong>
              <p>
                Каталог обновляется из актуальных меню ресторанов. Посмотрите все рестораны
                Щучинска — новые блюда появятся здесь автоматически.
              </p>
              <Link className="seo-empty-link" href="/restaurants">
                Все рестораны
              </Link>
            </div>
          ) : (
            <div className="seo-food-grid">
              {visibleEntries.map((entry) => {
                const image = apiAssetUrl(entry.item.imageUrl);
                const subtitle =
                  entry.item.composition || entry.item.description || entry.item.weight;

                return (
                  <Link
                    className="seo-food-card"
                    href={`/restaurants/${entry.restaurantSlug}`}
                    key={`${entry.restaurant.id}:${entry.item.id}`}
                  >
                    <div className="seo-food-card__image">
                      {image ? (
                        <img
                          src={image}
                          alt={`${entry.item.titleRu} — ${entry.restaurant.nameRu}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="menu-product-card__placeholder">
                          <img src="/jetkiz-logo.svg" alt="" />
                        </div>
                      )}
                    </div>
                    <div className="seo-food-card__body">
                      <strong>{formatKzt(Number(entry.item.price))}</strong>
                      <h2>{entry.item.titleRu}</h2>
                      <p className="seo-food-card__restaurant">{entry.restaurant.nameRu}</p>
                      {subtitle && <p className="seo-food-card__description">{subtitle}</p>}
                      <span>Открыть меню →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="seo-food-copy">
          <h2>{category.label} с актуальными ценами в JETKIZ</h2>
          <p>
            JETKIZ получает названия блюд, состав и цены из меню подключённых заведений.
            На этой странице собраны только доступные сейчас позиции. Для оформления заказа
            откройте карточку ресторана, добавьте блюда в корзину и выберите доставку или
            самовывоз, если ресторан поддерживает этот способ получения.
          </p>
          <p>
            Каталог относится к Щучинску. Если ресторан изменит меню или доступность блюда,
            данные на странице обновятся вместе с меню JETKIZ.
          </p>
        </section>
      </main>
      <SiteFooter />
    </PageShell>
  );
}
