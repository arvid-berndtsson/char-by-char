import { formatHotkeyForDisplay } from "./shortcutConfig.js";

const form = document.querySelector("#settings-form");
const delayMsInput = document.querySelector("#delayMs");
const hotkeyInput = document.querySelector("#hotkey");
const statusLine = document.querySelector("#status");
const hotkeyDescriptionLine = document.querySelector("#hotkey-description");

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.style.color = isError ? "#b71d1d" : "#1f5f2a";
}

async function loadSettings() {
  let settings = null;
  try {
    settings = await window.charByChar.getSettings();
  } catch {
    settings = { delayMs: 20, hotkey: "CTRL+ALT+V", platform: "", serviceRunning: false };
  }

  delayMsInput.value = String(settings.delayMs ?? 20);
  hotkeyInput.value = formatHotkeyForDisplay({
    platform: settings.platform,
    hotkey: settings.hotkey
  });
  hotkeyDescriptionLine.textContent = settings.hotkeyDescription || "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Saving...");

  const payload = {
    delayMs: Number(delayMsInput.value),
    hotkey: hotkeyInput.value
  };

  try {
    const result = await window.charByChar.saveSettings(payload);
    if (!result.ok) {
      setStatus(result.error || "Could not save settings.", true);
      return;
    }
    hotkeyDescriptionLine.textContent = result.hotkeyDescription || "";
    setStatus("Settings saved.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unexpected error.", true);
  }
});

loadSettings().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Failed to load settings.", true);
});
