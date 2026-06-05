import React from "react";
import { fetchLiveMeta, prefetchTopSpeciesMeta } from "../services/metaDataService";

const MetaDataContext = React.createContext({
  meta: null,
  speciesMeta: {},
  speciesMetaLoading: false,
  loading: false,
  error: null,
  refreshMeta: () => null,
});

export function MetaDataProvider({ regulationId, children }) {
  const [meta, setMeta] = React.useState(null);
  const [speciesMeta, setSpeciesMeta] = React.useState({});
  const [speciesMetaLoading, setSpeciesMetaLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveMeta(regulationId);
      setMeta(data);
    } catch (err) {
      setError(err.message || "Failed to load meta data");
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [regulationId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!meta?.topPokemon?.length) {
      setSpeciesMeta({});
      return undefined;
    }

    let cancelled = false;
    setSpeciesMetaLoading(true);

    prefetchTopSpeciesMeta(regulationId, meta.topPokemon, 15).then((summary) => {
      if (!cancelled) {
        setSpeciesMeta(summary || {});
        setSpeciesMetaLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regulationId, meta?.topPokemon]);

  const value = {
    meta,
    speciesMeta,
    speciesMetaLoading,
    loading,
    error,
    refreshMeta: load,
  };

  return (
    <MetaDataContext.Provider value={value}>{children}</MetaDataContext.Provider>
  );
}

export function useMetaData() {
  return React.useContext(MetaDataContext);
}

export default MetaDataContext;
