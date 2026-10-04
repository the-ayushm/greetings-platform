import fs from "node:fs";

// Tests use the same local configuration as `next dev` (.env.local), never production values.
for (const f of [".env.local", ".env.test"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]!] === undefined) process.env[m[1]!] = m[2];
  }
}
process.env.LOG_LEVEL = "silent";
