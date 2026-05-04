import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, globalShortcut } from "electron";
import Store from "electron-store";
import { ClipboardTyper, sanitizeSettings } from "./clipboardTyper.js";
import { formatHotkeyForDisplay, getRequestedAccelerators } from "./shortcutConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_DEFAULTS = {
  delayMs: 20,
  hotkey: "CTRL+ALT+V"
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

function getAssetPath(...parts) {
  return path.join(app.getAppPath(), "assets", ...parts);
}

function createTrayIcon() {
  if (process.platform === "darwin") {
    const templatePath = getAssetPath("icons", "tray-template.png");
    const templateImage = nativeImage.createFromPath(templatePath);
    if (!templateImage.isEmpty()) {
      templateImage.setTemplateImage(true);
      return templateImage;
    }
  } else if (process.platform === "win32") {
    const icoPath = getAssetPath("icons", "app-icon.ico");
    const icoImage = nativeImage.createFromPath(icoPath);
    if (!icoImage.isEmpty()) {
      return icoImage;
    }
  } else {
    const pngPath = getAssetPath("icons", "tray-color.png");
    const pngImage = nativeImage.createFromPath(pngPath);
    if (!pngImage.isEmpty()) {
      return pngImage;
    }
  }

  // Last-resort fallback if platform icon files are missing.
  const fallbackDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAQElEQVR42mNgGAWjgP///58RGRkZ4w0kVQxE2YBhNBRiNQxA6EJggvQbkMrA2gKkYkQJQMkCqRiRAlA2QKpGJAAAwT4eA4wAzaQAAAABJRU5ErkJggg==";
  return nativeImage.createFromDataURL(fallbackDataUrl).resize({ width: 18, height: 18 });
}

function getSettings() {
  try {
    return sanitizeSettings({
      delayMs: store.get("delayMs", SETTINGS_DEFAULTS.delayMs),
      hotkey: store.get("hotkey", store.get("fallbackHotkey", SETTINGS_DEFAULTS.hotkey))
    });
  } catch {
    store.set("delayMs", SETTINGS_DEFAULTS.delayMs);
    store.set("hotkey", SETTINGS_DEFAULTS.hotkey);
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
      label: `Hotkey: ${formatHotkeyForDisplay({
        platform: process.platform,
        hotkey: settings.hotkey
      })}`,
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
    hotkey: settings.hotkey,
    verbose: false
  });
  if (serviceRunning) {
    registerGlobalHotkeys();
  }
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
  const accelerators = getRequestedAccelerators({
    platform: process.platform,
    hotkey: settings.hotkey
  });
  let registeredAny = false;

  for (const accelerator of accelerators) {
    if (tryRegisterAccelerator(accelerator)) {
      registeredAny = true;
      continue;
    }
    console.warn(`Could not register hotkey: ${accelerator}`);
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
      hotkey: settings.hotkey,
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
    width: 460,
    height: 420,
    resizable: true,
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
      platform: process.platform,
      serviceRunning,
      hotkeyDescription: typer ? typer.getHotkeyDescription() : ""
    };
  });

  ipcMain.handle("settings:save", (_event, rawSettings) => {
    const settings = sanitizeSettings(rawSettings);
    store.set("delayMs", settings.delayMs);
    store.set("hotkey", settings.hotkey);
    store.set("fallbackHotkey", settings.hotkey);
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
  if (process.platform === "win32") {
    app.setAppUserModelId("com.arvidberndtsson.charbychar");
  }
}

app.on("before-quit", () => {
  isQuitting = true;
  unregisterGlobalHotkeys();
  if (typer) typer.stop();
});

app.on("window-all-closed", () => {
  // Tray app keeps running until user chooses Quit from the tray menu.
});
