import fs from "node:fs"; import { PNG } from "pngjs";
const [,, a, b, x, y, w, h, out, scale="6"] = process.argv;
const imgs=[a,b].map(p=>PNG.sync.read(fs.readFileSync(p)));
const S=+scale, W=+w, H=+h; const o=new PNG({width:W*S*2+4,height:H*S});
for (let k=0;k<2;k++) for (let j=0;j<H;j++) for (let i=0;i<W;i++){ const src=imgs[k]; const si=((+y+j)*src.width+(+x+i))*4;
 for (let dy=0;dy<S;dy++) for(let dx=0;dx<S;dx++){ const di=((j*S+dy)*o.width+(k*(W*S+4)+i*S+dx))*4; for(let c=0;c<4;c++) o.data[di+c]=src.data[si+c]; } }
fs.writeFileSync(out, PNG.sync.write(o));
