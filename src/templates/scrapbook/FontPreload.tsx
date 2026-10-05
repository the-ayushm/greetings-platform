import { preload } from "react-dom";

/**
 * The Latin files of the four template fonts, preloaded so text paints without waiting for the
 * stylesheet to be parsed first. Same files fonts.css points at (no double download).
 */
const LATIN = ["947ed15831ba3bb2", "e10563a873a37024", "6a8370661dae1863", "fd8b8aea8febbcde", "89b4e03c45e92893"];

export function FontPreload() {
  for (const f of LATIN) preload(`/fonts/${f}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return null;
}
