// Generates the binary test fixtures in tests/fixtures (run once; outputs are committed).
// Everything is synthetic: gradients and sine tones, no third-party media.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const OUT = path.resolve("tests/fixtures");
fs.mkdirSync(OUT, { recursive: true });
const out = (f) => path.join(OUT, f);

const gradient = (w, h) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f59ab8"/><stop offset="1" stop-color="#dccbf7"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w / 2}" cy="${h / 2}" r="${h / 4}" fill="#fff8ec"/></svg>`,
  );

// A phone-style JPEG carrying camera + GPS EXIF (what we must strip).
await sharp(gradient(1600, 1200))
  .jpeg({ quality: 85 })
  .withExif({
    IFD0: { Make: "TestPhone", Model: "Fixture 1", Software: "fixture-generator" },
    IFD3: { GPSLatitudeRef: "N", GPSLatitude: "12/1 58/1 4400/100", GPSLongitudeRef: "E", GPSLongitude: "77/1 35/1 2400/100" },
  })
  .toFile(out("photo-gps.jpg"));
await sharp(gradient(900, 900)).png().toFile(out("photo.png"));
await sharp(gradient(800, 600)).webp().toFile(out("photo.webp"));
// 10000 × 5000 = 50 MP: above the 40 MP decode limit (decompression-bomb guard), tiny on disk.
await sharp({ create: { width: 10000, height: 5000, channels: 3, background: "#ffffff" } }).png({ compressionLevel: 9 }).toFile(out("bomb.png"));

fs.writeFileSync(out("not-an-image.jpg"), Buffer.concat([Buffer.from("MZ"), Buffer.alloc(2048, 0x90)]));
fs.writeFileSync(out("evil.svg"), '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(document.cookie)</script></svg>');
fs.writeFileSync(out("fake.heic"), Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic"), Buffer.alloc(64, 1)]));
fs.writeFileSync(out("fake.mp3"), Buffer.from("this is not audio at all, just text pretending to be an mp3 file\n".repeat(20)));

const run = (args) => execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args]);
await sharp(gradient(300, 300)).jpeg().toFile(out("cover-art.jpg"));
// 6 s tone with ID3 title/artist/comment AND embedded cover art.
run(["-f", "lavfi", "-i", "sine=frequency=523:duration=6", "-i", out("cover-art.jpg"), "-map", "0:a", "-map", "1:v", "-c:a", "libmp3lame", "-b:a", "96k", "-c:v", "mjpeg", "-id3v2_version", "3",
  "-metadata", "title=Secret Title", "-metadata", "artist=Private Artist", "-metadata", "comment=GPS 12.97,77.59", "-metadata:s:v", "title=Album cover", "-disposition:v", "attached_pic", out("song.mp3")]);
run(["-f", "lavfi", "-i", "sine=frequency=659:duration=6", "-c:a", "aac", "-b:a", "96k", "-metadata", "title=Secret Title", "-metadata", "artist=Private Artist", out("song.m4a")]);
run(["-f", "lavfi", "-i", "sine=frequency=784:duration=6", "-c:a", "aac", "-b:a", "96k", "-f", "adts", out("song.aac")]);
run(["-f", "lavfi", "-i", "sine=frequency=440:duration=540", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "8k", out("long-9min.mp3")]);
run(["-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-c:a", "pcm_s16le", out("song.wav")]);

for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(22), fs.statSync(out(f)).size, "bytes");
