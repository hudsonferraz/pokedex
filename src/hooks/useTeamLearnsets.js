import { useEffect, useMemo, useState } from "react";
import {
  buildLearnsetBySpecies,
  fetchLearnsetsForSpecies,
  getCachedLearnset,
} from "../utils/learnsetCache";
import { normalizeSetEntry } from "../utils/pokemonSets";
import { normalizeSpeciesId } from "../utils/regulation";
import { pokemonNeedsLearnset } from "../utils/teamPokemonModel";

function speciesNeedsLearnsetFetch(pokemon, setsByName) {
  if (!pokemon?.name) {
    return false;
  }

  const set = normalizeSetEntry(setsByName?.[pokemon.name]);
  if (set.moves.length === 0) {
    return false;
  }

  const speciesKey = normalizeSpeciesId(pokemon.name);
  if (getCachedLearnset(speciesKey)) {
    return false;
  }

  return pokemonNeedsLearnset(pokemon);
}

export function useTeamLearnsets(team, setsByName) {
  const [learnsetBySpecies, setLearnsetBySpecies] = useState(() =>
    buildLearnsetBySpecies(team),
  );
  const [isLoading, setIsLoading] = useState(false);

  const speciesNeedingLearnsets = useMemo(() => {
    return (team || [])
      .filter((pokemon) => speciesNeedsLearnsetFetch(pokemon, setsByName))
      .map((pokemon) => normalizeSpeciesId(pokemon.name));
  }, [team, setsByName]);

  const speciesNeedingLearnsetsKey = speciesNeedingLearnsets.join("|");

  useEffect(() => {
    setLearnsetBySpecies((previous) => ({
      ...previous,
      ...buildLearnsetBySpecies(team),
    }));
  }, [team]);

  useEffect(() => {
    if (speciesNeedingLearnsets.length === 0) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);

    fetchLearnsetsForSpecies(speciesNeedingLearnsets, { signal: controller.signal })
      .then((fetchedLearnsets) => {
        if (controller.signal.aborted) {
          return;
        }

        setLearnsetBySpecies((previous) => ({
          ...previous,
          ...fetchedLearnsets,
        }));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [speciesNeedingLearnsetsKey, speciesNeedingLearnsets]);

  return {
    learnsetBySpecies,
    isLoading,
    pendingSpecies: isLoading ? speciesNeedingLearnsets : [],
  };
}
