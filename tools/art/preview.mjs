import {readFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const gestures=[['neutral','open','neutral','neutral','nose'],['cejas','open','raised','neutral','nose'],['beso','open','neutral','kiss','nose'],['nariz','open','neutral','neutral','nose-wrinkled'],['guinoDerecho','wink-right','neutral','neutral','nose'],['guinoIzquierdo','wink-left','neutral','neutral','nose'],['labiosDerecha','open','neutral','right','nose'],['menton','open','neutral','neutral','nose'],['labiosIzquierda','open','neutral','left','nose'],['cejaIzquierda','open','neutral','neutral','nose'],['morderLabio','open','neutral','bite','nose'],['bocaAbierta','open','neutral','shout','nose'],['lengua','open','neutral','tongue','nose'],['ojosCerrados','closed','neutral','neutral','nose'],['cachetes','open','neutral','neutral','nose'],['lamerLabio','open','neutral','lick','nose']];
await mkdir('docs/arte',{recursive:true});
for(const character of ['washington','marta']){const images=[];
 for(const [i,[name,eyes,brows,mouth,nose]]of gestures.entries()){
  const parts=['torso','face','hair',`eyes-${eyes}`,`brows-${brows}-left`,`brows-${brows}-right`,`mouth-${mouth}`,nose,'upper-left','upper-right','forearm-left','forearm-right','hand-left','hand-right'];if(name==='cachetes')parts.push('cheeks');if(name==='menton')parts[parts.indexOf('hand-left')]='hand-chin';if(name==='cejaIzquierda')parts[parts.indexOf('brows-neutral-left')]='brows-raised-left';
  const inputs=await Promise.all(parts.map(part=>readFile(`assets-src/prepared/${character}{tps}/${character}-${part}.png`)));
  const composite=await sharp({create:{width:640,height:640,channels:4,background:'#ead6af'}}).composite(inputs.map(input=>({input,left:0,top:0}))).png().toBuffer();const characterImage=await sharp(composite).resize(300,300).png().toBuffer();images.push({input:characterImage,left:(i%4)*320,top:Math.floor(i/4)*340+30});
  const label=Buffer.from(`<svg width="320" height="30"><text x="12" y="23" font-size="19" fill="#29201d">${name}</text></svg>`);images.push({input:label,left:(i%4)*320,top:Math.floor(i/4)*340});
 }
 await sharp({create:{width:1280,height:1360,channels:3,background:'#f5e7cc'}}).composite(images).jpeg({quality:88}).toFile(`docs/arte/revision-${character}.jpg`);
}
console.log('Dos hojas de montaje para revisar expresiones y alineación.');
