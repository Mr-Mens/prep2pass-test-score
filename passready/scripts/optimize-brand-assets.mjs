/**
 * Generate Pass Pilot logo, social preview, and PWA icon assets.
 *
 * App icons are built from `public/brand/icon.*` (symbol only, no wordmark).
 * Falls back to cropping the emblem from the full logo lockup when that file is missing.
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

/** Emblem height as a fraction of the trimmed full lockup (fallback only). */
const EMBLEM_HEIGHT_RATIO = 0.56;
/** Symbol size on canvas for standard icons when composing from a trimmed symbol. */
const SYMBOL_ICON_SCALE = 0.92;
/**
 * Maskable safe zone: critical artwork must fit in the centre 80% diameter circle.
 * @see https://w3c.github.io/manifest/#icon-masks
 */
const MASKABLE_SAFE_ZONE_DIAMETER = 0.8;
const MASKABLE_SYMBOL_SCALE = 0.72;
const MASKABLE_ICON_SIZES = [512, 192];
const ICON_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

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

function resolveIconSymbolSource() {
  const stems = ["icon"];
  const extensions = [".png", ".jpeg", ".jpg", ".webp"];
  for (const stem of stems) {
    for (const ext of extensions) {
      const candidate = path.join(brandDir, `${stem}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
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

async function loadSymbolBuffer(src) {
  return sharp(src).trim({ threshold: 12 }).png().toBuffer();
}

async function extractEmblemFromLogo(src) {
  const trimmedBuffer = await sharp(src).trim({ threshold: 12 }).toBuffer();
  const meta = await sharp(trimmedBuffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Could not read logo dimensions.");
  }

  const emblemHeight = Math.max(1, Math.round(meta.height * EMBLEM_HEIGHT_RATIO));
  return sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: meta.width, height: emblemHeight })
    .trim({ threshold: 12 })
    .png()
    .toBuffer();
}

async function resolveSymbolBuffer() {
  const iconSource = resolveIconSymbolSource();
  if (iconSource) {
    return { buffer: await loadSymbolBuffer(iconSource), source: iconSource, fromDedicatedIcon: true };
  }

  const logoSource = resolveSource();
  return {
    buffer: await extractEmblemFromLogo(logoSource),
    source: logoSource,
    fromDedicatedIcon: false,
  };
}

async function renderStandardIcon(symbolBuffer, size, symbolScale) {
  const inner = Math.max(1, Math.round(size * symbolScale));
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ICON_BACKGROUND,
    },
  })
    .composite([
      {
        input: await sharp(symbolBuffer)
          .resize(inner, inner, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png({ compressionLevel: 6 });
}

async function renderMaskableIcon(symbolBuffer, size) {
  return renderStandardIcon(symbolBuffer, size, MASKABLE_SYMBOL_SCALE);
}

async function run() {
  const src = resolveSource();
  const logoPipeline = await loadLogoPipeline(src);
  const logoMeta = await logoPipeline.clone().metadata();
  const { buffer: symbolBuffer, source: symbolSource, fromDedicatedIcon } = await resolveSymbolBuffer();
  const symbolMeta = await sharp(symbolBuffer).metadata();

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

  const standardScale = fromDedicatedIcon ? SYMBOL_ICON_SCALE : 0.58;

  for (const size of [512, 192, 180, 32]) {
    const suffix = size === 32 ? "favicon-32" : `icon-${size}`;
    const icon = await renderStandardIcon(symbolBuffer, size, standardScale);
    await icon.toFile(path.join(brandDir, `pass-pilot-${suffix}.png`));
  }

  for (const size of MASKABLE_ICON_SIZES) {
    const maskableIcon = await renderMaskableIcon(symbolBuffer, size);
    await maskableIcon.toFile(path.join(brandDir, `pass-pilot-icon-${size}-maskable.png`));
  }

  fs.mkdirSync(appDir, { recursive: true });
  await (await renderStandardIcon(symbolBuffer, 512, standardScale)).toFile(path.join(appDir, "icon.png"));
  await (await renderStandardIcon(symbolBuffer, 180, standardScale)).toFile(path.join(appDir, "apple-icon.png"));

  console.log(
    JSON.stringify({
      logoSource: path.basename(src),
      iconSource: path.basename(symbolSource),
      iconSourceType: fromDedicatedIcon ? "dedicated-symbol" : "logo-emblem-fallback",
      logo: {
        width: logoMeta.width,
        height: logoMeta.height,
        hasAlpha: logoMeta.hasAlpha,
      },
      symbol: {
        width: symbolMeta.width,
        height: symbolMeta.height,
      },
      iconScales: {
        standard: standardScale,
        maskable: MASKABLE_SYMBOL_SCALE,
        maskableSafeZoneDiameter: MASKABLE_SAFE_ZONE_DIAMETER,
      },
    }),
  );
  console.log("Pass Pilot brand assets updated.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
