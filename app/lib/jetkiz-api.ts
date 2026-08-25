const API_BASE_URL = (process.env.JETKIZ_API_BASE_URL || "https://api.jetkiz.asia").replace(/\/$/, "");

export type PublicRestaurant = {
  id: string;
  number?: number;
  slug: string;
  nameRu: string;
  nameKk?: string | null;
  phone?: string | null;
  address?: string | null;
  workingHours?: string | null;
  descriptionRu?: string | null;
  descriptionKk?: string | null;
  coverImageUrl?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  status?: string | null;
  isAcceptingOrders?: boolean;
  isOpenNow?: boolean;
  canAcceptOrders?: boolean;
  isPickupEnabled?: boolean;
};

export type PublicMenuCategory = {
  id: string;
  code?: string | null;
  titleRu: string;
  titleKk?: string | null;
  sortOrder?: number;
  iconUrl?: string | null;
};

export type PublicMenuItem = {
  id: string;
  titleRu: string;
  titleKk?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId?: string | null;
  categoryNameRu?: string | null;
  categoryNameKk?: string | null;
  categoryCode?: string | null;
  categorySortOrder?: number;
  weight?: string | null;
  composition?: string | null;
  description?: string | null;
  isDrink?: boolean;
};

export type PublicMenu = {
  restaurant: PublicRestaurant;
  categories: PublicMenuCategory[];
  items: PublicMenuItem[];
  products?: PublicMenuItem[];
};

async function apiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
        "X-App": "website",
        "X-Platform": "web",
        "X-Locale": "ru",
        "X-Timezone": "Asia/Almaty",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`JETKIZ API ${response.status}: ${path}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPublicRestaurants(): Promise<PublicRestaurant[]> {
  try {
    const payload = await apiFetch<{ items?: PublicRestaurant[] }>("/restaurants/public/all");
    return Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    console.error("Failed to load public restaurants", error);
    return [];
  }
}

export async function getPublicRestaurantBySlug(slug: string): Promise<PublicRestaurant | null> {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const restaurants = await getPublicRestaurants();
  const publicNumber = normalized.match(/-r(\d+)$/)?.[1];

  if (publicNumber) {
    const number = Number(publicNumber);
    const byNumber = restaurants.find((restaurant) => Number(restaurant.number) === number);
    if (byNumber) return byNumber;
  }

  return restaurants.find((restaurant) =>
    restaurant.slug?.toLowerCase() === normalized || restaurantPublicSlug(restaurant) === normalized,
  ) ?? null;
}

export async function getPublicMenu(restaurantId: string): Promise<PublicMenu | null> {
  try {
    return await apiFetch<PublicMenu>(`/restaurants/${encodeURIComponent(restaurantId)}/menu`);
  } catch (error) {
    console.error("Failed to load public restaurant menu", error);
    return null;
  }
}

export function restaurantPublicSlug(restaurant: Pick<PublicRestaurant, "number" | "nameRu" | "slug">): string {
  const brand = latinSlug(restaurant.nameRu) || "restaurant";
  const number = Number(restaurant.number);
  if (Number.isInteger(number) && number > 0) return `${brand}-r${number}`;
  return restaurant.slug;
}

function latinSlug(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya", ь: "", ъ: "",
    ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
  };

  return value
    .toLowerCase()
    .split("")
    .map((character) => map[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function apiAssetUrl(value?: string | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE_URL}/${raw.replace(/^\/+/, "")}`;
}

export function formatKzt(value: number): string {
  return `${new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 }).format(value)} ₸`;
}
