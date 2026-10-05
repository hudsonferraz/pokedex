import { copyTextToClipboard } from "./clipboard";

describe("copyTextToClipboard", () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    document.body.innerHTML = "";
  });

  test("returns ok when Clipboard API succeeds", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });

    await expect(copyTextToClipboard("hello")).resolves.toEqual({ ok: true });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
  });

  test("falls back when Clipboard API rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
    });
    document.execCommand = jest.fn().mockReturnValue(true);

    await expect(copyTextToClipboard("fallback")).resolves.toEqual({ ok: true });
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  test("returns error when all copy paths fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
    });
    document.execCommand = jest.fn().mockReturnValue(false);

    await expect(copyTextToClipboard("nope")).resolves.toEqual({
      ok: false,
      error: "Copy command failed",
    });
  });
});
