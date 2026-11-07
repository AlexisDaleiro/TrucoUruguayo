import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {AssetPack} from '@assetpack/core';
import {texturePacker} from '@assetpack/core/texture-packer';

// All parts share a 320x320 reference canvas, origin (160,110), exported at 2x.
const base=[['face',130,126,0,4],['torso',200,170,0,115],['upper-left',65,95,-79,85],['upper-right',65,95,79,85],['forearm-left',85,55,-58,143],['forearm-right',85,55,58,143],['hand-left',58,35,-22,157],['hand-right',58,35,27,157],['hair',145,85,0,-61],['back-head',130,135,0,-7],['back-torso',205,175,0,113],['cards-hands',155,100,0,146],['eyes-open',82,28,0,-11],['brows-neutral',87,20,0,-29],['mouth-neutral',42,24,0,39],['nose',85,52,0,14]];
const a=[['eyes-open',82,28,0,-11],['eyes-half',82,28,0,-11],['eyes-closed',82,20,0,-10],['eyes-wink-right',82,28,0,-11],['eyes-wink-left',82,28,0,-11],['eyes-left',82,28,0,-11],['eyes-right',82,28,0,-11],['brows-raised',87,20,0,-35],['brows-furrowed',87,20,0,-29],['brows-neutral',87,20,0,-29],['nose-wrinkled',85,52,0,14],['cheeks',105,37,0,21],['mouth-neutral',42,24,0,39],['mouth-smile',46,28,0,39],['mouth-shout',44,39,0,41],['mouth-o',30,32,0,41]];
const b=[['mouth-kiss',25,27,0,39],['mouth-bite',42,27,0,39],['mouth-tongue',37,34,0,41],['mouth-lick',42,28,0,37],['mouth-right',42,24,9,39],['mouth-left',42,24,-9,39],['mouth-half',40,27,0,39],['mouth-angry',42,24,0,39],['hand-grip',64,65,-16,151],['hand-slam',69,49,27,157],['hand-chin',55,75,0,67],['hand-point',73,55,25,139],['hand-mate',54,62,-22,143],['back-arm-left',75,115,-80,125],['back-arm-right',75,115,80,125],['nape',65,66,0,28]];
const output='apps/client/public/assets/art';
function cleanComponents(raw,width,height){const visited=new Uint8Array(width*height),components=[];for(let p=0;p<visited.length;p++){if(visited[p]||!raw[p*4+3])continue;const queue=[p];visited[p]=1;for(let q=0;q<queue.length;q++){const current=queue[q],x=current%width,y=Math.floor(current/width);for(const next of [x>0?current-1:-1,x<width-1?current+1:-1,y>0?current-width:-1,y<height-1?current+width:-1])if(next>=0&&!visited[next]&&raw[next*4+3]){visited[next]=1;queue.push(next);}}components.push(queue);}const largest=Math.max(...components.map(c=>c.length));for(const component of components)if(component.length<largest*.03)for(const p of component)raw[p*4+3]=0;}
const manifest={version:1,reference:{width:320,height:320,origin:[160,110]},characters:{}};
for(const character of ['washington','marta']){
 const target=path.resolve(`assets-src/prepared/${character}{tps}`),preparedRoot=path.resolve('assets-src/prepared');if(!target.startsWith(preparedRoot+path.sep))throw Error('Destino de arte fuera del workspace');await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
 const parts={};
 for(const [file,specs] of [['base-sheet.png',base],['expressions-a.png',a],['expressions-b.png',b]]){
  const source=`assets-src/characters/${character}/${file}`;let metadata;
  try{metadata=await sharp(source).metadata();}catch{continue;}
  for(const [index,spec] of specs.entries()){
   const [name,width,height,x,y]=spec;const col=index%4,row=Math.floor(index/4);const left=Math.round(col*metadata.width/4),top=Math.round(row*metadata.height/4);const cellWidth=Math.round((col+1)*metadata.width/4)-left,cellHeight=Math.round((row+1)*metadata.height/4)-top;
   const raw=await sharp(source).extract({left,top,width:cellWidth,height:cellHeight}).ensureAlpha().raw().toBuffer();
   // Remove low-opacity generative specks before alpha-based trim; preserve antialiasing > 32.
   for(let i=3;i<raw.length;i+=4)if(raw[i]<32)raw[i]=0;
   if(character==='washington'&&file==='expressions-a.png'&&index<7)for(let y=0;y<cellHeight*.48;y++)for(let x=0;x<cellWidth;x++)raw[(y*cellWidth+x)*4+3]=0;
   cleanComponents(raw,cellWidth,cellHeight);
   const fitWidth=character==='marta'&&name.startsWith('nose')?38:width;
   let trimmed=await sharp(raw,{raw:{width:cellWidth,height:cellHeight,channels:4}}).trim({background:'#00000000',threshold:24}).png().toBuffer();
   if(name.startsWith('forearm-'))trimmed=await sharp(trimmed).resize(60,160,{fit:'fill'}).rotate(name.endsWith('left')?-50:50,{background:'#00000000'}).png().toBuffer();
   const image=await sharp(trimmed).resize({width:fitWidth*2,height:height*2,fit:name.startsWith('upper-')?'fill':'contain',background:'#00000000'}).png().toBuffer();
   const canvas=await sharp({create:{width:640,height:640,channels:4,background:'#00000000'}}).composite([{input:image,left:Math.round((160+x-fitWidth/2)*2),top:Math.round((110+y-height/2)*2)}]).png().toBuffer();
   await writeFile(`${target}/${character}-${name}.png`,canvas);
   if(name.startsWith('brows-'))for(const side of ['left','right']){const data=await sharp(canvas).raw().toBuffer();for(let row=0;row<640;row++)for(let col=0;col<640;col++)if(side==='left'?col>=320:col<320)data[(row*640+col)*4+3]=0;await sharp(data,{raw:{width:640,height:640,channels:4}}).png().toFile(`${target}/${character}-${name}-${side}.png`);}
   parts[name]={pivot:[160,110],parent:name.startsWith('mouth')||name.startsWith('eyes')||name.startsWith('brows')||name.startsWith('nose')||name==='hair'||name==='face'||name==='cheeks'?'head':name.startsWith('hand')?'hands':name.includes('arm')?'arms':'torso'};
   if(name.startsWith('brows-'))for(const side of ['left','right'])parts[`${name}-${side}`]={pivot:[160,110],parent:'head'};
  }
 }
 const rig={reference:manifest.reference,parts,hierarchy:{head:'root',torso:'root',arms:'root',hands:'root'},atlas:`/assets/art/${character}@2x.json`,lowAtlas:`/assets/art/${character}@1x.json`};
 await writeFile(`assets-src/characters/${character}/rig.json`,JSON.stringify(rig,null,2)+'\n');manifest.characters[character]=rig;
}
await mkdir(output,{recursive:true});
const pack=new AssetPack({entry:'assets-src/prepared',output,cache:false,strict:true,pipes:[texturePacker({texturePacker:{nameStyle:'relative',allowRotation:false,allowTrim:true,padding:4,width:4096,height:4096},resolutionOptions:{template:'@%%x',resolutions:{'2':2,'1':1},fixedResolution:'2',maximumTextureSize:4096}})]});await pack.run();
for(const character of ['washington','marta','cards-classica','cards-celeste']){
 const atlas=JSON.parse(await readFile(`${output}/${character}.json`,'utf8'));atlas.meta.image=`${character}@1x.png`;
 await rename(`${output}/${character}.png`,`${output}/${character}@1x.png`);await rename(`${output}/${character}.json`,`${output}/${character}@1x.json`);
 await writeFile(`${output}/${character}@1x.json`,JSON.stringify(atlas)+'\n');
 for(const scale of [1,2]){const image=await sharp(`${output}/${character}@${scale}x.png`).metadata();if(image.width<32||image.height<32)throw Error(`Atlas vacío: ${character}`);}
}
await sharp('assets-src/environments/galpon/wall.png').resize({width:1672}).webp({quality:87}).toFile(`${output}/wall.webp`);
await writeFile(`${output}/rigs.json`,JSON.stringify(manifest)+'\n');
// Retain the generator prompt history outside the compressed runtime output.
await readFile(path.join(output,'rigs.json'));
console.log('Arte procesado: lienzos alineados, alpha, rigs y atlas @1x/@2x.');
