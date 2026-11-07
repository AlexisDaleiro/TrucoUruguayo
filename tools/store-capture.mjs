/* global document, requestAnimationFrame */
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const matrixOnly=process.argv.includes('--matrix-only');
const origin=process.argv[2]??'http://127.0.0.1:8787';
const output='docs/entregas/play-store',evidence='docs/capturas/fase-8';
const sizes=[[360,640],[390,844],[412,915],[844,390],[768,1024],[1024,768],[1280,720],[1366,768],[1920,1080],[2560,1440],[3440,1440]];
await Promise.all([mkdir(output,{recursive:true}),mkdir(evidence,{recursive:true})]);
const browser=await chromium.launch({headless:true});
const errors=[];
async function open(viewport,deviceScaleFactor=2){
 const context=await browser.newContext({baseURL:origin,viewport,deviceScaleFactor,locale:'es-UY',reducedMotion:'reduce'});
 const guest=await context.request.post('/api/auth/guest',{data:{nickname:'Sofi',age13Confirmed:true}});
 if(!guest.ok())throw Error('No se pudo crear el perfil local de captura');
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await page.getByRole('button',{name:/^Tocá para entrar/}).click();
 await page.getByTestId('menu-scene').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 return {context,page};
}
async function practice(page,seats){
 await page.getByRole('button',{name:/^Jugar/}).first().click();
 await page.getByRole('button',{name:new RegExp(seats===2?'^1 vs 1':'^2 vs 2')}).click();
 await page.getByRole('button',{name:/^Práctica/}).click();
 await page.locator('canvas').waitFor();
 await page.locator('[data-card]').first().waitFor();
}
async function shot(page,name){await page.screenshot({path:`${output}/${name}.jpg`,type:'jpeg',quality:94});}

try{
 for(const [width,height] of sizes){
  const {page,context}=await open({width,height},1);
  await page.screenshot({path:`${evidence}/menu-${width}x${height}.png`,scale:'css'});
  await practice(page,2);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${evidence}/mesa-${width}x${height}.png`,scale:'css'});
  await context.close();
 }
 if(!matrixOnly){
 const telephone={width:540,height:960},compactTablet={width:720,height:1152},wideTablet={width:1024,height:640};
 for(const [name,viewport,seats] of [
  ['telefono-01-mesa-1v1',telephone,2],
  ['telefono-02-mesa-2v2',telephone,4],
  ['telefono-03-truco',telephone,2],
  ['tablet-7-01-mesa-1v1',compactTablet,2],
  ['tablet-7-02-mesa-2v2',compactTablet,4],
  ['tablet-10-01-mesa-1v1',wideTablet,2],
  ['tablet-10-02-mesa-2v2',wideTablet,4],
 ]){
  const {page,context}=await open(viewport);
  await practice(page,seats);
  if(name==='telefono-03-truco'){
   await page.getByRole('button',{name:'¡Truco!',exact:true}).click();
   await page.getByText('¡Truco!',{exact:true}).first().waitFor();
  }
  await shot(page,name);await context.close();
 }
 const {page,context}=await open(telephone);
 await page.getByRole('button',{name:'Opciones',exact:true}).first().click();
 await page.getByRole('button',{name:'Aprender a jugar',exact:true}).click();
 await page.getByRole('heading',{name:'Aprender a jugar',exact:true}).waitFor();
 await shot(page,'telefono-04-aprender');
 await context.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
