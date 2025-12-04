import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import FavoriteContext from "../contexts/favoritesContext";

const getTypeColor = (typeName) => {
  const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC",
  };
  return typeColors[typeName] || "#A8A878";
};

const Pokemon = (props) => {
  const navigate = useNavigate();
  const { favoritePokemons, updateFavoritePokemons } =
    useContext(FavoriteContext);
  const { pokemon } = props;
  const onHeartClick = (e) => {
    e.stopPropagation();
    updateFavoritePokemons(pokemon.name);
  };
  const onCardClick = () => {
    navigate(`/pokemon/${pokemon.name}`);
  };
  const heart = favoritePokemons.includes(pokemon.name) ? "❤️" : "🖤";
  const primaryType = pokemon.types[0]?.type.name || "normal";
  const cardColor = getTypeColor(primaryType);
  
  return (
    <div 
      className="pokemon-card"
      style={{ backgroundColor: cardColor }}
      onClick={onCardClick}
    >
      <div className="pokemon-image-container">
        <img
          alt={pokemon.name}
          src={pokemon.sprites.front_default}
          className="pokemon-image"
          loading="lazy"
        />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3> {pokemon.name}</h3>
          <div>#{pokemon.id}</div>
        </div>
        <div className="card-bottom">
          <div className="pokemon-type">
            {pokemon.types.map((type, index) => {
              return (
                <div key={index} className="pokemon-type-text">
                  {type.type.name}
                </div>
              );
            })}
          </div>
          <button className="pokemon-heart-btn" onClick={onHeartClick}>
            {heart}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pokemon;
