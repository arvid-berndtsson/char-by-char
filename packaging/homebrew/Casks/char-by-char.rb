cask "char-by-char" do
  version "0.1.1"
  sha256 "3a6a5898c039cf996ec8efcafc956871dbe7f0e8423fca397c37ec0fbef1c35d"

  url "https://github.com/arvid-berndtsson/char-by-char/releases/download/v#{version}/char-by-char-#{version}-arm64.dmg"
  name "char-by-char"
  desc "Tray app that types clipboard contents character-by-character"
  homepage "https://github.com/arvid-berndtsson/char-by-char"

  auto_updates true

  app "char-by-char.app"
end
