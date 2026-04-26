import clipboard from "clipboardy";
import { keyboard } from "@nut-tree-fork/nut-js";
import { GlobalKeyboardListener } from "node-global-key-listener";

const TRIGGER_COOLDOWN_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name) {
  return String(name || "").trim().toUpperCase();
}

function parseHotkey(combo) {
  return String(combo || "")
    .split("+")
    .map((key) => normalizeName(key))
    .filter(Boolean);
}

function toAliasList(token) {
  const map = {
    CTRL: ["LEFT CTRL", "RIGHT CTRL", "CTRL", "CONTROL", "LEFT CONTROL", "RIGHT CONTROL"],
    ALT: ["LEFT ALT", "RIGHT ALT", "ALT", "OPTION", "LEFT OPTION", "RIGHT OPTION"],
    SHIFT: ["LEFT SHIFT", "RIGHT SHIFT", "SHIFT"],
    CMD: ["LEFT META", "RIGHT META", "META", "COMMAND", "LEFT COMMAND", "RIGHT COMMAND"],
    META: ["LEFT META", "RIGHT META", "META", "COMMAND", "LEFT COMMAND", "RIGHT COMMAND"],
    V: ["V"],
    FN: ["FN", "FUNCTION", "GLOBE"]
  };

  return map[token] || [token];
}

function getPressedKeys(down) {
  return new Set(
    Object.entries(down || {})
      .filter(([, pressed]) => Boolean(pressed))
      .map(([name]) => normalizeName(name))
  );
}

function isKeyDown(pressedKeys, token) {
  const aliases = toAliasList(token);
  return aliases.some((alias) => pressedKeys.has(normalizeName(alias)));
}

function hotkeyMatches(pressedKeys, parsedHotkey) {
  return parsedHotkey.every((token) => isKeyDown(pressedKeys, token));
}

function isFnVOnMac(event, pressedKeys) {
  if (process.platform !== "darwin") return false;
  if (normalizeName(event.state) !== "DOWN") return false;
  if (normalizeName(event.name) !== "V") return false;
  return isKeyDown(pressedKeys, "FN");
}

export class ClipboardTyper {
  constructor({ delayMs = 20, fallbackHotkey = "CTRL+ALT+V", verbose = false } = {}) {
    if (delayMs < 0) {
      throw new Error("delayMs must be >= 0");
    }

    this.delayMs = delayMs;
    this.fallbackHotkey = fallbackHotkey;
    this.verbose = verbose;
    this.listener = null;
    this.isTyping = false;
    this.lastTriggerMs = 0;
    this.parsedFallbackHotkey = parseHotkey(fallbackHotkey);
    keyboard.config.autoDelayMs = 0;
  }

  start() {
    this.listener = new GlobalKeyboardListener();
    this.listener.addListener((event, down) => {
      const pressedKeys = getPressedKeys(down);
      const shouldTrigger =
        isFnVOnMac(event, pressedKeys) ||
        (normalizeName(event.state) === "DOWN" &&
          hotkeyMatches(pressedKeys, this.parsedFallbackHotkey));

      if (!shouldTrigger) return;
      this.triggerTyping();
    });

    const hotkeyText = this.parsedFallbackHotkey.join("+");
    console.log("char-by-char is running.");
    if (process.platform === "darwin") {
      console.log(`Hotkey: Fn+V (fallback: ${hotkeyText})`);
    } else {
      console.log(`Hotkey: ${hotkeyText}`);
    }
  }

  stop() {
    if (this.listener) {
      this.listener.kill();
      this.listener = null;
    }
  }

  async triggerTyping() {
    const now = Date.now();
    if (now - this.lastTriggerMs < TRIGGER_COOLDOWN_MS) return;
    if (this.isTyping) return;
    this.lastTriggerMs = now;
    this.isTyping = true;

    try {
      const text = await clipboard.read();
      if (!text) {
        if (this.verbose) console.log("Clipboard is empty.");
        return;
      }

      for (const char of text) {
        await keyboard.type(char);
        if (this.delayMs > 0) {
          await sleep(this.delayMs);
        }
      }
    } catch (error) {
      console.error("Failed to type clipboard text:", error instanceof Error ? error.message : error);
    } finally {
      this.isTyping = false;
    }
  }
}
