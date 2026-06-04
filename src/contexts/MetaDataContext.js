import React from "react";
import { fetchLiveMeta } from "../services/metaDataService";

const MetaDataContext = React.createContext({
  meta: null,
  loading: false,
  error: null,
  refreshMeta: () => null,
});

export function MetaDataProvider({ regulationId, children }) {
  const [meta, setMeta] = React.useState(null);
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

  const value = {
    meta,
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
