import { normalizeSetEntry } from "./pokemonSets";
import { formatSpeciesLabel, normalizeSpeciesId } from "./regulation";

const GENDER_TOKENS = new Set(["m", "f"]);

export function parseShowdownSpeciesLine(speciesPart) {
  const trimmed = (speciesPart || "").trim();
  if (!trimmed) {
    return {
      speciesLine: "",
      nickname: "",
      gender: "",
      apiId: "",
    };
  }

  let species = trimmed;
  let nickname = "";
  let gender = "";

  const parentheticalMatch = trimmed.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
  if (parentheticalMatch) {
    const leftSide = parentheticalMatch[1].trim();
    const inner = parentheticalMatch[2].trim();

    if (GENDER_TOKENS.has(inner.toLowerCase())) {
      species = leftSide;
      gender = inner.toUpperCase();
    } else {
      nickname = leftSide;
      species = inner;
    }
  }

  return {
    speciesLine: species,
    nickname,
    gender,
    apiId: normalizeSpeciesId(species.replace(/\s+/g, "-")),
  };
}

export function showdownSpeciesToApiId(speciesLine) {
  const atIndex = (speciesLine || "").indexOf(" @ ");
  const speciesPart = atIndex >= 0 ? speciesLine.slice(0, atIndex).trim() : (speciesLine || "").trim();
  return parseShowdownSpeciesLine(speciesPart).apiId;
}

function parseSpeciesLine(line) {
  const trimmed = line.trim();
  const atIndex = trimmed.indexOf(" @ ");
  const speciesPart = atIndex >= 0 ? trimmed.slice(0, atIndex).trim() : trimmed;
  const item = atIndex >= 0 ? trimmed.slice(atIndex + 3).trim() : "";
  const speciesInfo = parseShowdownSpeciesLine(speciesPart);

  return {
    speciesLine: speciesInfo.speciesLine,
    nickname: speciesInfo.nickname,
    gender: speciesInfo.gender,
    apiId: speciesInfo.apiId,
    item,
  };
}

function parseStatSpreadLine(line, prefix) {
  return line.replace(new RegExp(`^${prefix}:\\s*`, "i"), "").trim();
}

function parseNatureLine(line) {
  return line.replace(/\s+Nature\s*$/i, "").trim();
}

function parseGenderLine(line) {
  const value = line.replace(/^Gender:\s*/i, "").trim().toLowerCase();
  if (value === "male" || value === "m") return "M";
  if (value === "female" || value === "f") return "F";
  return "";
}

function parseShinyLine(line) {
  const value = line.replace(/^Shiny:\s*/i, "").trim().toLowerCase();
  return value === "yes" || value === "true";
}

function parseHappinessLine(line) {
  const value = Number.parseInt(line.replace(/^Happiness:\s*/i, ""), 10);
  if (Number.isNaN(value) || value < 0 || value > 255) {
    return null;
  }
  return value;
}

function formatShowdownMoveName(moveName) {
  return moveName.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatShowdownSpeciesHeader(speciesApiName, set) {
  const speciesLabel = formatShowdownSpeciesName(speciesApiName);
  const displayName = set.nickname
    ? `${set.nickname} (${speciesLabel})`
    : speciesLabel;
  const genderSuffix = set.gender && !set.nickname ? ` (${set.gender})` : "";

  if (set.item) {
    return `${displayName}${genderSuffix} @ ${set.item}`;
  }

  return `${displayName}${genderSuffix}`;
}

export function parseShowdownPaste(text) {
  if (!text || typeof text !== "string") return [];

  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsed = [];

  blocks.forEach((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const { speciesLine, apiId, item, nickname, gender } = parseSpeciesLine(lines[0]);
    if (!apiId) return;

    const set = {
      apiId,
      speciesLine,
      nickname,
      gender,
      item,
      ability: "",
      nature: "",
      teraType: "",
      evs: "",
      ivs: "",
      moves: [],
      level: 50,
      shiny: false,
      happiness: null,
    };

    lines.slice(1).forEach((line) => {
      if (/^Ability:/i.test(line)) {
        set.ability = line.replace(/^Ability:\s*/i, "").trim();
      } else if (/^Tera Type:/i.test(line)) {
        set.teraType = line.replace(/^Tera Type:\s*/i, "").trim();
      } else if (/^EVs:/i.test(line)) {
        set.evs = parseStatSpreadLine(line, "EVs");
      } else if (/^IVs:/i.test(line)) {
        set.ivs = parseStatSpreadLine(line, "IVs");
      } else if (/^Gender:/i.test(line)) {
        set.gender = parseGenderLine(line) || set.gender;
      } else if (/^Shiny:/i.test(line)) {
        set.shiny = parseShinyLine(line);
      } else if (/^Happiness:/i.test(line)) {
        set.happiness = parseHappinessLine(line);
      } else if (/Nature\s*$/i.test(line) && !/^[-*]/.test(line)) {
        set.nature = parseNatureLine(line);
      } else if (/^Level:/i.test(line)) {
        const level = Number.parseInt(line.replace(/^Level:\s*/i, ""), 10);
        if (!Number.isNaN(level)) {
          set.level = level;
        }
      } else if (/^[-*]\s/.test(line)) {
        const move = line
          .replace(/^[-*]\s*/, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (move && set.moves.length < 4) {
          set.moves.push(move);
        }
      }
    });

    parsed.push(set);
  });

  return parsed.slice(0, 6);
}

function formatShowdownSpeciesName(apiName) {
  return formatSpeciesLabel(normalizeSpeciesId(apiName));
}

export function exportShowdownPaste(team, setsByName, teamName = "Team") {
  if (!team || team.length === 0) return `${teamName}\n`;

  const blocks = team.map((pokemon) => {
    const set = normalizeSetEntry(setsByName?.[pokemon.name]);
    const lines = [formatShowdownSpeciesHeader(pokemon.name, set)];

    if (set.ability) lines.push(`Ability: ${set.ability}`);
    lines.push(`Level: ${set.level ?? 50}`);
    if (set.shiny) lines.push("Shiny: Yes");
    if (set.gender) {
      lines.push(`Gender: ${set.gender === "M" ? "Male" : "Female"}`);
    }
    if (set.happiness != null) lines.push(`Happiness: ${set.happiness}`);
    if (set.teraType) lines.push(`Tera Type: ${set.teraType}`);
    if (set.evs) lines.push(`EVs: ${set.evs}`);
    if (set.ivs) lines.push(`IVs: ${set.ivs}`);
    if (set.nature) lines.push(`${set.nature} Nature`);

    set.moves.forEach((move) => {
      lines.push(`- ${formatShowdownMoveName(move)}`);
    });

    return lines.join("\n");
  });

  return `${blocks.join("\n\n")}\n`;
}
