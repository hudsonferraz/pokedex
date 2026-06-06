import React, { useEffect, useState } from "react";
import { useRegulation } from "../contexts/RegulationContext";
import { useMetaData } from "../contexts/MetaDataContext";
import { loadSpeciesIndex } from "../utils/pokemonSpeciesIndex";
import {
  searchPokemonByTerm,
  useBrowseGrid,
} from "../hooks/useBrowseGrid";
import Navbar from "./Navbar";
import Pokedex from "./Pokedex";
import Searchbar from "./Searchbar";
import TypeFilter from "./TypeFilter";
import RecentlyViewed from "./RecentlyViewed";
import UsageStatsBar from "./UsageStatsBar";
import BrowseHero from "./BrowseHero";
import BrowseEmptyState from "./BrowseEmptyState";
import BrowseControls from "./BrowseControls";
import BrowseResultsHeader from "./BrowseResultsHeader";
import RegulationSelector from "./RegulationSelector";

const EMPTY_VGC_FILTERS = {
  top30Meta: false,
  hasUsageData: false,
  legalInRegulation: false,
};

const Home = () => {
  const { regulation } = useRegulation();
  const { meta, speciesMeta } = useMetaData();

  const [speciesIndex, setSpeciesIndex] = useState([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pokemons, setPokemons] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [sortBy, setSortBy] = useState("dex");
  const [vgcFilters, setVgcFilters] = useState(EMPTY_VGC_FILTERS);

  useEffect(() => {
    let cancelled = false;
    loadSpeciesIndex()
      .then((index) => {
        if (!cancelled) {
          setSpeciesIndex(index);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIndexLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const browseGrid = useBrowseGrid({
    speciesIndex,
    enabled: !isSearching && !indexLoading,
    page,
    selectedTypes,
    selectedGeneration,
    sortBy,
    vgcFilters,
    meta,
    speciesMeta,
    regulationId: regulation.id,
  });

  useEffect(() => {
    if (isSearching) {
      return;
    }
    setPokemons(browseGrid.pokemons);
    setLoading(browseGrid.loading || indexLoading);
    setTotalCount(browseGrid.totalCount);
    setTotalPages(browseGrid.totalPages);
  }, [browseGrid, isSearching, indexLoading]);

  useEffect(() => {
    if (page >= browseGrid.totalPages && browseGrid.totalPages > 0) {
      setPage(Math.max(0, browseGrid.totalPages - 1));
    }
  }, [page, browseGrid.totalPages]);

  const resetBrowseState = () => {
    setPage(0);
    setNotFound(false);
    setIsSearching(false);
  };

  const onSearchHandler = async (searchTerm) => {
    if (!searchTerm) {
      resetBrowseState();
      return;
    }

    setLoading(true);
    setNotFound(false);
    setIsSearching(true);
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setVgcFilters(EMPTY_VGC_FILTERS);
    setSortBy("dex");

    try {
      const result = await searchPokemonByTerm(searchTerm);
      if (!result) {
        setNotFound(true);
        setPokemons([]);
        setTotalCount(0);
        setTotalPages(0);
      } else {
        setPokemons([result]);
        setPage(0);
        setTotalPages(1);
        setTotalCount(1);
      }
    } catch {
      setNotFound(true);
      setPokemons([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes((previous) =>
      previous.includes(type)
        ? previous.filter((entry) => entry !== type)
        : [...previous, type],
    );
    setPage(0);
    setIsSearching(false);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setVgcFilters(EMPTY_VGC_FILTERS);
    setPage(0);
    setIsSearching(false);
  };

  const handleSortChange = (nextSort) => {
    setSortBy(nextSort);
    setPage(0);
    setIsSearching(false);
  };

  const handleVgcFilterChange = (nextFilters) => {
    setVgcFilters(nextFilters);
    setPage(0);
    setIsSearching(false);
  };

  const handleMetaFirstView = () => {
    setSortBy("usage");
    setVgcFilters({ ...EMPTY_VGC_FILTERS, top30Meta: true });
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setPage(0);
    setIsSearching(false);
  };

  const metaAvailable = Boolean(meta?.usage);

  return (
    <div className="browse-page">
      <Navbar />
      <div className="browse-content">
        <BrowseHero regulationLabel={regulation.label} />
        <RegulationSelector compact />
        <Searchbar
          onSearch={onSearchHandler}
          speciesIndex={speciesIndex}
        />
        {!isSearching && (
          <>
            <RecentlyViewed />
            <UsageStatsBar regulationLabel={regulation.label} />
            <BrowseControls
              sortBy={sortBy}
              onSortChange={handleSortChange}
              vgcFilters={vgcFilters}
              onVgcFilterChange={handleVgcFilterChange}
              onMetaFirstView={handleMetaFirstView}
              regulationId={regulation.id}
              metaAvailable={metaAvailable}
            />
            <TypeFilter
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
              onClearAll={handleClearFilters}
              selectedGeneration={selectedGeneration}
              onGenerationChange={(generation) => {
                setSelectedGeneration(generation);
                setPage(0);
                setIsSearching(false);
              }}
            />
            {!loading && totalCount > 0 && (
              <BrowseResultsHeader
                visibleCount={pokemons.length}
                totalCount={totalCount}
                page={page}
                totalPages={totalPages}
                sortBy={sortBy}
                selectedTypes={selectedTypes}
                selectedGeneration={selectedGeneration}
                vgcFilters={vgcFilters}
                typesLoading={browseGrid.typesLoading}
                onRemoveType={handleTypeToggle}
                onClearGeneration={() => {
                  setSelectedGeneration(null);
                  setPage(0);
                }}
                onVgcFilterChange={handleVgcFilterChange}
                onClearAll={handleClearFilters}
              />
            )}
          </>
        )}
        {notFound ? (
          <BrowseEmptyState
            title="Pokémon not found"
            message="We couldn't find a species matching that search. Try another name or browse the grid below."
            primaryLabel="Clear search"
            onPrimaryAction={() => onSearchHandler(undefined)}
          />
        ) : !loading && !isSearching && totalCount === 0 && speciesIndex.length > 0 ? (
          <BrowseEmptyState
            title="No Pokémon match these filters"
            message="Try removing a filter, changing sort, or browsing the full dex."
            primaryLabel="Clear filters"
            onPrimaryAction={handleClearFilters}
          />
        ) : (
          <Pokedex
            pokemons={pokemons}
            loading={loading}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
