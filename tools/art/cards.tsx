import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {CardArt} from '../../apps/client/src/components/CardArt';
import {deck} from '../../packages/engine/src/cards';
const requireClient=createRequire(new URL('../../apps/client/package.json',import.meta.url));
const {renderToStaticMarkup}=requireClient('react-dom/server') as {renderToStaticMarkup:(element:ReturnType<typeof CardArt>)=>string};
for(const skin of ['classica','celeste'] as const){
 const target=`assets-src/prepared/cards-${skin}{tps}`;await mkdir(target,{recursive:true});await mkdir(`assets-src/cards/${skin}`,{recursive:true});
 for(const card of deck()){const svg=renderToStaticMarkup(CardArt({card,skin}));await writeFile(`assets-src/cards/${skin}/${card}.svg`,svg+'\n');await sharp(Buffer.from(svg)).resize(200,292).png().toFile(`${target}/${skin}-${card}.png`);}
 const back=`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="146"><rect x="2" y="2" width="96" height="142" rx="8" fill="${skin==='celeste'?'#4c9fbd':'#477d87'}" stroke="#29201d" stroke-width="3"/><rect x="10" y="10" width="80" height="126" rx="5" fill="none" stroke="#e3c786" stroke-width="3"/><path d="M16 18L84 128M84 18L16 128M16 73H84M50 18V128" fill="none" stroke="#e3c786" stroke-width="2"/><circle cx="50" cy="73" r="16" fill="#e3c786"/><path d="M42 67Q37 85 50 85Q63 85 58 67ZM53 65L61 44" fill="none" stroke="#477d87" stroke-width="3"/></svg>`;
 await writeFile(`assets-src/cards/${skin}/back.svg`,back+'\n');await sharp(Buffer.from(back)).resize(200,292).png().toFile(`${target}/${skin}-back.png`);
}
console.log('80 cartas y dos dorsos SVG originales rasterizados para el atlas.');
