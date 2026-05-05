cask "char-by-char" do
  version "0.1.2"
  sha256 "8284d31ff17064ba7c0dff1b0cd7e5932148fca3c92ed8c5720fa9b24f32e06f"

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
