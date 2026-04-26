# char-by-char

Tray app that types clipboard text one character at a time via a global hotkey.

- macOS primary hotkey: `Fn+V`
- Cross-platform fallback hotkey: configurable in Settings

This is for terminals and remote tools that block normal paste.

## Install

```bash
cd /Users/arvid/Work/char-by-char
npm install
```

## Run

```bash
npm start
```

Then:
1. Copy text (`Cmd+C` on macOS).
2. The app runs in your tray/menu bar.
3. Open `Settings...` from the tray menu to set:
   - Typing speed (ms per character)
   - Fallback hotkey (example: `CTRL+SHIFT+V`)
4. Focus the target input and press `Fn+V` (or fallback hotkey).

## macOS Permissions

Allow the app in:

- `System Settings -> Privacy & Security -> Input Monitoring`
- `System Settings -> Privacy & Security -> Accessibility`

## Tray Menu

- Start/Stop Typing Service
- Type Clipboard Now
- Settings...
- Quit

## Icon Assets

- Tray icon SVG: `assets/icons/tray-template.svg`
- App/settings icon SVG: `assets/icons/app-icon.svg`
- Generated packaging icons:
  - `assets/icons/app-icon.icns` (macOS)
  - `assets/icons/app-icon.ico` (Windows)
  - `assets/icons/app-icon.png` (1024x1024)

Generate/update packaging icons from SVG:

```bash
npm run build:icons
```

## Build Installer (macOS)

Create shareable installer files:

```bash
npm run release:mac
```

This generates:

- `dist/char-by-char-<version>-arm64.dmg`
- `dist/char-by-char-<version>-arm64.zip`
- `packaging/homebrew/Casks/char-by-char.rb` (with current SHA256)

## Homebrew (Cask)

Tap repo is:

- `https://github.com/arvid-berndtsson/homebrew-tap`

Install via:

```bash
brew install --cask arvid-berndtsson/tap/char-by-char
```

Or:

```bash
brew tap arvid-berndtsson/tap
brew install --cask char-by-char
```

## Release Automation

This repo includes GitHub Actions workflow:

- `.github/workflows/release-macos.yml`

When you push a tag like `v0.1.1`, it builds and uploads:

- macOS `.dmg`
- macOS `.zip`
- generated Homebrew cask file
- auto-sync of `Casks/char-by-char.rb` to `arvid-berndtsson/homebrew-tap`

Required repository secret in `char-by-char`:

- `HOMEBREW_TAP_PAT`: Personal access token with write access to `arvid-berndtsson/homebrew-tap`

## Notes

- Manual launch only (no auto-start at login).
- Settings are persisted locally via `electron-store`.
