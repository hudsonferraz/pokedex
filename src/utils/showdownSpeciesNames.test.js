import {
  formatShowdownSpeciesName,
  resolveApiSpeciesIdFromShowdownSpecies,
} from "./showdownSpeciesNames";

describe("showdownSpeciesNames", () => {
  test("exports common VGC form names", () => {
    expect(formatShowdownSpeciesName("urshifu-rapid-strike")).toBe("Urshifu-Rapid-Strike");
    expect(formatShowdownSpeciesName("urshifu-single-strike")).toBe("Urshifu");
    expect(formatShowdownSpeciesName("calyrex-ice-rider")).toBe("Calyrex-Ice");
    expect(formatShowdownSpeciesName("indeedee-female")).toBe("Indeedee-F");
    expect(formatShowdownSpeciesName("ogerpon-teal")).toBe("Ogerpon");
    expect(formatShowdownSpeciesName("ogerpon-wellspring")).toBe("Ogerpon-Wellspring");
    expect(formatShowdownSpeciesName("maushold-family-of-four")).toBe("Maushold-Four");
    expect(formatShowdownSpeciesName("tauros-paldea-combat-breed")).toBe("Tauros-Paldea-Combat");
    expect(formatShowdownSpeciesName("landorus-therian")).toBe("Landorus-Therian");
  });

  test("resolves Showdown paste species to internal api ids", () => {
    expect(resolveApiSpeciesIdFromShowdownSpecies("Calyrex-Ice")).toBe("calyrex-ice-rider");
    expect(resolveApiSpeciesIdFromShowdownSpecies("Indeedee-F")).toBe("indeedee-female");
    expect(resolveApiSpeciesIdFromShowdownSpecies("Ogerpon")).toBe("ogerpon-teal");
    expect(resolveApiSpeciesIdFromShowdownSpecies("Maushold-Four")).toBe("maushold-family-of-four");
    expect(resolveApiSpeciesIdFromShowdownSpecies("Tauros-Paldea-Blaze")).toBe(
      "tauros-paldea-blaze-breed",
    );
    expect(resolveApiSpeciesIdFromShowdownSpecies("Urshifu-Rapid-Strike")).toBe(
      "urshifu-rapid-strike",
    );
  });
});
