export const FORMAT_OPTIONS = [
  { value: "", label: "Any format" },
  { value: "VGC (doubles)", label: "VGC / Doubles" },
  { value: "Singles OU", label: "Singles OU" },
  { value: "Singles UU", label: "Singles UU" },
  { value: "Doubles", label: "Doubles" },
  { value: "Battle Stadium", label: "Battle Stadium" },
];

export const FORMAT_STORAGE_KEY = "pokemon-team-format";

export function getStoredFormat() {
  try {
    return window.localStorage.getItem(FORMAT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredFormat(value) {
  try {
    window.localStorage.setItem(FORMAT_STORAGE_KEY, value || "");
  } catch {}
}
