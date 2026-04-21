import { AppError } from '../../common/appError.js';

const THEMEALDB_BASE_URL = process.env.THEMEALDB_BASE_URL ?? 'https://www.themealdb.com/api/json/v1/1';
const CATALOG_CACHE_TTL_MS = Number(process.env.THEMEALDB_CACHE_TTL_MS ?? 15 * 60 * 1000);
const THEMEALDB_REQUEST_DELAY_MS = Number(process.env.THEMEALDB_REQUEST_DELAY_MS ?? 50);
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

const cacheState = {
  expiresAt: 0,
  categories: [],
  catalog: [],
};

const fetchFromThemealdb = async (pathWithQuery) => {
  const response = await fetch(`${THEMEALDB_BASE_URL}${pathWithQuery}`);

  if (!response.ok) {
    throw new AppError('Nie udało się pobrać danych z TheMealDB', 502);
  }

  return response.json();
};

const mapCatalogItem = (meal) => ({
  externalId: meal.idMeal,
  name: meal.strMeal,
  imageUrl: meal.strMealThumb ?? '',
  category: meal.strCategory ?? 'Other',
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const refreshCatalogCache = async () => {
  const categoriesPayload = await fetchFromThemealdb('/categories.php');
  const mealsByLetter = [];

  for (const [index, letter] of LETTERS.entries()) {
    const payload = await fetchFromThemealdb(`/search.php?f=${letter}`);
    mealsByLetter.push(payload);

    if (index < LETTERS.length - 1 && THEMEALDB_REQUEST_DELAY_MS > 0) {
      await delay(THEMEALDB_REQUEST_DELAY_MS);
    }
  }

  const categories = (categoriesPayload.categories ?? [])
    .map((item) => item.strCategory)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const catalogMap = new Map();

  mealsByLetter.forEach((payload) => {
    (payload.meals ?? []).forEach((meal) => {
      if (!catalogMap.has(meal.idMeal)) {
        catalogMap.set(meal.idMeal, mapCatalogItem(meal));
      }
    });
  });

  cacheState.categories = categories;
  cacheState.catalog = Array.from(catalogMap.values());
  cacheState.expiresAt = Date.now() + CATALOG_CACHE_TTL_MS;
};

const ensureCatalogCache = async () => {
  const now = Date.now();
  if (cacheState.expiresAt > now && cacheState.catalog.length && cacheState.categories.length) {
    return;
  }

  await refreshCatalogCache();
};

export const getThemealdbCategories = async () => {
  return cacheState.categories;
};

export const getThemealdbCatalog = async ({ category, search, sort }) => {

  const normalizedSearch = (search ?? '').trim().toLowerCase();
  const normalizedCategory = (category ?? '').trim();

  const filtered = cacheState.catalog.filter((item) => {
    const matchCategory = !normalizedCategory || normalizedCategory === 'all' || item.category === normalizedCategory;
    const matchSearch = !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);
    return matchCategory && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name_desc') {
      return b.name.localeCompare(a.name);
    }

    return a.name.localeCompare(b.name);
  });

  return sorted;
};

export const getThemealdbCatalogItemById = async (mealId) => {
  if (!mealId || typeof mealId !== 'string') {
    throw new AppError('Nieprawidłowe ID pozycji z katalogu', 400);
  }

  const catalogItem = cacheState.catalog.find((item) => item.externalId === mealId);

  if (!catalogItem) {
    throw new AppError('Nie znaleziono pozycji w katalogu TheMealDB', 404);
  }

  return catalogItem;
};

export const getThemealdbMealDetails = async (mealId) => {
  if (!mealId || typeof mealId !== 'string') {
    throw new AppError('Nieprawidłowe ID pozycji z katalogu', 400);
  }

  const payload = await fetchFromThemealdb(`/lookup.php?i=${encodeURIComponent(mealId)}`);
  const meal = payload.meals?.[0];

  if (!meal) {
    throw new AppError('Nie znaleziono pozycji w TheMealDB', 404);
  }

  return meal;
};

export const startBackgroundCatalogRefresh = () => {
  // Initial refresh at startup
  refreshCatalogCache().catch((error) => {
    console.error('Failed to initialize TheMealDB catalog cache:', error);
  });

  // Periodic refresh every 15 minutes
  setInterval(() => {
    const now = Date.now();
    if (cacheState.expiresAt <= now) {
      refreshCatalogCache().catch((error) => {
        console.error('Failed to refresh TheMealDB catalog cache:', error);
      });
    }
  }, CATALOG_CACHE_TTL_MS);
};
