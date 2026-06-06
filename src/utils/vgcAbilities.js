const META_VGC_ABILITY_IDS = new Set([
  "intimidate",
  "drought",
  "drizzle",
  "snow-warning",
  "sand-stream",
  "regenerator",
  "prankster",
  "fur-coat",
  "good-as-gold",
  "purifying-salt",
  "unseen-fist",
  "libero",
  "protean",
  "mold-breaker",
  "sheer-force",
  "friend-guard",
  "telepathy",
  "drizzle",
  "lightning-rod",
  "storm-drain",
  "levitate",
  "water-absorb",
  "flash-fire",
  "sap-sipper",
  "thick-fat",
  "well-baked-body",
  "thermal-exchange",
  "psychic-surge",
  "grassy-surge",
  "electric-surge",
  "misty-surge",
  "defiant",
  "competitive",
  "clear-body",
  "inner-focus",
  "scrappy",
  "technician",
  "parental-bond",
  "triage",
  "quick-draw",
  "protosynthesis",
  "quark-drive",
]);

export function normalizeAbilityId(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-");
}

export function isMetaVgcAbility(abilityName) {
  return META_VGC_ABILITY_IDS.has(normalizeAbilityId(abilityName));
}

export function formatAbilityLabel(abilityName) {
  return (abilityName || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
