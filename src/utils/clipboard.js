/**
 * Copy text to the clipboard with a reliable success/failure result.
 * Falls back to a temporary textarea + execCommand when Clipboard API is unavailable.
 */
export async function copyTextToClipboard(text) {
  const value = text == null ? "" : String(text);

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return { ok: true };
    } catch (error) {
      // fall through to legacy path
    }
  }

  if (typeof document === "undefined") {
    return { ok: false, error: "Clipboard unavailable" };
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (succeeded) {
      return { ok: true };
    }
    return { ok: false, error: "Copy command failed" };
  } catch (error) {
    return { ok: false, error: error?.message || "Clipboard unavailable" };
  }
}
