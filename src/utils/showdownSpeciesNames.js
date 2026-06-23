import { normalizeSpeciesId } from "./regulation";

const SHOWDOWN_SPECIES_EXPORT_NAMES = {
  "urshifu": "Urshifu",
  "urshifu-single-strike": "Urshifu",
  "urshifu-rapid-strike": "Urshifu-Rapid-Strike",

  "calyrex-ice-rider": "Calyrex-Ice",
  "calyrex-shadow-rider": "Calyrex-Shadow",

  "indeedee-female": "Indeedee-F",

  "ogerpon-teal": "Ogerpon",

  "landorus-incarnate": "Landorus",
  "thundurus-incarnate": "Thundurus",
  "tornadus-incarnate": "Tornadus",
  "enamorus-incarnate": "Enamorus",

  "basculegion-female": "Basculegion-F",

  "maushold-family-of-three": "Maushold",
  "maushold-family-of-four": "Maushold-Four",

  "meowstic-male": "Meowstic",
  "meowstic-female": "Meowstic-F",

  "oinkologne-male": "Oinkologne",
  "oinkologne-female": "Oinkologne-F",

  "tauros-paldea-combat-breed": "Tauros-Paldea-Combat",
  "tauros-paldea-blaze-breed": "Tauros-Paldea-Blaze",
  "tauros-paldea-aqua-breed": "Tauros-Paldea-Aqua",

  "dudunsparce-two-segment": "Dudunsparce",
  "dudunsparce-three-segment": "Dudunsparce-Three-Segment",

  "tatsugiri-curly": "Tatsugiri",
  "tatsugiri-droopy": "Tatsugiri-Droopy",
  "tatsugiri-stretchy": "Tatsugiri-Stretchy",

  "squawkabilly-green-plumage": "Squawkabilly",
  "squawkabilly-blue-plumage": "Squawkabilly-Blue",
  "squawkabilly-yellow-plumage": "Squawkabilly-Yellow",
  "squawkabilly-white-plumage": "Squawkabilly-White",

  "gimmighoul-roaming": "Gimmighoul-Roaming",

  "dialga-origin": "Dialga-Origin",
  "palkia-origin": "Palkia-Origin",
  "giratina-origin": "Giratina-Origin",

  "zacian-crowned": "Zacian-Crowned",
  "zamazenta-crowned": "Zamazenta-Crowned",

  "kyurem-black": "Kyurem-Black",
  "kyurem-white": "Kyurem-White",

  "necrozma-dusk-mane": "Necrozma-Dusk-Mane",
  "necrozma-dawn-wings": "Necrozma-Dawn-Wings",

  "morpeko-hangry": "Morpeko-Hangry",
  "shaymin-sky": "Shaymin-Sky",
  "hoopa-unbound": "Hoopa-Unbound",
  "keldeo-resolute": "Keldeo-Resolute",

  "type-null": "Type: Null",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "ho-oh": "Ho-Oh",

  "nidoran-f": "Nidoran-F",
  "nidoran-m": "Nidoran-M",

  "mr-mime-galar": "Mr. Mime-Galar",
  "farfetchd-galar": "Farfetch'd-Galar",
  "moltres-galar": "Moltres-Galar",
  "articuno-galar": "Articuno-Galar",
  "zapdos-galar": "Zapdos-Galar",
  "slowking-galar": "Slowking-Galar",
  "slowbro-galar": "Slowbro-Galar",
  "weezing-galar": "Weezing-Galar",
  "corsola-galar": "Corsola-Galar",
  "zigzagoon-galar": "Zigzagoon-Galar",
  "linoone-galar": "Linoone-Galar",
  "yamask-galar": "Yamask-Galar",
  "stunfisk-galar": "Stunfisk-Galar",
  "darumaka-galar": "Darumaka-Galar",
  "darmanitan-galar": "Darmanitan-Galar",
  "darmanitan-galar-zen": "Darmanitan-Galar-Zen",

  "poltchageist-counterfeit": "Poltchageist",
  "polteageist-phony": "Polteageist",
  "polteageist-antique": "Polteageist-Antique",
};

const SHOWDOWN_SPECIES_IMPORT_ALIASES = Object.entries(SHOWDOWN_SPECIES_EXPORT_NAMES).reduce(
  (aliases, [apiId, showdownName]) => {
    const showdownSlug = normalizeSpeciesId(showdownName);
    if (showdownSlug && showdownSlug !== apiId && !aliases[showdownSlug]) {
      aliases[showdownSlug] = apiId;
    }
    return aliases;
  },
  {
    "indeedee-m": "indeedee",
    "maushold-four": "maushold-family-of-four",
    "basculegion-f": "basculegion-female",
    "meowstic-f": "meowstic-female",
    "meowstic-m": "meowstic-male",
    "oinkologne-f": "oinkologne-female",
    "tauros-paldea-combat": "tauros-paldea-combat-breed",
    "tauros-paldea-blaze": "tauros-paldea-blaze-breed",
    "tauros-paldea-aqua": "tauros-paldea-aqua-breed",
    "squawkabilly-blue": "squawkabilly-blue-plumage",
    "squawkabilly-yellow": "squawkabilly-yellow-plumage",
    "squawkabilly-white": "squawkabilly-white-plumage",
    "ogerpon": "ogerpon-teal",
  },
);

function formatMechanicalShowdownSpeciesName(apiId) {
  return apiId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

export function formatShowdownSpeciesName(apiName) {
  const apiId = normalizeSpeciesId(apiName);
  if (!apiId) {
    return "";
  }

  return SHOWDOWN_SPECIES_EXPORT_NAMES[apiId] || formatMechanicalShowdownSpeciesName(apiId);
}

export function resolveApiSpeciesIdFromShowdownSpecies(showdownSpecies) {
  const slug = normalizeSpeciesId((showdownSpecies || "").replace(/\s+/g, "-"));
  if (!slug) {
    return "";
  }

  return SHOWDOWN_SPECIES_IMPORT_ALIASES[slug] || slug;
}
