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

function seoCategory(
  slug: string,
  label: string,
  keywords: string[],
  copy?: Partial<Pick<SeoFoodCategory, "h1" | "title" | "description" | "intro">>,
): SeoFoodCategory {
  const h1 = copy?.h1 ?? `${label} в Щучинске`;
  return {
    slug,
    label,
    h1,
    title: copy?.title ?? `${h1} — доставка, меню и цены`,
    description:
      copy?.description ??
      `${h1}: актуальные позиции ресторанов JETKIZ, цены, состав, фото и заказ онлайн с доставкой или самовывозом.`,
    intro:
      copy?.intro ??
      `Собрали ${label.toLowerCase()} из актуальных меню подключённых заведений Щучинска. Сравнивайте цены и переходите прямо в меню ресторана.`,
    keywords,
  };
}

/**
 * Curated local-search taxonomy.
 *
 * We intentionally keep a broad dictionary here, but only categories that have
 * real, currently available menu items are indexable and included in sitemap.xml.
 * This gives JETKIZ wide query coverage without generating empty doorway pages.
 */
export const SEO_FOOD_CATEGORIES: SeoFoodCategory[] = [
  // Pizza
  seoCategory("pizza", "Пицца", ["пицца", "pizza"]),
  seoCategory("pepperoni-pizza", "Пицца Пепперони", ["пепперони", "pepperoni"]),
  seoCategory("margherita-pizza", "Пицца Маргарита", ["маргарита", "margherita"]),
  seoCategory("four-cheese-pizza", "Пицца 4 сыра", ["4 сыра", "четыре сыра", "four cheese", "4 cheese"]),

  // Sushi / Japanese
  seoCategory("sushi", "Суши", ["суши", "sushi", "нигири", "nigiri", "маки", "maki"]),
  seoCategory("rolls", "Роллы", ["ролл", "роллы", "roll", "rolls", "филадельф", "калифорни"]),
  seoCategory("baked-rolls", "Запечённые роллы", ["запеченный ролл", "запеченные роллы", "запечённый ролл", "запечённые роллы"]),
  seoCategory("tempura-rolls", "Темпура роллы", ["темпура ролл", "темпура", "tempura roll"]),
  seoCategory("poke", "Поке", ["поке", "poke"]),

  // Fast food
  seoCategory("burgers", "Бургеры", ["бургер", "бургеры", "burger", "гамбургер"]),
  seoCategory("cheeseburgers", "Чизбургеры", ["чизбургер", "cheeseburger"]),
  seoCategory("shawarma", "Шаурма", ["шаурма", "шаверма", "shaurma", "shawarma"]),
  seoCategory("doner", "Донер", ["донер", "донэр", "doner", "döner"]),
  seoCategory("hot-dogs", "Хот-доги", ["хот дог", "хот-дог", "hot dog"]),
  seoCategory("sandwiches", "Сэндвичи", ["сэндвич", "сендвич", "sandwich"]),
  seoCategory("club-sandwiches", "Клаб-сэндвичи", ["клаб сэндвич", "клаб-сэндвич", "club sandwich"]),
  seoCategory("panini", "Панини", ["панини", "panini"]),
  seoCategory("wraps", "Роллы и врапы", ["врап", "wrap", "тортилья"]),
  seoCategory("fried-chicken", "Жареная курица", ["жареная курица", "fried chicken", "хрустящая курица"]),
  seoCategory("chicken-wings", "Куриные крылья", ["крылыш", "крылья", "chicken wings", "wing"]),
  seoCategory("nuggets", "Наггетсы", ["наггетс", "nugget"]),
  seoCategory("fries", "Картофель фри", ["картофель фри", "фри", "french fries"]),
  seoCategory("potato-wedges", "Картофельные дольки", ["картофельные дольки", "дольки картоф", "по деревенски", "по-деревенски"]),
  seoCategory("snacks", "Закуски", ["закуски", "закуска", "snacks", "стартер"]),
  seoCategory("combo", "Комбо", ["комбо", "combo", "набор"]),

  // Central Asian / Kazakh / Uzbek / Uyghur
  seoCategory("lagman", "Лагман", ["лагман", "lagman", "лағман"]),
  seoCategory("plov", "Плов", ["плов", "pilaf", "palov", "ош"]),
  seoCategory("manty", "Манты", ["манты", "манта", "manty", "мәнті"]),
  seoCategory("beshbarmak", "Бешбармак", ["бешбармак", "бесбармак", "бешпармак", "ет", "бесбармақ"]),
  seoCategory("kuyrdak", "Куырдак", ["куырдак", "қуырдақ", "куурдак"]),
  seoCategory("kazy", "Казы", ["казы", "қазы", "kazy"]),
  seoCategory("baursak", "Баурсаки", ["баурсак", "бауырсак", "бауырсақ"]),
  seoCategory("samsa", "Самса", ["самса", "samsa"]),
  seoCategory("chebureki", "Чебуреки", ["чебурек", "чебуреки"]),
  seoCategory("pelmeni", "Пельмени", ["пельмени", "пельмень"]),
  seoCategory("vareniki", "Вареники", ["вареники", "вареник"]),

  // Georgian / Caucasus
  seoCategory("khinkali", "Хинкали", ["хинкали", "khinkali"]),
  seoCategory("khachapuri", "Хачапури", ["хачапури", "khachapuri"]),
  seoCategory("shashlik", "Шашлык", ["шашлык", "шашлыки"]),
  seoCategory("kebab", "Кебаб", ["кебаб", "kebab"]),
  seoCategory("lyulya-kebab", "Люля-кебаб", ["люля", "люля кебаб", "люля-кебаб"]),

  // Meat / fish
  seoCategory("steaks", "Стейки", ["стейк", "steak"]),
  seoCategory("meat", "Мясные блюда", ["мясные блюда", "мясо", "говядина", "телятина"]),
  seoCategory("beef", "Блюда из говядины", ["говядина", "beef"]),
  seoCategory("chicken", "Блюда из курицы", ["курица", "куриное", "куриная", "chicken"]),
  seoCategory("fish", "Рыбные блюда", ["рыба", "рыбное", "fish"]),
  seoCategory("seafood", "Морепродукты", ["морепродукт", "seafood"]),
  seoCategory("salmon", "Лосось", ["лосось", "семга", "сёмга", "salmon"]),
  seoCategory("shrimp", "Креветки", ["кревет", "shrimp", "prawn"]),

  // Pasta / noodles / Asian hot dishes
  seoCategory("pasta", "Паста", ["паста", "pasta", "спагетти"]),
  seoCategory("carbonara", "Карбонара", ["карбонара", "carbonara"]),
  seoCategory("bolognese", "Болоньезе", ["болоньезе", "bolognese"]),
  seoCategory("noodles", "Лапша", ["лапша", "noodle", "удон"]),
  seoCategory("wok", "WOK", ["wok", "вок", "удон", "соба"]),
  seoCategory("ramen", "Рамен", ["рамен", "ramen"]),

  // Soups
  seoCategory("soups", "Супы", ["суп", "супы", "soup"]),
  seoCategory("borscht", "Борщ", ["борщ", "borscht"]),
  seoCategory("solyanka", "Солянка", ["солянка"]),
  seoCategory("lentil-soup", "Чечевичный суп", ["чечевич", "мерджимек", "mercimek"]),
  seoCategory("cream-soup", "Крем-супы", ["крем суп", "крем-суп", "суп пюре", "суп-пюре"]),
  seoCategory("tom-yum", "Том-ям", ["том ям", "том-ям", "томям", "tom yum"]),

  // Salads / sides
  seoCategory("salads", "Салаты", ["салат", "салаты", "salad"]),
  seoCategory("caesar", "Салат Цезарь", ["цезарь", "caesar"]),
  seoCategory("greek-salad", "Греческий салат", ["греческий салат", "greek salad"]),
  seoCategory("side-dishes", "Гарниры", ["гарнир", "гарниры"]),
  seoCategory("rice", "Рис", ["рис", "rice"]),
  seoCategory("mashed-potatoes", "Картофельное пюре", ["картофельное пюре", "пюре"]),
  seoCategory("bread", "Хлеб", ["хлеб", "лепешка", "лепёшка", "bread"]),
  seoCategory("sauces", "Соусы", ["соус", "соусы", "sauce"]),

  // Breakfast / lunch
  seoCategory("breakfasts", "Завтраки", ["завтрак", "завтраки", "breakfast"]),
  seoCategory("business-lunch", "Бизнес-ланчи", ["бизнес ланч", "бизнес-ланч", "business lunch"]),
  seoCategory("lunches", "Обеды", ["обед", "обеды", "ланч", "lunch"]),
  seoCategory("omelette", "Омлет", ["омлет", "omelette", "omelet"]),
  seoCategory("scrambled-eggs", "Яичница", ["яичница", "глазунья", "scrambled egg"]),
  seoCategory("porridge", "Каши", ["каша", "каши", "овсян", "рисовая каша", "манная каша"]),
  seoCategory("syrniki", "Сырники", ["сырник", "сырники"]),
  seoCategory("pancakes", "Блины", ["блин", "блины", "pancake", "crepe"]),
  seoCategory("toast", "Тосты", ["тост", "toast"]),

  // Bakery / desserts
  seoCategory("desserts", "Десерты", ["десерт", "десерты", "dessert"]),
  seoCategory("cakes", "Торты", ["торт", "торты", "cake"]),
  seoCategory("cheesecake", "Чизкейк", ["чизкейк", "cheesecake"]),
  seoCategory("tiramisu", "Тирамису", ["тирамису", "tiramisu"]),
  seoCategory("brownies", "Брауни", ["брауни", "brownie"]),
  seoCategory("donuts", "Пончики", ["пончик", "донат", "donut"]),
  seoCategory("ice-cream", "Мороженое", ["морожен", "ice cream"]),
  seoCategory("waffles", "Вафли", ["вафл", "waffle"]),
  seoCategory("croissants", "Круассаны", ["круассан", "croissant"]),
  seoCategory("bakery", "Выпечка", ["выпечка", "булочка", "слойка", "печенье"]),

  // Drinks — broad
  seoCategory("drinks", "Напитки", ["напитки", "напиток", "beverage", "drinks"]),
  seoCategory("cold-drinks", "Холодные напитки", ["холодные напитки", "холодный напиток", "газированный напиток"]),
  seoCategory("lemonades", "Лимонады", ["лимонад", "lemonade"]),
  seoCategory("milkshakes", "Милкшейки", ["милкшейк", "милк шейк", "milkshake", "молочный коктейль"]),
  seoCategory("smoothies", "Смузи", ["смузи", "smoothie"]),
  seoCategory("mojito", "Мохито", ["мохито", "mojito"]),
  seoCategory("non-alcoholic-cocktails", "Безалкогольные коктейли", ["безалкогольный коктейль", "безалкогольные коктейли", "mocktail"]),
  seoCategory("juices", "Соки", ["сок", "соки", "juice"]),
  seoCategory("fresh-juices", "Фреши", ["фреш", "fresh juice", "свежевыжат"]),
  seoCategory("soda", "Газированные напитки", ["газировка", "газированный", "газированные напитки"]),
  seoCategory("cola", "Cola", ["coca cola", "coca-cola", "pepsi", "кола", "cola"]),
  seoCategory("water", "Вода", ["вода", "water"]),

  // Tea / coffee
  seoCategory("tea", "Чай", ["чай", "tea"]),
  seoCategory("iced-tea", "Холодный чай", ["холодный чай", "ice tea", "iced tea"]),
  seoCategory("coffee", "Кофе", ["кофе", "coffee"]),
  seoCategory("iced-coffee", "Холодный кофе", ["холодный кофе", "ice coffee", "iced coffee", "айс кофе"]),
  seoCategory("cappuccino", "Капучино", ["капучино", "cappuccino"]),
  seoCategory("latte", "Латте", ["латте", "latte"]),
  seoCategory("americano", "Американо", ["американо", "americano"]),
  seoCategory("espresso", "Эспрессо", ["эспрессо", "espresso"]),
  seoCategory("raf", "Раф кофе", ["раф", "raf coffee"]),
  seoCategory("cocoa", "Какао", ["какао", "cocoa"]),
  seoCategory("hot-chocolate", "Горячий шоколад", ["горячий шоколад", "hot chocolate"]),
  seoCategory("matcha", "Матча", ["матча", "matcha"]),
  seoCategory("bubble-tea", "Bubble Tea", ["bubble tea", "бабл ти", "бабл-ти"]),

  // Traditional / dairy drinks
  seoCategory("kompot", "Компот", ["компот"]),
  seoCategory("mors", "Морс", ["морс"]),
  seoCategory("ayran", "Айран", ["айран", "ayran"]),
  seoCategory("kefir", "Кефир", ["кефир", "kefir"]),
  seoCategory("energy-drinks", "Энергетические напитки", ["энергетик", "energy drink", "red bull", "burn"]),

  // Menu intent / cuisine pages
  seoCategory("kids-menu", "Детское меню", ["детское меню", "для детей", "kids menu"]),
  seoCategory("vegetarian", "Вегетарианские блюда", ["вегетариан", "vegetarian"]),
  seoCategory("kazakh-cuisine", "Казахская кухня", ["казахская кухня", "қазақ тағам", "национальные блюда"]),
  seoCategory("uzbek-cuisine", "Узбекская кухня", ["узбекская кухня", "узбекские блюда"]),
  seoCategory("uyghur-cuisine", "Уйгурская кухня", ["уйгурская кухня", "уйгурские блюда"]),
  seoCategory("georgian-cuisine", "Грузинская кухня", ["грузинская кухня", "грузинские блюда"]),
  seoCategory("japanese-cuisine", "Японская кухня", ["японская кухня", "японские блюда"]),
  seoCategory("korean-cuisine", "Корейская кухня", ["корейская кухня", "корейские блюда"]),
  seoCategory("chinese-cuisine", "Китайская кухня", ["китайская кухня", "китайские блюда"]),
  seoCategory("italian-cuisine", "Итальянская кухня", ["итальянская кухня", "итальянские блюда"]),
  seoCategory("asian-cuisine", "Азиатская кухня", ["азиатская кухня", "азиатские блюда"]),
  seoCategory("european-cuisine", "Европейская кухня", ["европейская кухня", "европейские блюда"]),
  seoCategory("fast-food", "Фастфуд", ["фастфуд", "fast food", "fastfood"]),
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
