import React, { useState, useEffect, useRef } from "react";
import "./Searchbar.css";

const Searchbar = (props) => {
  const [search, setSearch] = useState("");
  const [showClear, setShowClear] = useState(false);
  const { onSearch } = props;
  const searchInputRef = useRef(null);

  useEffect(() => {
    setShowClear(search.length > 0);
  }, [search]);

  const onChangeHandler = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length === 0) {
      onSearch(undefined);
    }
  };

  const handleSearch = () => {
    const trimmedSearch = search.trim();
    if (trimmedSearch.length === 0) {
      return;
    }
    onSearch(trimmedSearch);
  };

  const handleClear = () => {
    setSearch("");
    onSearch(undefined);
    searchInputRef.current?.focus();
  };

  const onButtonClickHandler = () => {
    handleSearch();
  };

  const onKeyPressHandler = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="searchbar-container">
      <div className="searchbar">
        <input 
          ref={searchInputRef}
          placeholder="Search for a pokemon..." 
          onChange={onChangeHandler}
          onKeyPress={onKeyPressHandler}
          value={search}
          className="search-input"
        />
        {showClear && (
          <button className="clear-search-btn" onClick={handleClear} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
      <div className="searchbar-btn">
        <button onClick={onButtonClickHandler}>Search</button>
      </div>
    </div>
  );
};

export default Searchbar;
