import benchmarksData from "../data/speedBenchmarks.json";

const SPEED_BOOSTING_NATURES = ["timid", "hasty", "jolly", "naive"];
const SPEED_LOWERING_NATURES = ["brave", "relaxed", "quiet", "sassy"];

export function getNatureSpeedModifier(natureName) {
  const nature = (natureName || "").trim().toLowerCase();
  if (SPEED_BOOSTING_NATURES.includes(nature)) return 1.1;
  if (SPEED_LOWERING_NATURES.includes(nature)) return 0.9;
  return 1;
}

export function parseSpeedEvsFromString(evsString) {
  if (!evsString || typeof evsString !== "string") return 0;
  const speedMatch = evsString.match(/(\d+)\s*Spe/i);
  if (speedMatch) return parseInt(speedMatch[1], 10);
  const altMatch = evsString.match(/Spe\s*[:/]\s*(\d+)/i);
  return altMatch ? parseInt(altMatch[1], 10) : 0;
}

export function getBaseSpeed(pokemon) {
  if (!pokemon?.stats) return 0;
  const speedStat = pokemon.stats.find((entry) => entry.stat?.name === "speed");
  return speedStat?.base_stat || 0;
}

/**
 * Level 50 speed (Gen 9), assuming 31 IV and no item boost.
 */
export function calculateLevel50Speed(baseSpeed, speedEvs = 0, natureName = "") {
  const base = Number(baseSpeed) || 0;
  const evComponent = Math.floor((Number(speedEvs) || 0) / 4);
  const inner = Math.floor(0.5 * (2 * base + 31 + evComponent)) + 5;
  const modifier = getNatureSpeedModifier(natureName);
  return Math.floor(inner * modifier);
}

function resolveBenchmarkSpeed(entry) {
  if (typeof entry.speed === "number") return entry.speed;
  if (typeof entry.baseSpeed === "number") {
    const baseCalc = calculateLevel50Speed(entry.baseSpeed, 252, "Jolly");
    if (entry.tailwind) return Math.floor(baseCalc * 1.5);
    if (entry.trickRoom) return baseCalc;
  }
  return null;
}

export function getSpeedBenchmarks() {
  return (benchmarksData.entries || [])
    .map((entry) => ({
      ...entry,
      resolvedSpeed: resolveBenchmarkSpeed(entry),
    }))
    .filter((entry) => entry.resolvedSpeed != null)
    .sort((a, b) => b.resolvedSpeed - a.resolvedSpeed);
}

export function buildTeamSpeedRows(team, setsByName) {
  if (!team?.length) return [];

  return team
    .filter(Boolean)
    .map((pokemon) => {
      const set = setsByName?.[pokemon.name] || {};
      const baseSpeed = getBaseSpeed(pokemon);
      const speedEvs = parseSpeedEvsFromString(set.evs);
      const nature = set.nature || "";
      const speed = calculateLevel50Speed(baseSpeed, speedEvs, nature);
      const tailwindSpeed = Math.floor(speed * 1.5);

      const benchmarks = getSpeedBenchmarks();
      const outspeeds = benchmarks
        .filter((bench) => speed > bench.resolvedSpeed)
        .slice(0, 3)
        .map((bench) => bench.label);
      const underspeeds = benchmarks
        .filter((bench) => speed < bench.resolvedSpeed)
        .slice(-2)
        .map((bench) => bench.label);

      return {
        name: pokemon.name,
        baseSpeed,
        nature: nature || "—",
        speedEvs,
        speed,
        tailwindSpeed,
        outspeeds,
        underspeeds,
      };
    })
    .sort((a, b) => b.speed - a.speed);
}
