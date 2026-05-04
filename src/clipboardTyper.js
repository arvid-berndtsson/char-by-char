import clipboard from "clipboardy";
import { keyboard } from "@nut-tree-fork/nut-js";
import { getHotkeyDescription } from "./shortcutConfig.js";

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

function validateDelayMs(delayMs) {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("delayMs must be a non-negative number.");
  }
}

function validateHotkey(hotkey) {
  const parsed = parseHotkey(hotkey);
  if (parsed.length < 2) {
    throw new Error("hotkey must include at least two keys, e.g. CTRL+ALT+V.");
  }
  return parsed;
}

export class ClipboardTyper {
  constructor({
    delayMs = 20,
    hotkey = "CTRL+ALT+V",
    verbose = false,
    logger = console
  } = {}) {
    validateDelayMs(delayMs);
    this.delayMs = delayMs;
    this.hotkey = hotkey;
    this.parsedHotkey = validateHotkey(hotkey);
    this.verbose = verbose;
    this.logger = logger;
    this.started = false;
    this.isTyping = false;
    this.lastTriggerMs = 0;
    keyboard.config.autoDelayMs = 0;
  }

  start() {
    if (this.started) return;
    this.started = true;

    this.logger.log("char-by-char is running.");
    this.logger.log(this.getHotkeyDescription());
  }

  updateConfig({ delayMs, hotkey, verbose }) {
    validateDelayMs(delayMs);
    const parsedHotkey = validateHotkey(hotkey);
    this.delayMs = delayMs;
    this.hotkey = hotkey;
    this.parsedHotkey = parsedHotkey;
    this.verbose = Boolean(verbose);
    if (this.verbose) {
      this.logger.log(
          "Updated settings: " +
          `delayMs=${this.delayMs}, ` +
          `hotkey=${this.parsedHotkey.join("+")}`
      );
    }
  }

  getHotkeyDescription() {
    return getHotkeyDescription({
      platform: process.platform,
      hotkey: this.hotkey
    });
  }

  stop() {
    this.started = false;
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
        if (this.verbose) this.logger.log("Clipboard is empty.");
        return;
      }

      for (const char of text) {
        await keyboard.type(char);
        if (this.delayMs > 0) {
          await sleep(this.delayMs);
        }
      }
    } catch (error) {
      this.logger.error(
        "Failed to type clipboard text:",
        error instanceof Error ? error.message : error
      );
    } finally {
      this.isTyping = false;
    }
  }
}

export function sanitizeSettings(input = {}) {
  const delayMs = Number(input.delayMs);
  const rawHotkey = input.hotkey ?? input.fallbackHotkey ?? "";
  const hotkey = String(rawHotkey).trim().toUpperCase();
  validateDelayMs(delayMs);
  validateHotkey(hotkey);
  return {
    delayMs,
    hotkey
  };
}
