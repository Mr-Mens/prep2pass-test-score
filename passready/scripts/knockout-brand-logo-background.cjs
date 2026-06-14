"use strict";

/**
 * Makes the brand logo PNG sit cleanly on white: knocks near-black backdrop to transparent.
 * Re-run after replacing public/brand/test-ready-score-logo.png if the backdrop colour changes.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const input = path.join(__dirname, "..", "public", "brand", "test-ready-score-logo.png");
const tmp = `${input}.tmp.png`;

(async () => {
  const pipeline = sharp(input).ensureAlpha();
  const meta = await pipeline.metadata();
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) throw new Error("Could not read image dimensions");

  const { data } = await pipeline.raw().toBuffer({ resolveWithObject: true }).then((x) => x);

  /** Euclidean distance from #000, keeps saturated dark blues (e.g. #002d54). */
  const distBlack = (r, g, b) => Math.hypot(r, g, b);
  const threshold = 38;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (distBlack(data[i], data[i + 1], data[i + 2]) < threshold) {
      data[i + 3] = 0;
      n++;
    }
  }

  console.log(JSON.stringify({ width, height, madeTransparentPixels: n, totalPixels: width * height }));

  await sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(tmp);

  fs.renameSync(tmp, input);
  console.log("Updated", input);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
