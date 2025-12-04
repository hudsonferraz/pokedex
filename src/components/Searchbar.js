import React, { useState } from "react";

const Searchbar = (props) => {
  const [search, setSearch] = useState("");
  const { onSearch } = props;
  const onChangeHandler = (e) => {
    setSearch(e.target.value);
    if (e.target.value.length === 0) {
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
          placeholder="Search for a pokemon" 
          onChange={onChangeHandler}
          onKeyPress={onKeyPressHandler}
          value={search}
        />
      </div>
      <div className="searchbar-btn">
        <button onClick={onButtonClickHandler}>Search</button>
      </div>
    </div>
  );
};

export default Searchbar;
