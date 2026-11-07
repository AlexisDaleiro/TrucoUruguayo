import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const root=new URL('../apps/client/dist/assets/',import.meta.url);let bytes=0;const files=[];
for(const name of await readdir(root)){if(!/\.(js|css)$/.test(name))continue;const size=gzipSync(await readFile(new URL(name,root))).byteLength;files.push({name,gzipBytes:size});bytes+=size;}
const report={allChunksGzipBytes:bytes,budgetBytes:400*1024,withinBudget:bytes<400*1024,files};
await mkdir(new URL('../docs/evidencia/',import.meta.url),{recursive:true});await writeFile(new URL('../docs/evidencia/bundle.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(`JS+CSS (todos los chunks): ${(bytes/1024).toFixed(1)} KiB gzip / 400 KiB`);if(!report.withinBudget)process.exitCode=1;
