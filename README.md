# char-by-char

Types clipboard text one character at a time via a global hotkey.

- macOS target: `Fn+V`
- Cross-platform fallback: `Ctrl+Alt+V` (configurable)

This is for terminals and remote tools that block normal paste.

## Install

```bash
cd /Users/arvid/Work/char-by-char
npm install
```

Optional global command:

```bash
npm link
```

This gives you `char-by-char` globally.

## Run

```bash
npm start -- --delay-ms 20
```

Or if linked globally:

```bash
char-by-char --delay-ms 20
```

Then:
1. Copy text (`Cmd+C` on macOS).
2. Focus the target input.
3. Press `Fn+V` (or fallback hotkey).
4. It types one character at a time.

## macOS Permissions

Allow your terminal (or the final app) in:

- `System Settings -> Privacy & Security -> Input Monitoring`
- `System Settings -> Privacy & Security -> Accessibility`

## Options

```bash
char-by-char --delay-ms 0
char-by-char --delay-ms 50
char-by-char --hotkey CTRL+SHIFT+V
char-by-char --verbose
```

## Electron Path (Later)

Core logic lives in:

- `src/clipboardTyper.js`

An Electron app can import that class from `main` and keep the same behavior while adding tray UI/autostart packaging.
