const API_BASE_URL = (process.env.JETKIZ_API_BASE_URL || "https://api.jetkiz.asia").replace(/\/$/, "");

export type PublicRestaurant = {
  id: string;
  number?: number;
  slug: string;
  /** Clean website slug derived from the restaurant name. */
  publicSlug?: string;
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
    return Array.isArray(payload.items) ? assignRestaurantPublicSlugs(payload.items) : [];
  } catch (error) {
    console.error("Failed to load public restaurants", error);
    return [];
  }
}

export async function getPublicRestaurantBySlug(slug: string): Promise<PublicRestaurant | null> {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  const restaurants = await getPublicRestaurants();

  const byPublicSlug = restaurants.find(
    (restaurant) => restaurantPublicSlug(restaurant) === normalized,
  );
  if (byPublicSlug) return byPublicSlug;

  // Backward compatibility for links published before clean restaurant URLs.
  const legacyPublicNumber = normalized.match(/-r(\d+)$/)?.[1];
  if (legacyPublicNumber) {
    const number = Number(legacyPublicNumber);
    const byNumber = restaurants.find(
      (restaurant) => Number(restaurant.number) === number,
    );
    if (byNumber) return byNumber;
  }

  // Keep old backend slugs resolvable as aliases as well.
  return (
    restaurants.find(
      (restaurant) => restaurant.slug?.toLowerCase() === normalized,
    ) ?? null
  );
}

export async function getPublicMenu(restaurantId: string): Promise<PublicMenu | null> {
  try {
    return await apiFetch<PublicMenu>(`/restaurants/${encodeURIComponent(restaurantId)}/menu`);
  } catch (error) {
    console.error("Failed to load public restaurant menu", error);
    return null;
  }
}

export function restaurantPublicSlug(
  restaurant: Pick<PublicRestaurant, "publicSlug" | "nameRu" | "slug">,
): string {
  return (
    restaurant.publicSlug ||
    latinSlug(restaurant.nameRu) ||
    latinSlug(restaurant.slug) ||
    "restaurant"
  );
}

function assignRestaurantPublicSlugs(
  restaurants: PublicRestaurant[],
): PublicRestaurant[] {
  const baseById = new Map<string, string>();
  const reservedBases = new Set<string>();

  for (const restaurant of restaurants) {
    const base =
      latinSlug(restaurant.nameRu) ||
      latinSlug(restaurant.slug) ||
      "restaurant";
    baseById.set(restaurant.id, base);
    reservedBases.add(base);
  }

  const groups = new Map<string, PublicRestaurant[]>();
  for (const restaurant of restaurants) {
    const base = baseById.get(restaurant.id) || "restaurant";
    const group = groups.get(base) || [];
    group.push(restaurant);
    groups.set(base, group);
  }

  const publicSlugById = new Map<string, string>();
  const used = new Set<string>();

  for (const [base, group] of groups) {
    const ordered = [...group].sort((left, right) => {
      const leftNumber = Number(left.number);
      const rightNumber = Number(right.number);
      const leftHasNumber = Number.isInteger(leftNumber) && leftNumber > 0;
      const rightHasNumber = Number.isInteger(rightNumber) && rightNumber > 0;

      if (leftHasNumber && rightHasNumber && leftNumber !== rightNumber) {
        return leftNumber - rightNumber;
      }
      if (leftHasNumber !== rightHasNumber) return leftHasNumber ? -1 : 1;
      return left.id.localeCompare(right.id);
    });

    ordered.forEach((restaurant, index) => {
      if (index === 0 && !used.has(base)) {
        publicSlugById.set(restaurant.id, base);
        used.add(base);
        return;
      }

      let suffix = 2;
      let candidate = `${base}-${suffix}`;
      while (used.has(candidate) || reservedBases.has(candidate)) {
        suffix += 1;
        candidate = `${base}-${suffix}`;
      }

      publicSlugById.set(restaurant.id, candidate);
      used.add(candidate);
    });
  }

  return restaurants.map((restaurant) => ({
    ...restaurant,
    publicSlug: publicSlugById.get(restaurant.id) || "restaurant",
  }));
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
