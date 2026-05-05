import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
const arch = "arm64";
const dmgName = `char-by-char-${version}-${arch}.dmg`;
const dmgPath = path.join(root, "dist", dmgName);

let dmgBuffer;
try {
  dmgBuffer = await fs.readFile(dmgPath);
} catch {
  console.error(`Missing DMG: ${dmgPath}`);
  console.error("Run `npm run package:mac` first.");
  process.exit(1);
}

const crypto = await import("node:crypto");
const sha256 = crypto.createHash("sha256").update(dmgBuffer).digest("hex");
const caskDir = path.join(root, "packaging", "homebrew", "Casks");
const caskPath = path.join(caskDir, "char-by-char.rb");

await fs.mkdir(caskDir, { recursive: true });

const content = `cask "char-by-char" do
  version "${version}"
  sha256 "${sha256}"

  url "https://github.com/arvid-berndtsson/char-by-char/releases/download/v#{version}/char-by-char-#{version}-arm64.dmg"
  name "char-by-char"
  desc "Tray app that types clipboard contents character-by-character"
  homepage "https://github.com/arvid-berndtsson/char-by-char"

  auto_updates true

  caveats <<~EOS
    If macOS blocks launch, run:
      xattr -dr com.apple.quarantine /Applications/char-by-char.app
      open /Applications/char-by-char.app

    Also allow char-by-char in:
      System Settings -> Privacy & Security -> Input Monitoring
      System Settings -> Privacy & Security -> Accessibility
  EOS

  app "char-by-char.app"
end
`;

await fs.writeFile(caskPath, content, "utf8");
console.log(`Wrote ${caskPath}`);
