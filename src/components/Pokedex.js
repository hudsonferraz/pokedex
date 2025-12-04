import React, { useEffect } from "react";
import Pagination from "./Pagination";
import Pokemon from "./Pokemon";
import PokemonCardSkeleton from "./PokemonCardSkeleton";

const Pokedex = (props) => {
  const { pokemons, loading, page, setPage, totalPages } = props;
  const onLeftClickHandler = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };
  const onRightClickHandler = () => {
    if (page + 1 < totalPages) {
      setPage(page + 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft" && page > 0) {
        setPage(page - 1);
      } else if (e.key === "ArrowRight" && page + 1 < totalPages) {
        setPage(page + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [page, totalPages, setPage]);
  return (
    <div>
      <div className="pokedex-header">
        <h1>Pokedex</h1>
        <Pagination
          page={page + 1}
          totalPages={totalPages}
          onLeftClick={onLeftClickHandler}
          onRightClick={onRightClickHandler}
          setPage={setPage}
        />
      </div>
      {loading ? (
        <div className="pokedex-grid">
          {Array.from({ length: 40 }).map((_, index) => (
            <PokemonCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="pokedex-grid">
          {pokemons &&
            pokemons.map((pokemon, index) => {
              return <Pokemon key={pokemon.id || index} pokemon={pokemon} />;
            })}
        </div>
      )}
    </div>
  );
};

export default Pokedex;
