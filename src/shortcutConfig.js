const ACCELERATOR_ALIAS = {
  CTRL: "Control",
  CONTROL: "Control",
  ALT: "Alt",
  OPTION: "Alt",
  SHIFT: "Shift",
  CMD: "Command",
  COMMAND: "Command",
  META: "Command",
  SUPER: "Super"
};

export function toAccelerator(hotkey) {
  return String(hotkey || "")
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const upper = token.toUpperCase();
      if (ACCELERATOR_ALIAS[upper]) return ACCELERATOR_ALIAS[upper];
      if (upper.length === 1) return upper;
      return token;
    })
    .join("+");
}

export function getRequestedAccelerators({
  platform,
  hotkey,
  fallbackHotkey
}) {
  const preferredHotkey = String(hotkey || fallbackHotkey || "");
  const accelerator = toAccelerator(preferredHotkey);
  return accelerator ? [accelerator] : [];
}

export function getHotkeyDescription({
  platform,
  hotkey,
  fallbackHotkey
}) {
  const preferredHotkey = String(hotkey || fallbackHotkey || "");
  const hotkeyText = formatHotkeyForDisplay({ platform, hotkey: preferredHotkey });
  return `Hotkey: ${hotkeyText}`;
}

export function formatHotkeyForDisplay({ platform, hotkey }) {
  const tokens = String(hotkey || "")
    .split("+")
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  if (platform === "darwin") {
    return tokens.map((token) => (token === "ALT" ? "OPTION" : token)).join("+");
  }
  return tokens.map((token) => (token === "OPTION" ? "ALT" : token)).join("+");
}
