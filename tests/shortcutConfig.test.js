import test from "node:test";
import assert from "node:assert/strict";
import {
  formatHotkeyForDisplay,
  getHotkeyDescription,
  getRequestedAccelerators
} from "../src/shortcutConfig.js";

test("getRequestedAccelerators returns configured hotkey on macOS", () => {
  assert.deepEqual(
    getRequestedAccelerators({
      platform: "darwin",
      hotkey: "CTRL+ALT+V"
    }),
    ["Control+Alt+V"]
  );
});

test("getRequestedAccelerators returns configured hotkey on non-macOS", () => {
  assert.deepEqual(
    getRequestedAccelerators({
      platform: "linux",
      hotkey: "CTRL+ALT+V"
    }),
    ["Control+Alt+V"]
  );
});

test("getRequestedAccelerators supports legacy fallbackHotkey key", () => {
  assert.deepEqual(
    getRequestedAccelerators({
      platform: "darwin",
      fallbackHotkey: "CTRL+ALT+V"
    }),
    ["Control+Alt+V"]
  );
});

test("getHotkeyDescription uses OPTION naming on macOS", () => {
  assert.equal(
    getHotkeyDescription({
      platform: "darwin",
      hotkey: "CTRL+ALT+V"
    }),
    "Hotkey: CTRL+OPTION+V"
  );
});

test("formatHotkeyForDisplay maps ALT/OPTION by platform", () => {
  assert.equal(
    formatHotkeyForDisplay({ platform: "darwin", hotkey: "CTRL+ALT+V" }),
    "CTRL+OPTION+V"
  );
  assert.equal(
    formatHotkeyForDisplay({ platform: "linux", hotkey: "CTRL+OPTION+V" }),
    "CTRL+ALT+V"
  );
});
