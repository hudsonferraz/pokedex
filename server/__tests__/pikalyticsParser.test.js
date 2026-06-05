const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parsePokemonMetaMarkdown,
  parseFeaturedTeamsSection,
  parseEvSpreads,
  parseTeraTypes,
} = require("../pikalyticsParser");

const fixturePath = path.join(
  __dirname,
  "..",
  "fixtures",
  "incineroar-champions.md",
);
const fixtureMarkdown = fs.readFileSync(fixturePath, "utf8");

describe("parsePokemonMetaMarkdown", () => {
  it("parses usage, win rate, and suggested set", () => {
    const parsed = parsePokemonMetaMarkdown(
      fixtureMarkdown,
      "gen9championsvgc2026regma",
      "incineroar",
    );

    assert.equal(parsed.usage, 26);
    assert.equal(parsed.winRate, 51.434);
    assert.equal(parsed.suggestedSet.ability, "Intimidate");
    assert.equal(parsed.suggestedSet.item, "Sitrus Berry");
    assert.equal(parsed.suggestedSet.nature, "Careful");
    assert.deepEqual(parsed.suggestedSet.moves.slice(0, 2), [
      "fake-out",
      "parting-shot",
    ]);
    assert.equal(parsed.teammates[0].name, "Sinistcha");
  });

  it("parses featured teams and spread comparison", () => {
    const parsed = parsePokemonMetaMarkdown(
      fixtureMarkdown,
      "gen9championsvgc2026regma",
      "incineroar",
    );

    assert.ok(parsed.featuredTeams.length >= 2);
    assert.equal(parsed.featuredTeams[0].trainer, "ARSAL PURI");
    assert.equal(parsed.featuredTeams[0].speciesSet.item, "Sitrus Berry");
    assert.ok(parsed.evSpreads.length >= 1);
    assert.equal(parsed.evSpreads[0].nature, "Careful");
    assert.equal(parsed.evSpreads[0].percent, 3.75);
  });

  it("returns empty tera types when unavailable", () => {
    const teraTypes = parseTeraTypes(fixtureMarkdown);
    assert.deepEqual(teraTypes, []);
  });
});

describe("parseFeaturedTeamsSection", () => {
  it("extracts trainer and species set", () => {
    const teams = parseFeaturedTeamsSection(fixtureMarkdown, "Incineroar");
    assert.equal(teams.length, 2);
    assert.match(teams[1].pokemon.join(","), /Basculegion/);
    assert.equal(teams[1].speciesSet.ability, "Intimidate");
  });
});

describe("parseEvSpreads", () => {
  it("includes ladder spread from FAQ", () => {
    const teams = parseFeaturedTeamsSection(fixtureMarkdown, "Incineroar");
    const spreads = parseEvSpreads(fixtureMarkdown, teams);
    assert.equal(spreads[0].source, "ladder");
    assert.match(spreads[0].evs, /HP/);
  });
});
