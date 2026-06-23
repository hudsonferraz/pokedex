import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import PokemonDetail from "./components/PokemonDetail";
import TeamBuilder from "./components/TeamBuilder";
import ScrollToTop from "./components/ScrollToTop";
import { TeamProvider } from "./contexts/TeamContext";
import { RegulationProvider, useRegulation } from "./contexts/RegulationContext";
import { MetaDataProvider } from "./contexts/MetaDataContext";
import { ToastProvider } from "./components/ToastProvider";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";

function AppRoutes() {
  const { regulationId } = useRegulation();
  return (
    <MetaDataProvider regulationId={regulationId}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TeamBuilder />} />
        <Route path="/browse" element={<Home />} />
        <Route path="/pokemon/:name" element={<PokemonDetail />} />
      </Routes>
    </MetaDataProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ComparisonProvider>
        <ToastProvider>
          <TeamProvider>
            <RegulationProvider>
              <AppRoutes />
            </RegulationProvider>
          </TeamProvider>
        </ToastProvider>
      </ComparisonProvider>
    </ThemeProvider>
  );
}

export default App;
