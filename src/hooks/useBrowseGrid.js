import { useEffect, useState } from "react";
import { getPokemonData, searchPokemon } from "../api";
import {
  buildBrowseCatalog,
  filterByGeneration,
} from "../utils/browseFilters";
import { ensureTypesForSpeciesList } from "../utils/pokemonTypeCache";

const ITEMS_PER_PAGE = 50;

export function useBrowseGrid({
  speciesIndex,
  enabled,
  page,
  selectedTypes,
  selectedGeneration,
  sortBy,
  vgcFilters,
  meta,
  speciesMeta,
  regulationId,
}) {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typesLoading, setTypesLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (!speciesIndex.length) {
      setLoading(true);
      return undefined;
    }

    let cancelled = false;
    const abortController = new AbortController();

    async function loadPage() {
      setLoading(true);

      try {
        if (selectedTypes.length > 0) {
          setTypesLoading(true);
          const generationScoped = filterByGeneration(
            speciesIndex,
            selectedGeneration,
          );
          await ensureTypesForSpeciesList(generationScoped, {
            signal: abortController.signal,
          });
        }

        if (cancelled) {
          return;
        }

        const catalog = buildBrowseCatalog(speciesIndex, {
          selectedGeneration,
          selectedTypes,
          vgcFilters,
          sortBy,
          meta,
          speciesMeta,
          regulationId,
        });

        const count = catalog.length;
        const pages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
        const safePage = Math.min(page, pages - 1);
        const startIndex = safePage * ITEMS_PER_PAGE;
        const pageEntries = catalog.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const details = await Promise.all(
          pageEntries.map((entry) => getPokemonData(entry.url)),
        );

        if (!cancelled) {
          setPokemons(details.filter(Boolean));
          setTotalCount(count);
          setTotalPages(pages);
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !cancelled) {
          setPokemons([]);
          setTotalCount(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTypesLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    speciesIndex,
    enabled,
    page,
    selectedTypes,
    selectedGeneration,
    sortBy,
    vgcFilters,
    meta,
    speciesMeta,
    regulationId,
  ]);

  return {
    pokemons,
    loading: loading || typesLoading,
    typesLoading,
    totalCount,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}

export async function searchPokemonByTerm(searchTerm) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const exactMatch = await searchPokemon(normalized);
  if (exactMatch) {
    return exactMatch;
  }

  if (/^\d+$/.test(normalized)) {
    return searchPokemon(normalized);
  }

  return null;
}

export async function searchPokemonInline(searchTerm, speciesIndex) {
  const normalized = searchTerm.trim().toLowerCase();
  if (normalized.length < 2) {
    return [];
  }

  const exactMatch = await searchPokemon(normalized);
  if (exactMatch) {
    return [exactMatch];
  }

  const nameMatches = speciesIndex
    .filter((entry) => entry.name.includes(normalized))
    .slice(0, 8);

  if (nameMatches.length === 0) {
    return [];
  }

  const details = await Promise.all(
    nameMatches.map((entry) => getPokemonData(entry.url)),
  );
  return details.filter(Boolean);
}
