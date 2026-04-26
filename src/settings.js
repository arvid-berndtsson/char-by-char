const form = document.querySelector("#settings-form");
const delayMsInput = document.querySelector("#delayMs");
const fallbackHotkeyInput = document.querySelector("#fallbackHotkey");
const statusLine = document.querySelector("#status");
const hotkeyDescriptionLine = document.querySelector("#hotkey-description");
const typeNowButton = document.querySelector("#type-now-button");
const toggleServiceButton = document.querySelector("#toggle-service-button");

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.style.color = isError ? "#b71d1d" : "#1f5f2a";
}

function setServiceButtonLabel(serviceRunning) {
  toggleServiceButton.textContent = serviceRunning ? "Stop Service" : "Start Service";
}

async function loadSettings() {
  const settings = await window.charByChar.getSettings();
  delayMsInput.value = String(settings.delayMs);
  fallbackHotkeyInput.value = settings.fallbackHotkey;
  hotkeyDescriptionLine.textContent = settings.hotkeyDescription || "";
  setServiceButtonLabel(Boolean(settings.serviceRunning));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Saving...");

  const payload = {
    delayMs: Number(delayMsInput.value),
    fallbackHotkey: fallbackHotkeyInput.value
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

typeNowButton.addEventListener("click", async () => {
  try {
    setStatus("Typing clipboard...");
    await window.charByChar.typeClipboardNow();
    setStatus("Done.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Failed to type clipboard.", true);
  }
});

toggleServiceButton.addEventListener("click", async () => {
  try {
    const result = await window.charByChar.toggleService();
    setServiceButtonLabel(Boolean(result.serviceRunning));
    setStatus(result.serviceRunning ? "Service started." : "Service stopped.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not toggle service.", true);
  }
});

loadSettings().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Failed to load settings.", true);
});
