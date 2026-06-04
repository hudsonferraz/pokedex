import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import PokemonDetail from "./components/PokemonDetail";
import TeamBuilder from "./components/TeamBuilder";
import ScrollToTop from "./components/ScrollToTop";
import { TeamProvider } from "./contexts/TeamContext";
import { RegulationProvider } from "./contexts/RegulationContext";
import { ToastProvider } from "./components/ToastProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

function App() {
  return (
    <ThemeProvider>
      <ComparisonProvider>
        <ToastProvider>
          <RegulationProvider>
            <TeamProvider>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<TeamBuilder />} />
                <Route path="/browse" element={<Home />} />
                <Route path="/pokemon/:name" element={<PokemonDetail />} />
              </Routes>
            </TeamProvider>
          </RegulationProvider>
        </ToastProvider>
      </ComparisonProvider>
    </ThemeProvider>
  );
}

export default App;
