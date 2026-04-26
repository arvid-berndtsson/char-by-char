import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, globalShortcut } from "electron";
import Store from "electron-store";
import { ClipboardTyper, sanitizeSettings } from "./clipboardTyper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_DEFAULTS = {
  delayMs: 20,
  fallbackHotkey: "CTRL+ALT+V"
};

const store = new Store({
  name: "char-by-char-settings",
  defaults: SETTINGS_DEFAULTS
});

let tray = null;
let settingsWindow = null;
let typer = null;
let serviceRunning = false;
let isQuitting = false;
let activeAccelerators = [];
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function createTrayIcon() {
  const svgIconPath = path.join(__dirname, "..", "assets", "icons", "tray-template.svg");
  const svgImage = nativeImage.createFromPath(svgIconPath);
  if (!svgImage.isEmpty()) {
    const trayImage = svgImage.resize({ width: 18, height: 18 });
    if (process.platform === "darwin") {
      trayImage.setTemplateImage(true);
    }
    return trayImage;
  }

  // Fallback if the SVG cannot be decoded on a specific runtime.
  const fallbackDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAQElEQVR42mNgGAWjgP///58RGRkZ4w0kVQxE2YBhNBRiNQxA6EJggvQbkMrA2gKkYkQJQMkCqRiRAlA2QKpGJAAAwT4eA4wAzaQAAAABJRU5ErkJggg==";
  return nativeImage.createFromDataURL(fallbackDataUrl).resize({ width: 18, height: 18 });
}

function getSettings() {
  try {
    return sanitizeSettings({
      delayMs: store.get("delayMs", SETTINGS_DEFAULTS.delayMs),
      fallbackHotkey: store.get("fallbackHotkey", SETTINGS_DEFAULTS.fallbackHotkey)
    });
  } catch {
    store.set("delayMs", SETTINGS_DEFAULTS.delayMs);
    store.set("fallbackHotkey", SETTINGS_DEFAULTS.fallbackHotkey);
    return { ...SETTINGS_DEFAULTS };
  }
}

function updateTrayMenu() {
  if (!tray) return;
  const settings = getSettings();
  const menu = Menu.buildFromTemplate([
    {
      label: serviceRunning ? "Status: Running" : "Status: Stopped",
      enabled: false
    },
    {
      label: serviceRunning ? "Stop Typing Service" : "Start Typing Service",
      click: () => {
        if (serviceRunning) {
          stopTypingService();
        } else {
          startTypingService();
        }
      }
    },
    { type: "separator" },
    {
      label: `Typing Speed: ${settings.delayMs} ms`,
      enabled: false
    },
    {
      label: `Fallback Hotkey: ${settings.fallbackHotkey}`,
      enabled: false
    },
    {
      label: "Type Clipboard Now",
      click: () => {
        if (typer) typer.triggerTyping();
      }
    },
    {
      label: "Settings...",
      click: () => showSettingsWindow()
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
  tray.setToolTip("char-by-char");
}

function applySettingsToService() {
  if (!typer) return;
  const settings = getSettings();
  typer.updateConfig({
    delayMs: settings.delayMs,
    fallbackHotkey: settings.fallbackHotkey,
    verbose: false
  });
  if (serviceRunning) {
    registerGlobalHotkeys();
  }
}

function toAccelerator(hotkey) {
  const alias = {
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

  return String(hotkey || "")
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const upper = token.toUpperCase();
      if (alias[upper]) return alias[upper];
      if (upper.length === 1) return upper;
      return token;
    })
    .join("+");
}

function unregisterGlobalHotkeys() {
  for (const accelerator of activeAccelerators) {
    globalShortcut.unregister(accelerator);
  }
  activeAccelerators = [];
}

function tryRegisterAccelerator(accelerator) {
  if (!accelerator) return false;
  if (activeAccelerators.includes(accelerator)) return true;
  let ok = false;
  try {
    ok = globalShortcut.register(accelerator, () => {
      if (typer) {
        void typer.triggerTyping();
      }
    });
  } catch {
    ok = false;
  }
  if (ok) {
    activeAccelerators.push(accelerator);
  }
  return ok;
}

function registerGlobalHotkeys() {
  unregisterGlobalHotkeys();
  const settings = getSettings();
  const fallbackAccelerator = toAccelerator(settings.fallbackHotkey);
  let registeredAny = false;

  if (process.platform === "darwin") {
    if (tryRegisterAccelerator("Fn+V")) {
      registeredAny = true;
    } else {
      console.warn("Could not register Fn+V on this system.");
    }
  }

  if (tryRegisterAccelerator(fallbackAccelerator)) {
    registeredAny = true;
  } else {
    console.warn(`Could not register fallback hotkey: ${fallbackAccelerator}`);
  }

  if (!registeredAny) {
    throw new Error("No global hotkeys could be registered.");
  }
}

function startTypingService() {
  if (!typer) {
    const settings = getSettings();
    typer = new ClipboardTyper({
      delayMs: settings.delayMs,
      fallbackHotkey: settings.fallbackHotkey,
      verbose: false,
      logger: console
    });
  } else {
    applySettingsToService();
  }

  typer.start();
  registerGlobalHotkeys();
  serviceRunning = true;
  updateTrayMenu();
}

function stopTypingService() {
  unregisterGlobalHotkeys();
  if (typer) typer.stop();
  serviceRunning = false;
  updateTrayMenu();
}

function createSettingsWindow() {
  if (settingsWindow) return settingsWindow;

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 340,
    resizable: false,
    maximizable: false,
    minimizable: true,
    show: false,
    title: "char-by-char Settings",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, "settings.html"));
  settingsWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    settingsWindow.hide();
  });
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

function showSettingsWindow() {
  const window = createSettingsWindow();
  window.once("ready-to-show", () => {
    window.show();
    window.focus();
  });
  if (window.isVisible()) {
    window.focus();
    return;
  }
  window.show();
  window.focus();
}

function registerIpcHandlers() {
  ipcMain.handle("settings:get", () => {
    const settings = getSettings();
    return {
      ...settings,
      serviceRunning,
      hotkeyDescription: typer ? typer.getHotkeyDescription() : ""
    };
  });

  ipcMain.handle("settings:save", (_event, rawSettings) => {
    const settings = sanitizeSettings(rawSettings);
    store.set("delayMs", settings.delayMs);
    store.set("fallbackHotkey", settings.fallbackHotkey);
    applySettingsToService();
    updateTrayMenu();
    return {
      ok: true,
      settings,
      hotkeyDescription: typer ? typer.getHotkeyDescription() : ""
    };
  });

  ipcMain.handle("service:type-now", async () => {
    if (typer) await typer.triggerTyping();
    return { ok: true };
  });

  ipcMain.handle("service:toggle", () => {
    if (serviceRunning) {
      stopTypingService();
    } else {
      startTypingService();
    }
    return {
      serviceRunning
    };
  });
}

function bootstrap() {
  tray = new Tray(createTrayIcon());
  tray.on("double-click", showSettingsWindow);

  registerIpcHandlers();
  startTypingService();
  updateTrayMenu();

  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }
}

if (hasSingleInstanceLock) {
  app.on("second-instance", () => {
    showSettingsWindow();
  });
  app.whenReady().then(bootstrap);
}

app.on("before-quit", () => {
  isQuitting = true;
  unregisterGlobalHotkeys();
  if (typer) typer.stop();
});

app.on("window-all-closed", () => {
  // Tray app keeps running until user chooses Quit from the tray menu.
});
