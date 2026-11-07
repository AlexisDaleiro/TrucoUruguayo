import {mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const icon=new URL('../assets-src/branding/icon.svg',import.meta.url);
const output=new URL('../apps/client/public/icons/',import.meta.url);
const {fileURLToPath}=await import('node:url');
await mkdir(output,{recursive:true});
for(const size of [180,192,512])await sharp(fileURLToPath(icon)).resize(size).png().toFile(fileURLToPath(new URL('boliche-'+size+'.png',output)));
await sharp(fileURLToPath(icon)).resize(394).extend({top:59,bottom:59,left:59,right:59,background:'#202b23'}).png().toFile(fileURLToPath(new URL('boliche-maskable.png',output)));
