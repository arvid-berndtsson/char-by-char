cask "char-by-char" do
  version "0.1.0"
  sha256 "669e40ca31b0a47474a71db69b1ac65bc066adeb61ccb1fcce7241f6a6d8ea0b"

  url "https://github.com/arvid-berndtsson/char-by-char/releases/download/v#{version}/char-by-char-#{version}-arm64.dmg"
  name "char-by-char"
  desc "Tray app that types clipboard contents character-by-character"
  homepage "https://github.com/arvid-berndtsson/char-by-char"

  auto_updates true

  app "char-by-char.app"
end
