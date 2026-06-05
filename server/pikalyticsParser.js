/**
 * Parse Pikalytics /ai/pokedex/[format] markdown responses.
 */

function pikalyticsDisplayNameToApiId(displayName) {
  return (displayName || "")
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-");
}

function parseDataDate(markdown) {
  const match = markdown.match(/\*\*Data Date\*\*:\s*(\d{4}-\d{2})/i);
  return match ? match[1] : null;
}

function parseFormatLabel(markdown) {
  const match = markdown.match(/\*\*Format\*\*:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function parseUsageTable(markdown) {
  const usage = {};
  const topPokemon = [];
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (/^\|[\s-|]+\|$/.test(line.replace(/\s/g, ""))) continue;
    if (/rank/i.test(line) && /usage/i.test(line)) continue;

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length < 3) continue;

    const rankCell = cells[0];
    if (!/^\d+$/.test(rankCell.replace(/\*/g, ""))) continue;

    const rawName = cells[1].replace(/\*\*/g, "").trim();
    const usageCell = cells[2];
    const percentMatch = usageCell.match(/([\d.]+)\s*%/);
    if (!rawName || !percentMatch) continue;

    const apiId = pikalyticsDisplayNameToApiId(rawName);
    const percent = parseFloat(percentMatch[1]);
    usage[apiId] = percent;
    topPokemon.push(apiId);
  }

  return { usage, topPokemon };
}

function parseCoreHints(markdown) {
  const hints = [];
  const coreLinePattern =
    /(?:two|three)-Pokemon core is ([^.]+)\./gi;
  let match = coreLinePattern.exec(markdown);
  while (match) {
    hints.push({
      name: match[1].trim(),
      hint: match[0].trim(),
    });
    match = coreLinePattern.exec(markdown);
  }
  return hints;
}

function parsePikalyticsMarkdown(markdown, formatCode) {
  const { usage, topPokemon } = parseUsageTable(markdown);
  const cores = parseCoreHints(markdown);

  return {
    formatCode,
    label: parseFormatLabel(markdown),
    updated: parseDataDate(markdown),
    source: "Pikalytics (live battle usage)",
    sourceUrl: `https://www.pikalytics.com/pokedex/${formatCode}`,
    usage,
    topPokemon: topPokemon.slice(0, 30),
    cores: cores.length
      ? cores.map((entry, index) => ({
          id: `pikalytics-core-${index}`,
          name: entry.name,
          pokemon: entry.name
            .split(/,|\band\b/gi)
            .map((part) => pikalyticsDisplayNameToApiId(part))
            .filter(Boolean),
          hint: entry.hint,
        }))
      : buildDefaultCores(topPokemon.slice(0, 6)),
  };
}

function buildDefaultCores(topPokemon) {
  if (topPokemon.length < 2) return [];
  return [
    {
      id: "usage-leaders",
      name: `${topPokemon[0].replace(/-/g, " ")} + ${topPokemon[1].replace(/-/g, " ")}`,
      pokemon: topPokemon.slice(0, 2),
      hint: `Most common pairing in current usage data (${topPokemon[0]}, ${topPokemon[1]}). Plan answers into both.`,
    },
  ];
}

function pikalyticsApiIdToUrlName(apiId) {
  return (apiId || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

function pikalyticsMoveToApiId(displayName) {
  return (displayName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function extractSection(markdown, sectionTitle) {
  const regex = new RegExp(`## ${sectionTitle}[\\s\\S]*?(?=\\n## |$)`, "i");
  return markdown.match(regex)?.[0] || "";
}

function parsePercentBullets(sectionText) {
  const items = [];
  const lineRegex = /-\s+\*\*([^*]+)\*\*:\s*([\d.]+)%/g;
  let match = lineRegex.exec(sectionText);
  while (match) {
    const name = match[1].trim();
    if (name.toLowerCase() === "other") {
      match = lineRegex.exec(sectionText);
      continue;
    }
    items.push({ name, percent: parseFloat(match[2]) });
    match = lineRegex.exec(sectionText);
  }
  return items.sort((left, right) => right.percent - left.percent);
}

function parsePokemonQuickInfo(markdown) {
  const info = {};
  const lines = markdown.split("\n");
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    const key = cells[0].replace(/\*\*/g, "").trim();
    const value = cells[1].replace(/\*\*/g, "").trim();
    if (key === "Usage") {
      const percentMatch = value.match(/([\d.]+)\s*%/);
      if (percentMatch) info.usage = parseFloat(percentMatch[1]);
    }
    if (key === "Win Rate") {
      const percentMatch = value.match(/([\d.]+)\s*%/);
      if (percentMatch) info.winRate = parseFloat(percentMatch[1]);
    }
  }
  return info;
}

function pikalyticsEvsToShowdown(spread) {
  if (!spread || typeof spread !== "string") return "";
  const parts = spread.split("/").map((part) => parseInt(part, 10));
  if (parts.length !== 6 || parts.some((value) => Number.isNaN(value))) {
    return spread.trim();
  }
  const labels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
  return parts
    .map((value, index) => (value > 0 ? `${value} ${labels[index]}` : null))
    .filter(Boolean)
    .join(" / ");
}

function parseNatureAndEvs(markdown) {
  const match = markdown.match(
    /features a \*\*([A-Za-z]+)\*\* nature with an EV spread of [`']([^`']+)[`']/i,
  );
  if (!match) return { nature: "", evs: "" };
  return {
    nature: match[1].trim(),
    evs: pikalyticsEvsToShowdown(match[2].trim()),
  };
}

function parseFeaturedTeamsSection(markdown, speciesUrlName) {
  const sectionMatch = markdown.match(
    /## Featured Teams with[\s\S]*?(?=\n## [^#]|\n---\s*\n## |$)/i,
  );
  if (!sectionMatch) return [];

  const section = sectionMatch[0];
  const blocks = section.split(/### Team \d+ by /).slice(1);
  const teams = [];

  blocks.forEach((block, index) => {
    const trainerLine = block.split("\n")[0]?.trim() || `Team ${index + 1}`;
    const recordMatch = block.match(/\*Record:\s*([^*]+)\*/i);
    const eventMatch = block.match(/\*Event:\s*([^*]+)\*/i);
    const pokemonMatch = block.match(/\*\*Pokemon\*\*:\s*([^\n]+)/i);
    const speciesSet = parseFeaturedTeamSet(block, speciesUrlName);

    teams.push({
      id: index + 1,
      trainer: trainerLine,
      record: recordMatch ? recordMatch[1].trim() : "",
      event: eventMatch ? eventMatch[1].trim() : "",
      pokemon: pokemonMatch
        ? pokemonMatch[1]
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        : [],
      speciesSet,
    });
  });

  return teams.slice(0, 10);
}

function parseEvSpreads(markdown, featuredTeams = []) {
  const spreads = [];
  const seen = new Set();

  const faqMatches = markdown.matchAll(
    /features a \*\*([A-Za-z]+)\*\* nature with an EV spread of [`']([^`']+)[`']\. This configuration accounts for ([\d.]+)%/gi,
  );

  for (const match of faqMatches) {
    const nature = match[1].trim();
    const evsRaw = match[2].trim();
    const key = `${nature}|${evsRaw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    spreads.push({
      nature,
      evs: pikalyticsEvsToShowdown(evsRaw),
      evsRaw,
      percent: parseFloat(match[3]),
      source: "ladder",
      label: "Most common ladder spread",
    });
  }

  const itemCounts = new Map();
  featuredTeams.forEach((team) => {
    const set = team.speciesSet;
    if (!set?.item) return;
    const key = `${set.ability || ""}|${set.item}|${(set.moves || []).join(",")}`;
    itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
  });

  [...itemCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .forEach(([key, count], index) => {
      const team = featuredTeams.find((entry) => {
        const set = entry.speciesSet;
        if (!set?.item) return false;
        const entryKey = `${set.ability || ""}|${set.item}|${(set.moves || []).join(",")}`;
        return entryKey === key;
      });
      if (!team?.speciesSet) return;
      spreads.push({
        nature: "",
        evs: "",
        evsRaw: "",
        percent: null,
        source: "tournament",
        label: `Tournament build #${index + 1} (${count} featured ${count === 1 ? "team" : "teams"})`,
        ability: team.speciesSet.ability,
        item: team.speciesSet.item,
        moves: team.speciesSet.moves,
        trainer: team.trainer,
        record: team.record,
      });
    });

  return spreads.slice(0, 3);
}

function parseTeraTypes(markdown) {
  const faqBlock =
    markdown.match(/### Which Tera Types[\s\S]*?(?=\n### |\n## |$)/i)?.[0] || "";
  if (/not available|not applicable/i.test(faqBlock)) return [];

  const bullets = parsePercentBullets(faqBlock);
  if (bullets.length > 0) return bullets;

  const teraSection = extractSection(markdown, "Common Tera Types");
  return parsePercentBullets(teraSection);
}

function parseFeaturedTeamSet(markdown, speciesUrlName) {
  const sectionRegex = new RegExp(
    `\\*\\*${speciesUrlName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} Set\\*\\*:[\\s\\S]*?(?=\\n\\n|### Team|$)`,
    "i",
  );
  const block = markdown.match(sectionRegex)?.[0] || "";
  if (!block) return null;

  const abilityMatch = block.match(/\*\*Ability\*\*:\s*(.+)/i);
  const itemMatch = block.match(/\*\*Item\*\*:\s*(.+)/i);
  const movesMatch = block.match(/\*\*Moves\*\*:\s*(.+)/i);
  const moves = movesMatch
    ? movesMatch[1]
        .split(",")
        .map((move) => move.trim())
        .filter(Boolean)
    : [];

  return {
    ability: abilityMatch ? abilityMatch[1].trim() : "",
    item: itemMatch ? itemMatch[1].trim() : "",
    moves,
  };
}

function parsePokemonMetaMarkdown(markdown, formatCode, speciesApiId) {
  const speciesUrlName = pikalyticsApiIdToUrlName(speciesApiId);
  const moves = parsePercentBullets(extractSection(markdown, "Common Moves"));
  const abilities = parsePercentBullets(extractSection(markdown, "Common Abilities"));
  const items = parsePercentBullets(extractSection(markdown, "Common Items"));
  const teammates = parsePercentBullets(extractSection(markdown, "Common Teammates"));
  const quickInfo = parsePokemonQuickInfo(markdown);
  const featuredTeams = parseFeaturedTeamsSection(markdown, speciesUrlName);
  const { nature, evs } = parseNatureAndEvs(markdown);
  const featuredSet = parseFeaturedTeamSet(markdown, speciesUrlName);
  const teraTypes = parseTeraTypes(markdown);
  const evSpreads = parseEvSpreads(markdown, featuredTeams);

  const topMoves = moves.slice(0, 4).map((entry) => ({
    ...entry,
    apiId: pikalyticsMoveToApiId(entry.name),
  }));

  const teraSection = extractSection(markdown, "Which Tera Types");
  const teraUnavailable =
    teraTypes.length === 0 &&
    (/not available|not applicable/i.test(teraSection) || teraSection.length === 0);

  const suggestedSet = {
    ability: abilities[0]?.name || featuredSet?.ability || "",
    item: items[0]?.name || featuredSet?.item || "",
    nature: evSpreads[0]?.nature || nature || "",
    evs: evSpreads[0]?.evs || evs || "",
    teraType: teraTypes[0]?.name || "",
    moves: topMoves.length
      ? topMoves.map((entry) => entry.apiId)
      : (featuredSet?.moves || []).map((move) => pikalyticsMoveToApiId(move)),
    moveLabels: topMoves.length
      ? topMoves.map((entry) => entry.name)
      : featuredSet?.moves || [],
  };

  return {
    formatCode,
    speciesApiId,
    speciesUrlName,
    label: parseFormatLabel(markdown),
    updated: parseDataDate(markdown),
    source: "Pikalytics (live battle usage)",
    sourceUrl: `https://www.pikalytics.com/pokedex/${formatCode}/${speciesUrlName}`,
    usage: quickInfo.usage ?? null,
    winRate: quickInfo.winRate ?? null,
    moves,
    abilities,
    items,
    teammates,
    teraTypes,
    teraUnavailable,
    evSpreads,
    featuredTeams,
    suggestedSet,
  };
}

module.exports = {
  parsePikalyticsMarkdown,
  parsePokemonMetaMarkdown,
  parseFeaturedTeamsSection,
  parseEvSpreads,
  parseTeraTypes,
  pikalyticsDisplayNameToApiId,
  pikalyticsApiIdToUrlName,
  pikalyticsMoveToApiId,
  pikalyticsEvsToShowdown,
};
