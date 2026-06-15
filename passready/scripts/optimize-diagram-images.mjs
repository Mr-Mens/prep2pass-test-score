/**
 * Optimise instructor diagram assets to WebP for faster loads.
 * Run: node scripts/optimize-diagram-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIAGRAMS_DIR = path.join(__dirname, "../public/diagrams");
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 84;

const SOURCE_FILES = [
  { slug: "left-emerge", file: "left emerge.PNG" },
  { slug: "right-emerge", file: "right emerge.PNG" },
  { slug: "left-turn", file: "left turn.PNG" },
  { slug: "right-turn", file: "right turn.PNG" },
  { slug: "crossroad", file: "crossroad.PNG" },
  { slug: "crossroads-scenarios", file: "crossroads scenarios.PNG" },
  { slug: "staggered-junction", file: "staggared junction.PNG" },
  { slug: "staggered-junction-1", file: "staggared junction 1.JPG" },
  { slug: "meeting-traffic", file: "meeting traffic.PNG" },
  { slug: "roundabout", file: "roundabout.jpg" },
  { slug: "independent-driving-signs-1", file: "independent driving signs 1.JPG" },
  { slug: "independent-driving-signs-2", file: "independent driving signs 2.JPG" },
  { slug: "independent-driving-signs-3", file: "independent driving signs 3.PNG" },
  { slug: "independent-driving-signs-4", file: "independent driving signs 4.JPG" },
];

async function main() {
  const manifest = {};

  for (const { slug, file } of SOURCE_FILES) {
    const inputPath = path.join(DIAGRAMS_DIR, file);
    if (!fs.existsSync(inputPath)) {
      console.warn(`skip missing: ${file}`);
      continue;
    }

    const outputName = `${slug}.webp`;
    const outputPath = path.join(DIAGRAMS_DIR, outputName);

    const image = sharp(inputPath).rotate();
    const meta = await image.metadata();

    await image
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toFile(outputPath);

    const optimised = await sharp(outputPath).metadata();
    const before = fs.statSync(inputPath).size;
    const after = fs.statSync(outputPath).size;

    manifest[slug] = {
      width: optimised.width ?? meta.width ?? MAX_WIDTH,
      height: optimised.height ?? meta.height ?? MAX_WIDTH,
    };

    console.log(
      `${slug}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (${optimised.width}×${optimised.height})`,
    );
  }

  const manifestPath = path.join(__dirname, "../lib/instructor/diagrams/image-manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
