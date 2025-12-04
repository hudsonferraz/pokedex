const RECENTLY_VIEWED_KEY = "recentlyViewed";
const MAX_RECENT = 5;

export const addToRecentlyViewed = (pokemon) => {
  try {
    const recent = getRecentlyViewed();
    const filtered = recent.filter(p => p.id !== pokemon.id);
    const updated = [{ id: pokemon.id, name: pokemon.name, sprite: pokemon.sprites.front_default }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.log("Error saving recently viewed:", error);
  }
};

export const getRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
  } catch (error) {
    return [];
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.log("Error clearing recently viewed:", error);
  }
};

