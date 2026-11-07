import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const root='apps/client/public/assets/art',rigs=JSON.parse(await readFile(`${root}/rigs.json`,'utf8'));const details=[];
for(const name of ['washington','marta','cards-classica','cards-celeste'])for(const resolution of [1,2]){
 const sheet=JSON.parse(await readFile(`${root}/${name}@${resolution}x.json`,'utf8')),file=`${root}/${sheet.meta.image}`,metadata=await sharp(file).metadata();
 if(!metadata.hasAlpha||metadata.width!==sheet.meta.size.w||metadata.height!==sheet.meta.size.h)throw Error(`Atlas incompatible ${name}@${resolution}x`);
 const names=Object.keys(sheet.frames);if(name in rigs.characters)for(const part of Object.keys(rigs.characters[name].parts))if(!names.includes(`${name}-${part}.png`))throw Error(`Falta ${name}/${part}`);
 if(name.startsWith('cards-')&&names.length!==41)throw Error(`Baraja incompleta ${name}`);
 for(const [frameName,{frame}]of Object.entries(sheet.frames)){if(frame.w<1||frame.h<1||frame.x<0||frame.y<0||frame.x+frame.w>metadata.width||frame.y+frame.h>metadata.height)throw Error(`Frame inválido ${frameName}`);}
 const stats=await sharp(file).stats();if(stats.channels[3].min!==0||stats.channels[3].max<128)throw Error(`Alpha incorrecto ${file}`);
 details.push({name,resolution,width:metadata.width,height:metadata.height,frames:names.length,rgbaBytes:metadata.width*metadata.height*4});
}
const highBytes=details.filter(row=>row.resolution===2&&!row.name.endsWith('celeste')).reduce((sum,row)=>sum+row.rgbaBytes,0);if(highBytes>128*1024*1024)throw Error('Arte excede128MiB; no deja margen para caché/renderer.');
await writeFile('docs/evidencia/atlas.json',JSON.stringify({highBytes,cacheReserveBytes:128*1024*1024,details},null,2)+'\n');console.log(`Atlas válidos; fuentes de escena alta ${(highBytes/1024/1024).toFixed(1)}MiB RGBA, sin contar caché/renderer.`);
