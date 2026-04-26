import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import icongen from "icon-gen";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const iconsDir = path.join(projectRoot, "assets", "icons");
const sourceSvg = path.join(iconsDir, "app-icon.svg");
const outputIconsetDir = path.join(iconsDir, "app-icon.iconset");
const outputIcns = path.join(iconsDir, "app-icon.icns");
const outputIco = path.join(iconsDir, "app-icon.ico");
const outputPng = path.join(iconsDir, "app-icon.png");

async function renderPngFromSvg(size, outPath) {
  await sharp(sourceSvg, { density: 1024 })
    .resize(size, size, { fit: "contain" })
    .png()
    .toFile(outPath);
}

async function main() {
  await fs.access(sourceSvg);
  await fs.rm(outputIconsetDir, { recursive: true, force: true });
  await fs.rm(outputIcns, { force: true });
  await fs.rm(outputIco, { force: true });

  await icongen(sourceSvg, iconsDir, {
    report: false,
    ico: {
      name: "app-icon",
      sizes: [16, 24, 32, 48, 64, 128, 256]
    },
    icns: {
      name: "app-icon",
      sizes: [16, 32, 64, 128, 256, 512, 1024]
    }
  });

  await renderPngFromSvg(1024, outputPng);
  await fs.rm(outputIconsetDir, { recursive: true, force: true });
  console.log("Generated icon assets:");
  console.log(`- ${outputPng}`);
  console.log(`- ${outputIcns}`);
  console.log(`- ${outputIco}`);
}

main().catch((error) => {
  console.error("Icon build failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
