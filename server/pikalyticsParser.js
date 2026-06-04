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

module.exports = {
  parsePikalyticsMarkdown,
  pikalyticsDisplayNameToApiId,
};
