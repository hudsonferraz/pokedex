import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getPokemonData, getPokemons, searchPokemon } from "../api";
import Navbar from "./Navbar";
import Pokedex from "./Pokedex";
import Searchbar from "./Searchbar";
import TypeFilter from "./TypeFilter";
import RecentlyViewed from "./RecentlyViewed";

const Home = () => {
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pokemons, setPokemons] = useState([]);
  const [allPokemons, setAllPokemons] = useState([]);
  const [filteredAllPokemons, setFilteredAllPokemons] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalPokemonCount, setTotalPokemonCount] = useState(0);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  const itensPerPage = 50;
  const fetchPokemons = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      setIsSearching(false);
      const data = await getPokemons(itensPerPage, itensPerPage * page);
      if (data && data.results) {
        const promises = data.results.map(async (pokemon) => {
          return await getPokemonData(pokemon.url);
        });

        const results = await Promise.all(promises);
        setAllPokemons(results);
        setPokemons(results);
        setTotalPages(Math.ceil(data.count / itensPerPage));
        setTotalPokemonCount(data.count);
      }
    } catch (error) {
      console.log("fetchPokemons error: ", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPokemonsForFilter = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const limit = 1000;
      const data = await getPokemons(limit, 0);
      if (data && data.results) {
        const promises = data.results.map(async (pokemon) => {
          return await getPokemonData(pokemon.url);
        });

        const results = await Promise.all(promises);
        setFilteredAllPokemons(results);
        setTotalPokemonCount(data.count);
      }
    } catch (error) {
      console.log("fetchAllPokemonsForFilter error: ", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSearching && selectedTypes.length === 0 && !selectedGeneration) {
      fetchPokemons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!isSearching && selectedTypes.length === 0 && !selectedGeneration && page === 0) {
      fetchPokemons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes.length, selectedGeneration]);

  useEffect(() => {
    if (!isSearching && (selectedTypes.length > 0 || selectedGeneration) && filteredAllPokemons.length === 0) {
      fetchAllPokemonsForFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes.length, selectedGeneration]);

  const filteredPokemons = useMemo(() => {
    let pokemons = [];
    
    // If no filters, use current page's Pokemon
    if (selectedTypes.length === 0 && !selectedGeneration) {
      return allPokemons;
    }
    
    // If filters are active, use filteredAllPokemons
    if (filteredAllPokemons.length === 0) {
      return [];
    }
    
    pokemons = filteredAllPokemons.filter((pokemon) => {
      // Type filter
      if (selectedTypes.length > 0) {
        const pokemonTypes = pokemon.types.map((type) => type.type.name);
        const matchesType = selectedTypes.some((selectedType) => pokemonTypes.includes(selectedType));
        if (!matchesType) return false;
      }
      
      // Generation filter
      if (selectedGeneration) {
        const genRanges = {
          1: { min: 1, max: 151 },
          2: { min: 152, max: 251 },
          3: { min: 252, max: 386 },
          4: { min: 387, max: 493 },
          5: { min: 494, max: 649 },
          6: { min: 650, max: 721 },
          7: { min: 722, max: 809 },
          8: { min: 810, max: 905 },
          9: { min: 906, max: 1025 }
        };
        const range = genRanges[selectedGeneration];
        if (range && (pokemon.id < range.min || pokemon.id > range.max)) {
          return false;
        }
      }
      
      return true;
    });

    // Always sort by number
    return [...pokemons].sort((a, b) => a.id - b.id);
  }, [allPokemons, filteredAllPokemons, selectedTypes, selectedGeneration]);

  useEffect(() => {
    if (!isSearching) {
      if (selectedTypes.length > 0 || selectedGeneration) {
        if (filteredPokemons.length > 0) {
          const startIndex = page * itensPerPage;
          const endIndex = startIndex + itensPerPage;
          const paginatedFiltered = filteredPokemons.slice(startIndex, endIndex);
          setPokemons(paginatedFiltered);
          const filteredPages = Math.ceil(filteredPokemons.length / itensPerPage);
          setTotalPages(Math.max(1, filteredPages));
        }
        setLoading(false);
      } else if (selectedTypes.length === 0 && !selectedGeneration && allPokemons.length > 0) {
        setPokemons(allPokemons);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPokemons, isSearching, selectedTypes, selectedGeneration, page]);

  const onSearchHandler = async (pokemon) => {
    if (!pokemon) {
      setIsSearching(false);
      setSelectedTypes([]);
      setSelectedGeneration(null);
      setFilteredAllPokemons([]);
      return fetchPokemons();
    }

    setLoading(true);
    setNotFound(false);
    setIsSearching(true);
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setFilteredAllPokemons([]);
    try {
      const result = await searchPokemon(pokemon);
      if (!result) {
        setNotFound(true);
        setPokemons([]);
      } else {
        setPokemons([result]);
        setPage(0);
        setTotalPages(1);
      }
    } catch (error) {
      setNotFound(true);
      setPokemons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) => {
      const newTypes = prev.includes(type) 
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      return newTypes;
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setPage(0);
    setFilteredAllPokemons([]);
  };

  return (
    <div>
      <Navbar />
      <Searchbar onSearch={onSearchHandler} />
      {!isSearching && (
        <>
          <RecentlyViewed />
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "0 20px", marginBottom: "10px" }}>
            {pokemons.length > 0 && (
              <div className="results-count">
                Showing {pokemons.length} Pokemon
              </div>
            )}
          </div>
          <TypeFilter
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
            onClearAll={handleClearFilters}
            selectedGeneration={selectedGeneration}
            onGenerationChange={setSelectedGeneration}
          />
        </>
      )}
      {notFound ? (
        <div className="not-found-container">
          <div className="not-found-text">
            <h2>Pokemon not found!</h2>
            <p>Try searching for a different Pokemon name.</p>
            <button onClick={() => onSearchHandler(undefined)} className="back-to-list-btn">
              Back to Pokedex
            </button>
          </div>
        </div>
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
  );
};

export default Home;

