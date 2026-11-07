import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';

const dist=new URL('../apps/client/dist/',import.meta.url);
const assetFolder=new URL('assets/',dist);
const manifest=JSON.parse(await readFile(new URL('.vite/manifest.json',dist),'utf8'));
const startup=new Set(),visited=new Set();
function collect(key){
 if(visited.has(key))return;
 const item=manifest[key];if(!item)throw Error('Entrada ausente del manifiesto: '+key);
 visited.add(key);startup.add(item.file);for(const css of item.css??[])startup.add(css);
 for(const dependency of item.imports??[])collect(dependency);
}
collect('index.html');
// Supabase Auth can load immediately on a configured deployment.
for(const key of Object.keys(manifest))if(key.includes('/supabase-js/'))collect(key);

const files=[];
for(const name of await readdir(assetFolder)){
 if(!/\.(js|css)$/.test(name))continue;
 files.push({name,gzipBytes:gzipSync(await readFile(new URL(name,assetFolder))).byteLength,initialMenu:startup.has('assets/'+name)});
}
const total=files.reduce((bytes,file)=>bytes+file.gzipBytes,0);
const initial=files.reduce((bytes,file)=>bytes+(file.initialMenu?file.gzipBytes:0),0);
const budget=400*1024;
const report={initialMenuGzipBytes:initial,allChunksGzipBytes:total,budgetBytes:budget,withinBudget:initial<budget,files};
await mkdir(new URL('../docs/evidencia/',import.meta.url),{recursive:true});
await writeFile(new URL('../docs/evidencia/bundle.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`JS+CSS gzip: menú ${(initial/1024).toFixed(1)} KiB / 400 KiB. Todos los chunks ${(total/1024).toFixed(1)} KiB.`);
if(!report.withinBudget)process.exitCode=1;
