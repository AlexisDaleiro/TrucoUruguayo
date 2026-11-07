import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const sizes=[[360,640],[390,844],[412,915],[844,390],[768,1024],[1024,768],[1280,720],[1366,768],[1920,1080],[2560,1440],[3440,1440]];
let browserErrors:string[]=[];
test.beforeEach(({page})=>{browserErrors=[];page.on('pageerror',error=>browserErrors.push(error.message));});
test.afterEach(()=>expect(browserErrors).toEqual([]));
test('menú y partida en matriz responsive',async({page})=>{
 test.setTimeout(180000);
 const folder=`docs/capturas/fase-${process.env.CAPTURE_PHASE??'2'}`;await mkdir(folder,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:/Tocá para entrar/}).click();await expect(page.locator('canvas')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.screenshot({path:`${folder}/menu-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const b=await page.getByRole('button',{name:'Jugar',exact:false}).first().boundingBox();expect(b!.y+b!.height).toBeLessThanOrEqual(height);}
 await page.goto('/?local=1');await expect(page.locator('[data-card]').first()).toBeVisible();await expect(page.locator('canvas')).toBeVisible();
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.screenshot({path:`${folder}/mesa-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 expect(errors).toEqual([]);
});
test('partida completa a 30 con entradas de la interfaz',async({page})=>{
 test.setTimeout(180000);await page.goto('/?local=1');await page.evaluate(()=>window.bolicheDebug?.fast());let steps=0;
 while(!await page.getByRole('button',{name:'Otra partida',exact:false}).count()){
  if(++steps>1200)throw new Error('La partida no termina');
  const card=page.locator('[data-card]:not(:disabled)').first();if(await card.count()){await card.click();continue;}
  let chosen=false;for(const name of ['Quiero','Flor','Siguiente mano']){const button=page.getByRole('button',{name,exact:name!=='Siguiente mano'});if(await button.count()){await button.first().click();chosen=true;break;}}
  if(!chosen)await page.waitForTimeout(50);
 }
 const view=await page.evaluate(()=>window.bolicheDebug?.view());expect(Math.max(...view!.scores)).toBeGreaterThanOrEqual(30);expect(view!.winner).not.toBeNull();await mkdir('docs/capturas/fase-2',{recursive:true});await page.screenshot({path:'docs/capturas/fase-2/fin-partida.png'});
});
test('galerías y rendimiento CPU4x',async({page})=>{
 await page.goto('/dev/animaciones');await expect(page.locator('canvas')).toBeVisible();for(const name of ['shuffle','deal','sample','select','play','piece','trick','parda','truco','envido','flor','collect','points','victory','defeat','idle','thinking','sena','disconnect'])await page.getByRole('button',{name,exact:true}).click();await page.screenshot({path:'docs/capturas/fase-2/animaciones.png'});
 await page.goto('/dev/sonidos');await page.getByRole('button',{name:'button',exact:true}).click();await page.screenshot({path:'docs/capturas/fase-2/sonidos.png'});
 await page.setViewportSize({width:390,height:844});await page.goto('/?local=1');await expect(page.locator('canvas')).toBeVisible();await page.waitForTimeout(3000);const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const perf=await page.evaluate(()=>new Promise<{frames:number;elapsed:number;fps:number;p95:number}>(resolve=>{const times:number[]=[];let last=performance.now();const start=last;function frame(now:number){times.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(frame);else{times.sort((a,b)=>a-b);resolve({frames:times.length,elapsed:now-start,fps:times.length*1000/(now-start),p95:times[Math.floor(times.length*.95)]});}}requestAnimationFrame(frame);}));await mkdir('docs/evidencia',{recursive:true});await writeFile('docs/evidencia/rendimiento-fase-2.json',JSON.stringify(perf,null,2));expect(perf.fps).toBeGreaterThan(50);
});
