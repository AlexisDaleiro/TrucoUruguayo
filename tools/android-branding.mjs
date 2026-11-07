import {join} from 'node:path';
import {readdir} from 'node:fs/promises';
import sharp from 'sharp';

const res='android/app/src/main/res';
const icon='apps/client/public/icons/boliche-512.png';
for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
 for(const name of ['ic_launcher','ic_launcher_round','ic_launcher_foreground']){
  await sharp(icon).resize(size).png().toFile(join(res,'mipmap-'+density,name+'.png'));
 }
}
for(const dir of (await readdir(res)).filter(name=>name.startsWith('drawable'))){
 const files=await readdir(join(res,dir));
 if(!files.includes('splash.png'))continue;
 const path=join(res,dir,'splash.png');
 const {width,height}=await sharp(path).metadata();
 const size=Math.round(Math.min(width,height)*.27);
 const mark=await sharp(icon).resize(size).toBuffer();
 await sharp({create:{width,height,channels:3,background:'#241c18'}}).composite([{input:mark,gravity:'centre'}]).png().toBuffer().then(async buffer=>{
  const {writeFile}=await import('node:fs/promises');await writeFile(path,buffer);
 });
}
