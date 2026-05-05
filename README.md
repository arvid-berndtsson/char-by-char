# char-by-char

Tray app that types clipboard text one character at a time via a global hotkey.

This is for terminals and remote tools that block normal paste.

## Install via Homebrew Tap (Recommended)

`char-by-char` is published as a **Homebrew cask** in this tap:

- `arvid-berndtsson/tap`

You have two install options.

### Option 1: Direct install from tap (single command)

```bash
brew install --cask arvid-berndtsson/tap/char-by-char
```

### Option 2: Add tap first, then install

```bash
brew tap arvid-berndtsson/tap
brew install --cask char-by-char
```

### Update

```bash
brew upgrade --cask arvid-berndtsson/tap/char-by-char
```

### Uninstall

```bash
brew uninstall --cask char-by-char
```

## macOS security note (important)

To distribute a macOS app without Gatekeeper warnings ("broken", "damaged", or "cannot be opened"), the app must be signed and notarized via the Apple Developer Program.

- Apple Developer Program is paid (about SEK ~1,000/year).
- Without signing/notarization, some users may need to manually bypass Gatekeeper.

If macOS blocks launch, users can run:

```bash
xattr -dr com.apple.quarantine /Applications/char-by-char.app
open /Applications/char-by-char.app
```

## Install manually (DMG)

1. Go to Releases: `https://github.com/arvid-berndtsson/char-by-char/releases`
2. Download latest `char-by-char-<version>-arm64.dmg`
3. Drag `char-by-char.app` to `Applications`
4. Start `char-by-char` from `Applications`

## First-time macOS permissions

Allow `char-by-char` in:

- `System Settings -> Privacy & Security -> Input Monitoring`
- `System Settings -> Privacy & Security -> Accessibility`

Without these permissions, global hotkeys/typing will not work.

## Usage

- Global hotkey: configurable in `Settings...` from tray/menu bar

Flow:
1. Copy text (`Cmd+C`)
2. Focus target input (where paste may be blocked)
3. Press your configured hotkey (for example `CTRL+OPTION+V` on macOS)
4. char-by-char types clipboard text one character at a time

## Tray Menu

- Start/Stop Typing Service
- Type Clipboard Now
- Settings...
- Quit

## For Maintainers

### Local development

```bash
npm install
npm start
```

### Build icons

```bash
npm run build:icons
```

Icon sources:
- `assets/icons/tray-template.svg`
- `assets/icons/app-icon.svg`

Generated icon assets:
- `assets/icons/app-icon.icns` (macOS)
- `assets/icons/app-icon.ico` (Windows)
- `assets/icons/app-icon.png`
- `assets/icons/tray-template.png`
- `assets/icons/tray-template@2x.png`
- `assets/icons/tray-color.png`

### Build release artifacts (macOS)

Single command:

```bash
npm run release:mac
```

Artifacts:
- `dist/char-by-char-<version>-arm64.dmg`
- `dist/char-by-char-<version>-arm64.zip`
- `packaging/homebrew/Casks/char-by-char.rb` (updated version + sha256)

### Release automation (GitHub Actions)

Workflow:
- `.github/workflows/release-macos.yml`

When pushing a tag like `v0.1.1`, workflow:
1. Builds macOS `.dmg` and `.zip`
2. Creates/updates GitHub release
3. Regenerates Homebrew cask
4. Pushes cask update to `arvid-berndtsson/homebrew-tap`

Required repository secret in `char-by-char`:
- `HOMEBREW_TAP_PAT` (token with write access to `arvid-berndtsson/homebrew-tap`)

### Homebrew tap repo

Tap repo:
- `https://github.com/arvid-berndtsson/homebrew-tap`

### What users should run

Use cask commands (not formula commands):

```bash
brew install --cask arvid-berndtsson/tap/char-by-char
```

Why:
- This project ships a macOS app (`.app`/`.dmg`) via Homebrew Cask.
- It is not a formula package for `brew install char-by-char` without `--cask`.

## Notes

- Manual launch only (no auto-start at login).
- Settings are persisted locally via `electron-store`.
