import {
  calculateTypeEffectiveness,
  getDefensiveTypeProfile,
  getTeamTypeCoverage,
} from "./teamAnalysis";

describe("calculateTypeEffectiveness", () => {
  test("electric versus ground is immune (0×)", () => {
    expect(calculateTypeEffectiveness("electric", ["ground"])).toBe(0);
  });

  test("electric versus flying is super effective (2×)", () => {
    expect(calculateTypeEffectiveness("electric", ["flying"])).toBe(2);
  });

  test("electric versus steel is neutral (1×)", () => {
    expect(calculateTypeEffectiveness("electric", ["steel"])).toBe(1);
  });

  test("fire versus ground is neutral (1×)", () => {
    expect(calculateTypeEffectiveness("fire", ["ground"])).toBe(1);
  });

  test("ground versus electric is super effective (2×)", () => {
    expect(calculateTypeEffectiveness("ground", ["electric"])).toBe(2);
  });

  test("water versus fire is super effective (2×)", () => {
    expect(calculateTypeEffectiveness("water", ["fire"])).toBe(2);
  });

  test("dual type multipliers stack", () => {
    expect(calculateTypeEffectiveness("rock", ["fire", "flying"])).toBe(4);
  });
});

describe("getDefensiveTypeProfile", () => {
  test("ground type resists electric", () => {
    const profile = getDefensiveTypeProfile(["ground"]);
    expect(profile.electric).toBe("no-effect");
  });
});

describe("getTeamTypeCoverage", () => {
  test("electric type on team covers ground as no effect", () => {
    const team = [{ types: [{ type: { name: "electric" } }] }];
    const coverage = getTeamTypeCoverage(team);
    expect(coverage.ground).toBe("no-effect");
  });
});
