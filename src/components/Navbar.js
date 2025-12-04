import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import FavoriteContext from "../contexts/favoritesContext";

const Navbar = () => {
  const { favoritePokemons } = useContext(FavoriteContext);
  const location = useLocation();
  const logoImg =
    "https://raw.githubusercontent.com/PokeAPI/media/master/logo/pokeapi_256.png";
  
  return (
    <nav>
      <div>
        <Link to="/">
          <img alt="pokeapi-logo" src={logoImg} className="navbar-img" />
        </Link>
      </div>
      <div className="navbar-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
        >
          Home
        </Link>
        <Link 
          to="/favorites" 
          className={`nav-link favorites-link ${location.pathname === "/favorites" ? "active" : ""}`}
        >
          {favoritePokemons.length} ❤️
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
