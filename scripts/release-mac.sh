#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building icons..."
npm run build:icons

echo "Packaging macOS app (.dmg + .zip)..."
npm run package:mac

VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)")"
DMG_PATH="dist/char-by-char-${VERSION}-arm64.dmg"
ZIP_PATH="dist/char-by-char-${VERSION}-arm64.zip"

if [[ ! -f "$DMG_PATH" ]]; then
  echo "Expected DMG not found: $DMG_PATH"
  exit 1
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Expected ZIP not found: $ZIP_PATH"
  exit 1
fi

DMG_SHA="$(shasum -a 256 "$DMG_PATH" | awk '{print $1}')"

echo
echo "Release artifacts ready:"
echo "- $DMG_PATH"
echo "- $ZIP_PATH"
echo "- SHA256 ($DMG_PATH): $DMG_SHA"

echo
echo "Generating Homebrew Cask file..."
npm run brew:cask

echo
echo "Done."
