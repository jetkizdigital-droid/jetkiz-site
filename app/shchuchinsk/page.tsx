import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { getSeoCategoryStats } from "../lib/seo-catalog";

const BASE_URL = "https://jetkiz.asia";

export const metadata: Metadata = {
  title: "Еда в Щучинске — блюда, напитки, рестораны и доставка",
  description:
    "Каталог еды и напитков в Щучинске: лагман, плов, суши, пицца, супы, десерты, лимонады, милкшейки, кофе и другие позиции ресторанов JETKIZ.",
  alternates: { canonical: "/shchuchinsk" },
  keywords: [
    "еда Щучинск",
    "доставка еды Щучинск",
    "блюда Щучинск",
    "напитки Щучинск",
    "рестораны Щучинск",
    "JETKIZ",
  ],
  openGraph: {
    title: "Еда в Щучинске — блюда, напитки и рестораны | JETKIZ",
    description:
      "Актуальные блюда и напитки из меню ресторанов Щучинска. Цены, состав и заказ онлайн через JETKIZ.",
    url: `${BASE_URL}/shchuchinsk`,
    type: "website",
    locale: "ru_KZ",
    siteName: "JETKIZ",
  },
};

export default async function ShchuchinskFoodHubPage() {
  const stats = await getSeoCategoryStats();
  const totalItems = stats.reduce((sum, row) => sum + row.itemCount, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Еда и напитки в Щучинске",
    numberOfItems: stats.length,
    itemListElement: stats.map((row, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: row.category.label,
      url: `${BASE_URL}/shchuchinsk/${row.category.slug}`,
    })),
  };

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
        name: "Еда в Щучинске",
        item: `${BASE_URL}/shchuchinsk`,
      },
    ],
  };

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <main className="seo-food-page seo-hub-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        {stats.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
            }}
          />
        )}

        <nav className="seo-breadcrumbs" aria-label="Хлебные крошки">
          <Link href="/">JETKIZ</Link>
          <span>/</span>
          <strong>Еда в Щучинске</strong>
        </nav>

        <section className="seo-food-hero seo-hub-hero">
          <p className="marketplace-eyebrow">JETKIZ · ЩУЧИНСК</p>
          <h1>Еда и напитки в Щучинске</h1>
          <p>
            Выбирайте конкретное блюдо или напиток и смотрите, в каких заведениях JETKIZ
            оно сейчас есть, сколько стоит и что входит в состав.
          </p>
          <div className="seo-food-stats">
            <span><strong>{stats.length}</strong> активных категорий</span>
            <span><strong>{totalItems}</strong> совпадений в меню</span>
          </div>
        </section>

        <section className="seo-hub-content">
          <div className="restaurant-section-title">
            <h2>Блюда и напитки</h2>
            <span>{stats.length}</span>
          </div>

          {stats.length === 0 ? (
            <div className="marketplace-empty marketplace-empty--compact">
              <strong>Каталог обновляется</strong>
              <p>
                Сейчас не удалось получить меню. Рестораны Щучинска по-прежнему доступны в
                основном каталоге.
              </p>
              <Link className="seo-empty-link" href="/restaurants">
                Все рестораны
              </Link>
            </div>
          ) : (
            <div className="seo-hub-grid">
              {stats.map((row) => (
                <Link
                  className="seo-hub-card"
                  href={`/shchuchinsk/${row.category.slug}`}
                  key={row.category.slug}
                >
                  <div>
                    <h2>{row.category.label}</h2>
                    <p>{row.category.h1}</p>
                  </div>
                  <div className="seo-hub-card__meta">
                    <span>{row.itemCount} поз.</span>
                    <span>{row.restaurantCount} завед.</span>
                    <strong>→</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="seo-food-copy">
          <h2>Каталог растёт вместе с меню ресторанов</h2>
          <p>
            JETKIZ не создаёт пустые страницы ради поисковой выдачи. Категория становится
            индексируемой только тогда, когда в подключённых ресторанах реально есть
            доступное блюдо или напиток с актуальной ценой.
          </p>
          <p>
            Если завтра в меню появится новое блюдо — например лагман, бешбармак, мохито,
            милкшейк или том-ям — соответствующая страница автоматически начнёт участвовать
            в каталоге и sitemap.
          </p>
        </section>
      </main>
      <SiteFooter />
    </PageShell>
  );
}
