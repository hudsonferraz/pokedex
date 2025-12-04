import React, { useEffect, useState, useMemo } from "react";
import { getPokemonData, getPokemons, searchPokemon } from "../api";
import Navbar from "./Navbar";
import Pokedex from "./Pokedex";
import Searchbar from "./Searchbar";
import TypeFilter from "./TypeFilter";

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
    if (!isSearching && selectedTypes.length === 0) {
      fetchPokemons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!isSearching && selectedTypes.length === 0 && page === 0) {
      fetchPokemons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes.length]);

  useEffect(() => {
    if (!isSearching && selectedTypes.length > 0 && filteredAllPokemons.length === 0) {
      fetchAllPokemonsForFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes.length]);

  const filteredPokemons = useMemo(() => {
    if (selectedTypes.length === 0) {
      return allPokemons;
    }
    if (filteredAllPokemons.length === 0) {
      return [];
    }
    return filteredAllPokemons.filter((pokemon) => {
      const pokemonTypes = pokemon.types.map((type) => type.type.name);
      return selectedTypes.some((selectedType) => pokemonTypes.includes(selectedType));
    });
  }, [allPokemons, filteredAllPokemons, selectedTypes]);

  useEffect(() => {
    if (!isSearching) {
      if (selectedTypes.length > 0) {
        if (filteredPokemons.length > 0) {
          const startIndex = page * itensPerPage;
          const endIndex = startIndex + itensPerPage;
          const paginatedFiltered = filteredPokemons.slice(startIndex, endIndex);
          setPokemons(paginatedFiltered);
          const filteredPages = Math.ceil(filteredPokemons.length / itensPerPage);
          setTotalPages(Math.max(1, filteredPages));
        }
        setLoading(false);
      } else if (selectedTypes.length === 0 && allPokemons.length > 0) {
        setPokemons(allPokemons);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPokemons, isSearching, selectedTypes, page]);

  const onSearchHandler = async (pokemon) => {
    if (!pokemon) {
      setIsSearching(false);
      setSelectedTypes([]);
      setFilteredAllPokemons([]);
      return fetchPokemons();
    }

    setLoading(true);
    setNotFound(false);
    setIsSearching(true);
    setSelectedTypes([]);
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
    setPage(0);
    setFilteredAllPokemons([]);
  };

  return (
    <div>
      <Navbar />
      <Searchbar onSearch={onSearchHandler} />
      {!isSearching && (
        <TypeFilter
          selectedTypes={selectedTypes}
          onTypeToggle={handleTypeToggle}
          onClearAll={handleClearFilters}
        />
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

