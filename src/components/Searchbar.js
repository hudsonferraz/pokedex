import React, { useState, useEffect, useRef } from "react";
import SearchSuggestions from "./SearchSuggestions";
import "./Searchbar.css";

const Searchbar = (props) => {
  const [search, setSearch] = useState("");
  const [showClear, setShowClear] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { onSearch } = props;
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setShowClear(search.length > 0);
    setShowSuggestions(search.length > 0);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onChangeHandler = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length === 0) {
      onSearch(undefined);
    }
  };

  const handleSearch = (searchTerm = null) => {
    const term = searchTerm || search.trim();
    if (term.length === 0) {
      return;
    }
    onSearch(term);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearch(suggestion);
    handleSearch(suggestion);
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
      <div className="searchbar" ref={searchContainerRef}>
        <input 
          ref={searchInputRef}
          placeholder="Search for a pokemon..." 
          onChange={onChangeHandler}
          onKeyPress={onKeyPressHandler}
          onFocus={() => setShowSuggestions(search.length > 0)}
          value={search}
          className="search-input"
        />
        {showClear && (
          <button className="clear-search-btn" onClick={handleClear} aria-label="Clear search">
            ×
          </button>
        )}
        {showSuggestions && (
          <SearchSuggestions
            searchTerm={search}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </div>
      <div className="searchbar-btn">
        <button onClick={onButtonClickHandler}>Search</button>
      </div>
    </div>
  );
};

export default Searchbar;
