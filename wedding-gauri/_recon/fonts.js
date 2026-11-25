// Extract @font-face rules for the families this invite uses, download the woff2 files, write css/fonts.css
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(__dirname, 'raw/chunks/1mt01pj6rsvjt.css'), 'utf8');
const want = ['Geist', 'Cinzel', 'Cormorant Garamond', 'Great Vibes', 'Parisienne', 'Tiro Devanagari Hindi', 'Manrope'];
const faces = css.match(/@font-face\{[^}]*\}/g);
let out = '/* Font faces recovered from the original site (Next.js next/font output). */\n';
for (const f of faces) {
  const fam = f.match(/font-family:([^;]+)/)[1].replace(/"/g, '');
  const base = fam.replace(/ Fallback$/, '');
  if (!want.includes(base)) continue;
  let rule = f.replace(/url\(([^)]+)\)/g, (m, u) => {
    const name = path.basename(u);
    const dest = path.join(root, 'assets/fonts', name);
    if (!fs.existsSync(dest)) execFileSync('curl', ['-s', '-o', dest, new URL(u, 'https://aavjoo.in/_next/static/immutable/chunks/x.css').href]);
    return `url(../assets/fonts/${name})`;
  });
  out += rule + '\n';
}
const varRules = css.match(/\.[A-Za-z0-9_-]+_variable\{--font-(geist|cinzel|cormorant|great-vibes|parisienne|deva|manrope):[^}]+\}/g) || [];
out += ':root{' + varRules.map(r => r.replace(/^[^{]+\{|\}$/g, '')).join(';') + '}\n';
fs.writeFileSync(path.join(root, 'css/fonts.css'), out);
console.log('faces written; vars:', varRules.length);
