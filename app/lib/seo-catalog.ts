import {
  getPublicMenu,
  getPublicRestaurants,
  restaurantPublicSlug,
  type PublicMenuItem,
  type PublicRestaurant,
} from "./jetkiz-api";

export type SeoFoodCategory = {
  slug: string;
  label: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
};

export type SeoCatalogEntry = {
  restaurant: PublicRestaurant;
  restaurantSlug: string;
  item: PublicMenuItem;
};

export const SEO_FOOD_CATEGORIES: SeoFoodCategory[] = [
  {
    slug: "pizza",
    label: "Пицца",
    h1: "Пицца в Щучинске",
    title: "Пицца в Щучинске — доставка, меню и цены",
    description:
      "Пицца в Щучинске из ресторанов JETKIZ: актуальные цены, состав, фото и заказ онлайн с доставкой или самовывозом.",
    intro:
      "Собрали пиццу из меню подключённых ресторанов Щучинска. Сравнивайте цены и состав и переходите прямо в меню ресторана.",
    keywords: ["пицца", "pizza"],
  },
  {
    slug: "sushi",
    label: "Суши и роллы",
    h1: "Суши и роллы в Щучинске",
    title: "Суши и роллы в Щучинске — доставка и цены",
    description:
      "Суши и роллы в Щучинске: актуальные позиции ресторанов JETKIZ, цены, состав и заказ онлайн.",
    intro:
      "Актуальные суши и роллы из меню ресторанов Щучинска в одном каталоге JETKIZ.",
    keywords: ["суши", "ролл", "роллы", "маки", "нигири", "филадельф"],
  },
  {
    slug: "burgers",
    label: "Бургеры",
    h1: "Бургеры в Щучинске",
    title: "Бургеры в Щучинске — доставка, меню и цены",
    description:
      "Бургеры в Щучинске из ресторанов JETKIZ: актуальные цены, состав и заказ онлайн с доставкой или самовывозом.",
    intro:
      "Смотрите бургеры из актуальных меню ресторанов Щучинска и переходите к заказу через JETKIZ.",
    keywords: ["бургер", "бургеры", "burger", "гамбургер", "чизбургер"],
  },
  {
    slug: "shashlik",
    label: "Шашлык",
    h1: "Шашлык в Щучинске",
    title: "Шашлык в Щучинске — доставка, меню и цены",
    description:
      "Шашлык в Щучинске: блюда из актуальных меню ресторанов JETKIZ, цены, состав и заказ онлайн.",
    intro:
      "Шашлык и блюда этой категории из меню подключённых ресторанов Щучинска.",
    keywords: ["шашлык", "кебаб", "люля"],
  },
  {
    slug: "plov",
    label: "Плов",
    h1: "Плов в Щучинске",
    title: "Плов в Щучинске — доставка, меню и цены",
    description:
      "Плов в Щучинске из ресторанов JETKIZ: актуальные цены, состав и возможность заказать онлайн.",
    intro:
      "Плов из актуальных меню ресторанов Щучинска. Цены и состав берутся из JETKIZ.",
    keywords: ["плов", "pilaf", "palov"],
  },
  {
    slug: "coffee",
    label: "Кофе",
    h1: "Кофе в Щучинске",
    title: "Кофе в Щучинске — меню кофеен и цены",
    description:
      "Кофе в Щучинске: американо, капучино, латте и другие позиции из актуальных меню заведений JETKIZ.",
    intro:
      "Кофе из меню заведений Щучинска: смотрите актуальные позиции и цены в JETKIZ.",
    keywords: ["кофе", "coffee", "капучино", "латте", "американо", "эспрессо", "раф"],
  },
];

export function getSeoFoodCategory(slug: string): SeoFoodCategory | null {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  return SEO_FOOD_CATEGORIES.find((category) => category.slug === normalized) ?? null;
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-яәғқңөұүһі0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesCategory(item: PublicMenuItem, category: SeoFoodCategory): boolean {
  const searchable = normalize([
    item.titleRu,
    item.titleKk,
    item.categoryNameRu,
    item.categoryNameKk,
  ].filter(Boolean).join(" "));

  return category.keywords.some((keyword) => searchable.includes(normalize(keyword)));
}

async function loadCatalog(): Promise<SeoCatalogEntry[]> {
  const restaurants = await getPublicRestaurants();

  const rows = await Promise.all(
    restaurants.map(async (restaurant) => {
      const menu = await getPublicMenu(restaurant.id);
      if (!menu) return [] as SeoCatalogEntry[];

      const items = menu.items ?? menu.products ?? [];
      const restaurantSlug = restaurantPublicSlug(restaurant);

      return items
        .filter((item) => item.isAvailable !== false)
        .filter((item) => Number.isFinite(Number(item.price)) && Number(item.price) > 0)
        .map((item) => ({
          restaurant: { ...restaurant, ...menu.restaurant },
          restaurantSlug,
          item,
        }));
    }),
  );

  return rows.flat();
}

export async function getSeoCategoryEntries(slug: string): Promise<SeoCatalogEntry[]> {
  const category = getSeoFoodCategory(slug);
  if (!category) return [];

  const entries = await loadCatalog();

  return entries
    .filter((entry) => matchesCategory(entry.item, category))
    .sort((left, right) => {
      const restaurantCompare = left.restaurant.nameRu.localeCompare(
        right.restaurant.nameRu,
        "ru",
      );
      if (restaurantCompare !== 0) return restaurantCompare;
      return left.item.titleRu.localeCompare(right.item.titleRu, "ru");
    });
}

export async function getIndexedSeoCategorySlugs(): Promise<string[]> {
  const entries = await loadCatalog();

  return SEO_FOOD_CATEGORIES
    .filter((category) => entries.some((entry) => matchesCategory(entry.item, category)))
    .map((category) => category.slug);
}
