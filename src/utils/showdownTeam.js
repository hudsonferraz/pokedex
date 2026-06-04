import { normalizeSetEntry } from "./pokemonSets";
import { formatSpeciesLabel, normalizeSpeciesId } from "./regulation";

export function showdownSpeciesToApiId(speciesLine) {
  if (!speciesLine) return "";
  let raw = speciesLine.trim();
  raw = raw.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const atIndex = raw.indexOf(" @ ");
  if (atIndex >= 0) raw = raw.slice(0, atIndex).trim();
  return normalizeSpeciesId(raw.replace(/\s+/g, "-"));
}

function parseSpeciesLine(line) {
  const trimmed = line.trim();
  const atIndex = trimmed.indexOf(" @ ");
  let species = trimmed;
  let item = "";
  if (atIndex >= 0) {
    species = trimmed.slice(0, atIndex).trim();
    item = trimmed.slice(atIndex + 3).trim();
  }
  return {
    speciesLine: species,
    apiId: showdownSpeciesToApiId(trimmed),
    item,
  };
}

function parseEvsLine(line) {
  return line.replace(/^EVs:\s*/i, "").trim();
}

function parseNatureLine(line) {
  return line.replace(/\s+Nature\s*$/i, "").trim();
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

    const { speciesLine, apiId, item } = parseSpeciesLine(lines[0]);
    if (!apiId) return;

    const set = {
      apiId,
      speciesLine,
      item,
      ability: "",
      nature: "",
      teraType: "",
      evs: "",
      moves: [],
      level: 50,
    };

    lines.slice(1).forEach((line) => {
      if (/^Ability:/i.test(line)) {
        set.ability = line.replace(/^Ability:\s*/i, "").trim();
      } else if (/^Tera Type:/i.test(line)) {
        set.teraType = line.replace(/^Tera Type:\s*/i, "").trim();
      } else if (/^EVs:/i.test(line)) {
        set.evs = parseEvsLine(line);
      } else if (/Nature\s*$/i.test(line) && !/^[-*]/.test(line)) {
        set.nature = parseNatureLine(line);
      } else if (/^Level:/i.test(line)) {
        const level = parseInt(line.replace(/^Level:\s*/i, ""), 10);
        if (!Number.isNaN(level)) set.level = level;
      } else if (/^[-*]\s/.test(line)) {
        const move = line
          .replace(/^[-*]\s*/, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (move && set.moves.length < 4) set.moves.push(move);
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
    const species = formatShowdownSpeciesName(pokemon.name);
    const lines = [];

    if (set.item) {
      lines.push(`${species} @ ${set.item}`);
    } else {
      lines.push(species);
    }

    if (set.ability) lines.push(`Ability: ${set.ability}`);
    lines.push("Level: 50");
    if (set.teraType) lines.push(`Tera Type: ${set.teraType}`);
    if (set.evs) lines.push(`EVs: ${set.evs}`);
    if (set.nature) lines.push(`${set.nature} Nature`);

    set.moves.forEach((move) => {
      lines.push(`- ${move.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`);
    });

    return lines.join("\n");
  });

  return `${blocks.join("\n\n")}\n`;
}
