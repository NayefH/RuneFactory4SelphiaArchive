const STORAGE_KEY = "rf4-saved";

export function loadFavorites(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function saveFavorites(favoriteIds, storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...favoriteIds]));
    return true;
  } catch {
    return false;
  }
}
