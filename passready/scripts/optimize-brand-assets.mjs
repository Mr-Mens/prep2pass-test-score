/**
 * Generate URL-safe Pass Pilot logo, social preview, and browser icon assets.
 * Source priority: public/brand/PP logo.png (transparent), then legacy filenames.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const brandDir = path.join(root, "public/brand");
const socialDir = path.join(root, "public/social-banner");
const appDir = path.join(root, "app");

function resolveSource() {
  const candidates = [
    path.join(brandDir, "PP logo.png"),
    path.join(brandDir, "pp-logo.png"),
    path.join(brandDir, "pass-pilot-logo.png"),
    path.join(brandDir, "pass pilot logo.png"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Pass Pilot logo not found in public/brand/");
}

function resolveSocialBannerSource() {
  const candidates = [
    path.join(brandDir, "social banner.png"),
    path.join(brandDir, "social-banner.png"),
    path.join(socialDir, "pass pilot logo.png"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return resolveSource();
}

async function loadLogoPipeline(src) {
  return sharp(src).trim({ threshold: 12 }).png();
}

async function run() {
  const src = resolveSource();
  const logoPipeline = await loadLogoPipeline(src);
  const logoMeta = await logoPipeline.clone().metadata();

  await logoPipeline
    .clone()
    .png({ compressionLevel: 6, effort: 10 })
    .toFile(path.join(brandDir, "pass-pilot-logo.png"));

  const socialSrc = resolveSocialBannerSource();
  const ogBackground = { r: 255, g: 255, b: 255, alpha: 1 };
  const ogPipeline = sharp(socialSrc).resize(1200, 630, {
    fit: "contain",
    background: ogBackground,
  });
  await ogPipeline.clone().png({ compressionLevel: 6 }).toFile(path.join(socialDir, "og.png"));
  await ogPipeline.clone().webp({ quality: 92 }).toFile(path.join(socialDir, "og.webp"));

  for (const size of [512, 192, 180, 32]) {
    const suffix = size === 32 ? "favicon-32" : `icon-${size}`;
    await sharp(src)
      .trim({ threshold: 12 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 6 })
      .toFile(path.join(brandDir, `pass-pilot-${suffix}.png`));
  }

  fs.mkdirSync(appDir, { recursive: true });
  await sharp(src)
    .trim({ threshold: 12 })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 6 })
    .toFile(path.join(appDir, "icon.png"));
  await sharp(src)
    .trim({ threshold: 12 })
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 6 })
    .toFile(path.join(appDir, "apple-icon.png"));

  console.log(
    JSON.stringify({
      source: path.basename(src),
      logo: {
        width: logoMeta.width,
        height: logoMeta.height,
        hasAlpha: logoMeta.hasAlpha,
      },
    }),
  );
  console.log("Pass Pilot brand assets updated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
