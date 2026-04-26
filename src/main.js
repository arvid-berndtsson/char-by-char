#!/usr/bin/env node

import { ClipboardTyper } from "./clipboardTyper.js";

function parseArgs(argv) {
  const args = {
    delayMs: 20,
    hotkey: "CTRL+ALT+V",
    verbose: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--delay-ms" && i + 1 < argv.length) {
      args.delayMs = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (token === "--hotkey" && i + 1 < argv.length) {
      args.hotkey = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--verbose") {
      args.verbose = true;
      continue;
    }
    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.delayMs) || args.delayMs < 0) {
    throw new Error("--delay-ms must be a non-negative number.");
  }

  return args;
}

function printHelp() {
  console.log(`char-by-char

Usage:
  char-by-char [--delay-ms 20] [--hotkey CTRL+ALT+V] [--verbose]

Options:
  --delay-ms <number>    Delay between typed characters (default: 20)
  --hotkey <combo>       Fallback global hotkey (default: CTRL+ALT+V)
  --verbose              Enable extra logs
  -h, --help             Show this help
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const app = new ClipboardTyper({
    delayMs: args.delayMs,
    fallbackHotkey: args.hotkey,
    verbose: args.verbose
  });

  app.start();

  const shutdown = () => {
    app.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
