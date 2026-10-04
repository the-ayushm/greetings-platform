import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type CompareResult = { diffPixels: number; ratio: number; diffPath: string | null };

/**
 * Pixel comparison against the golden PNG. `threshold` is pixelmatch's per-pixel colour
 * tolerance (anti-aliasing noise); the caller asserts on the ratio of differing pixels.
 */
export function compareToBaseline(baselinePath: string, actual: Buffer, outDir: string, name: string): CompareResult {
  const expected = PNG.sync.read(fs.readFileSync(baselinePath));
  const got = PNG.sync.read(actual);
  if (expected.width !== got.width || expected.height !== got.height) {
    throw new Error(`${name}: size ${got.width}x${got.height} != baseline ${expected.width}x${expected.height}`);
  }
  const diff = new PNG({ width: expected.width, height: expected.height });
  const diffPixels = pixelmatch(expected.data, got.data, diff.data, expected.width, expected.height, { threshold: 0.1, includeAA: false });
  const ratio = diffPixels / (expected.width * expected.height);
  let diffPath: string | null = null;
  if (diffPixels > 0) {
    fs.mkdirSync(outDir, { recursive: true });
    diffPath = path.join(outDir, `${name}.diff.png`);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fs.writeFileSync(path.join(outDir, `${name}.actual.png`), actual);
  }
  return { diffPixels, ratio, diffPath };
}
