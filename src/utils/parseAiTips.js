/**
 * Parses structured AI output: TIP / BECAUSE / META blocks.
 * Falls back to a single unstructured tip when format is missing.
 */
export function parseStructuredAiTips(rawText) {
  const text = (rawText || "").trim();
  if (!text) return [];

  if (!/TIP:/i.test(text)) {
    return [{ tip: text, because: "", meta: "" }];
  }

  const blocks = text
    .split(/(?=TIP:\s)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const tipMatch = block.match(/^TIP:\s*([\s\S]*?)(?=BECAUSE:|META:|$)/i);
      const becauseMatch = block.match(/BECAUSE:\s*([\s\S]*?)(?=META:|$)/i);
      const metaMatch = block.match(/META:\s*([\s\S]*?)$/i);

      return {
        tip: (tipMatch?.[1] || block).replace(/^TIP:\s*/i, "").trim(),
        because: becauseMatch?.[1]?.trim() || "",
        meta: metaMatch?.[1]?.trim() || "",
      };
    })
    .filter((entry) => entry.tip);
}
