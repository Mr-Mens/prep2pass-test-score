/**
 * Replace the social banner footer strip with shorter copy, then refresh OG exports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const brandDir = path.join(root, "public/brand");
const socialDir = path.join(root, "public/social-banner");

export const SOCIAL_BANNER_FOOTER =
  "Helping Learners, instructors and Parents/Supervisors";
const SOCIAL_BANNER_DISCLAIMER = "INDEPENDENT & NOT AFFILIATED WITH DVSA";

const FOOTER_BG = "#063888";

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function footerSvg(width, height) {
  const mainText = escapeXml(SOCIAL_BANNER_FOOTER);
  const disclaimer = escapeXml(SOCIAL_BANNER_DISCLAIMER);
  const fontSize = width >= 1600 ? 30 : 26;
  const disclaimerSize = width >= 1600 ? 19 : 17;
  const dividerX = Math.round(width * 0.72);

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${FOOTER_BG}"/>
  <g transform="translate(36, ${Math.round(height / 2 - 18)})" fill="none" stroke="#ffffff" stroke-width="2.5">
    <path d="M16 2 L28 6 V14 C28 22 22 28 16 30 C10 28 4 22 4 14 V6 Z"/>
    <path d="M11 15 L14.5 18.5 L21 12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="88" y="${Math.round(height * 0.62)}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600">${mainText}</text>
  <line x1="${dividerX}" y1="16" x2="${dividerX}" y2="${height - 16}" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="${width - 28}" y="${Math.round(height * 0.62)}" text-anchor="end" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${disclaimerSize}" font-weight="500">${disclaimer}</text>
</svg>`);
}

async function patchBanner(sourcePath, outputPath) {
  const meta = await sharp(sourcePath).metadata();
  const width = meta.width ?? 1983;
  const height = meta.height ?? 793;
  const footerHeight = Math.round(height * 0.124);
  const footerTop = height - footerHeight;

  const footerOverlay = await sharp(footerSvg(width, footerHeight)).png().toBuffer();
  const tempPath = `${outputPath}.tmp.png`;

  await sharp(sourcePath)
    .composite([{ input: footerOverlay, top: footerTop, left: 0 }])
    .png({ compressionLevel: 6 })
    .toFile(tempPath);

  fs.renameSync(tempPath, outputPath);

  return { width, height, footerTop, footerHeight };
}

async function exportOg(sourcePath) {
  const ogBackground = { r: 255, g: 255, b: 255, alpha: 1 };
  const ogPipeline = sharp(sourcePath).resize(1200, 630, {
    fit: "contain",
    background: ogBackground,
  });
  fs.mkdirSync(socialDir, { recursive: true });
  await ogPipeline.clone().png({ compressionLevel: 6 }).toFile(path.join(socialDir, "og.png"));
  await ogPipeline.clone().webp({ quality: 92 }).toFile(path.join(socialDir, "og.webp"));
}

async function run() {
  const sourceCandidates = [
    path.join(brandDir, "social banner.png"),
    path.join(brandDir, "social-banner.png"),
  ];
  const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));
  if (!source) throw new Error("Social banner source not found in public/brand/");

  const patchedPath = path.join(brandDir, "social banner.png");
  const info = await patchBanner(source, patchedPath);
  await exportOg(patchedPath);

  console.log(
    JSON.stringify({
      source: path.basename(source),
      footer: SOCIAL_BANNER_FOOTER,
      patched: patchedPath,
      og: path.join(socialDir, "og.png"),
      ...info,
    }),
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
