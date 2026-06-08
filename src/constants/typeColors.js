export const TYPE_COLORS = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export const ALL_POKEMON_TYPES = Object.keys(TYPE_COLORS);

export const getTypeColor = (typeName) =>
  TYPE_COLORS[typeName?.toLowerCase?.() ? typeName.toLowerCase() : typeName] ||
  TYPE_COLORS.normal;

function parseHexColor(hex) {
  const normalized = (hex || "").replace("#", "");
  if (normalized.length !== 6) {
    return { red: 168, green: 168, blue: 120 };
  }
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function getTypeThemeStyle(primaryType) {
  const hex = getTypeColor(primaryType);
  const { red, green, blue } = parseHexColor(hex);

  return {
    "--pokemon-type-color": hex,
    "--pokemon-type-tint": `rgba(${red}, ${green}, ${blue}, 0.12)`,
    "--pokemon-type-tint-soft": `rgba(${red}, ${green}, ${blue}, 0.05)`,
    "--pokemon-type-glow": `rgba(${red}, ${green}, ${blue}, 0.2)`,
  };
}

export const TEAM_ROLE_OPTIONS = [
  { value: "", label: "Role" },
  { value: "lead", label: "Lead" },
  { value: "attacker", label: "Attacker" },
  { value: "support", label: "Support" },
  { value: "tank", label: "Tank" },
  { value: "sweeper", label: "Sweeper" },
  { value: "weather", label: "Weather" },
  { value: "tr", label: "Trick Room" },
  { value: "anti-meta", label: "Anti-meta" },
];

export function getCoverageAccessibilityLabel(type, coverageValue) {
  const multiplier =
    coverageValue === "super-effective"
      ? "2× super-effective"
      : coverageValue === "effective"
        ? "1× effective"
        : coverageValue === "no-effect"
          ? "0× no effect"
          : "0.5× not very effective";

  return `${type}: ${multiplier} offensive coverage`;
}
