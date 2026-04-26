#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building app icons..."
npm run build:icons

echo
echo "Starting char-by-char tray app..."
echo "If typing does not work, enable Accessibility + Input Monitoring for Terminal/Electron in macOS Settings."
npm start
