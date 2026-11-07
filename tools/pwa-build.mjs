import {createHash} from 'node:crypto';
import {relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,readdir,writeFile} from 'node:fs/promises';
const dist=new URL('../apps/client/dist/',import.meta.url);
const walk=async (root)=> (await readdir(new URL(root,dist),{recursive:true,withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>relative(fileURLToPath(dist),join(entry.parentPath,entry.name)).replaceAll('\\','/'));
const chunks=(await readdir(new URL('assets/',dist))).filter(name=>/\.(js|css)$/.test(name)).map(name=>'assets/'+name);
const art=(await walk('assets/art/')).filter(name=>/\/cards\/|@1x\.|\/rigs\.json$|\/wall\.webp$|base-preview\.webp$/.test(name));
const paths=['index.html','manifest.webmanifest','assets/voices/status.json',...chunks,...art,...(await walk('fonts/')).filter(path=>!path.endsWith('.ttf')),...await walk('icons/')].sort();
const template=await readFile(new URL('sw-template.js',import.meta.url),'utf8');
const key=createHash('sha256').update(template);
let bytes=0;
for(const path of paths){const body=await readFile(new URL(path,dist));key.update(path).update(body);bytes+=body.length;}
await writeFile(new URL('sw.js',dist),template.replace('__BUILD__',key.digest('hex').slice(0,16)).replace("['__PATHS__']",JSON.stringify(paths.map(path=>path==='index.html'?'/':'/'+path))));
console.log(`PWA: ${paths.length} recursos públicos, ${(bytes/1024/1024).toFixed(2)} MiB sin comprimir.`);
