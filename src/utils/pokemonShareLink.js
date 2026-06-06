import regulationsData from "../data/regulations.json";
import { getRegulationById } from "./regulation";

export function buildPokemonShareUrl(regulationId) {
  const url = new URL(window.location.href);

  if (regulationId) {
    url.searchParams.set("regulation", regulationId);
  } else {
    url.searchParams.delete("regulation");
  }

  return url.toString();
}

export function readRegulationFromSearchParams(searchParams) {
  const regulationParam = searchParams?.get?.("regulation");
  if (!regulationParam || !regulationsData[regulationParam]) {
    return null;
  }

  return regulationParam;
}

export function getRegulationLabel(regulationId) {
  return getRegulationById(regulationId).label;
}
