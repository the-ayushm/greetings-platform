const fs = require('fs');
const h = fs.readFileSync(__dirname + '/raw/page.html', 'utf8');
const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
let m, s = '';
while ((m = re.exec(h))) s += JSON.parse('"' + m[1] + '"');
fs.writeFileSync(__dirname + '/raw/rsc.txt', s);
const i = s.indexOf('"invite":');
console.log(s.length, i);
console.log(s.slice(i, i + 7000));
