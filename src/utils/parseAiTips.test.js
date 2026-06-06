import { parseStructuredAiTips } from "../utils/parseAiTips";

describe("parseStructuredAiTips", () => {
  it("parses TIP/BECAUSE/META blocks", () => {
    const raw = `TIP: Use Choice Scarf Gholdengo
BECAUSE: Your team lacks speed control without Tailwind.
META: Gholdengo is a top-10 staple this format.

TIP: Add Intimidate
BECAUSE: You have no Attack drops for physical cores.`;

    const tips = parseStructuredAiTips(raw);
    expect(tips).toHaveLength(2);
    expect(tips[0].tip).toContain("Choice Scarf");
    expect(tips[0].because).toContain("speed control");
    expect(tips[0].meta).toContain("staple");
    expect(tips[1].tip).toContain("Intimidate");
  });

  it("falls back to plain text", () => {
    const tips = parseStructuredAiTips("Run Tailwind with your Incineroar lead.");
    expect(tips).toHaveLength(1);
    expect(tips[0].tip).toContain("Tailwind");
  });
});
