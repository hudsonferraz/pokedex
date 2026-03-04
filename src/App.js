import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import PokemonDetail from "./components/PokemonDetail";
import TeamBuilder from "./components/TeamBuilder";
import ScrollToTop from "./components/ScrollToTop";
import { TeamProvider } from "./contexts/TeamContext";
import { ToastProvider } from "./components/ToastProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

function App() {
  return (
    <ThemeProvider>
      <ComparisonProvider>
        <ToastProvider>
          <TeamProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<TeamBuilder />} />
              <Route path="/browse" element={<Home />} />
              <Route path="/pokemon/:name" element={<PokemonDetail />} />
            </Routes>
          </TeamProvider>
        </ToastProvider>
      </ComparisonProvider>
    </ThemeProvider>
  );
}

export default App;
