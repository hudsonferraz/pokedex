/**
 * Maps app regulation ids to Pikalytics format codes.
 * @see https://www.pikalytics.com/llms-full.txt
 */
export const PIKALYTICS_FORMAT_BY_REGULATION = {
  "regulation-i": {
    formatCode: "gen9vgc2025regi",
    label: "VGC 2025 Regulation I",
  },
  "regulation-j": {
    formatCode: "gen9vgc2025regj",
    label: "VGC 2025 Regulation J",
  },
  "regulation-h": {
    formatCode: "gen9vgc2025regh",
    label: "VGC 2025 Regulation H",
  },
};

export function getPikalyticsFormatForRegulation(regulationId) {
  return (
    PIKALYTICS_FORMAT_BY_REGULATION[regulationId] ||
    PIKALYTICS_FORMAT_BY_REGULATION["regulation-i"]
  );
}
