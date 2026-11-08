import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {captureRoot,capturePhase} from './captures';
const sizes=[[360,640],[390,844],[412,915],[844,390],[768,1024],[1024,768],[1280,720],[1366,768],[1920,1080],[2560,1440],[3440,1440]];
let browserErrors:string[]=[];
test.beforeEach(async({page})=>{await page.request.post('/api/auth/guest',{data:{nickname:'Paisano de prueba',age13Confirmed:true}});await mkdir(captureRoot,{recursive:true});browserErrors=[];page.on('pageerror',error=>browserErrors.push(error.message));});
test.afterEach(()=>expect(browserErrors).toEqual([]));
test('menú y partida en matriz responsive',async({page})=>{
 test.setTimeout(180000);
 const folder=captureRoot;await mkdir(folder,{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:/Tocá para entrar/}).click();await expect(page.getByTestId('menu-scene')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.screenshot({path:`${folder}/menu-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const b=await page.getByRole('button',{name:'Jugar',exact:false}).first().boundingBox();expect(b!.y+b!.height).toBeLessThanOrEqual(height);}
 await page.goto('/?local=1');await expect(page.locator('[data-card]').first()).toBeVisible();await expect(page.locator('canvas')).toBeVisible();
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.screenshot({path:`${folder}/mesa-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width/height<=.8){const hand=page.locator('[data-local-hand]');expect(await hand.evaluate(element=>element.getBoundingClientRect().bottom<=element.nextElementSibling!.getBoundingClientRect().top)).toBe(true);}}
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
 const view=await page.evaluate(()=>window.bolicheDebug?.view());expect(Math.max(...view!.scores)).toBeGreaterThanOrEqual(30);expect(view!.winner).not.toBeNull();await mkdir(captureRoot,{recursive:true});await page.screenshot({path:`${captureRoot}/fin-partida.png`});
});
test('galerías y rendimiento CPU4x',async({page})=>{
 await page.goto('/dev/animaciones');await expect(page.locator('canvas')).toBeVisible();for(const name of ['shuffle','deal','sample','select','play','piece','trick','parda','truco','envido','flor','collect','points','victory','defeat','idle','thinking','sena','disconnect'])await page.getByRole('button',{name,exact:true}).click();await page.screenshot({path:`${captureRoot}/animaciones.png`});await page.getByRole('combobox',{name:'Cartas',exact:true}).selectOption('celeste');await expect(page.locator('canvas')).toHaveAttribute('data-skin','celeste');await page.screenshot({path:`${captureRoot}/cartas-celeste.png`});
 await page.goto('/dev/sonidos');await expect(page.locator('canvas')).toBeVisible();await page.getByRole('button',{name:'button',exact:true}).click();await page.screenshot({path:`${captureRoot}/sonidos.png`});
 await page.setViewportSize({width:390,height:844});await page.goto('/?local=1');await expect(page.locator('canvas')).toBeVisible();await page.waitForTimeout(3000);const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const perf=await page.evaluate(()=>new Promise<{frames:number;elapsed:number;fps:number;p95:number}>(resolve=>{const times:number[]=[];let last=performance.now();const start=last;function frame(now:number){times.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(frame);else{times.sort((a,b)=>a-b);resolve({frames:times.length,elapsed:now-start,fps:times.length*1000/(now-start),p95:times[Math.floor(times.length*.95)]});}}requestAnimationFrame(frame);}));await mkdir('docs/evidencia',{recursive:true});await writeFile(`docs/evidencia/rendimiento-${capturePhase?'fase-'+capturePhase:'actual'}.json`,JSON.stringify(perf,null,2));expect(perf.fps).toBeGreaterThan(50);
});

test('un corte al cargar el dibujo no desmonta la mesa',async({page})=>{
 await page.route('**/src/scene/SceneView.tsx',route=>route.abort('failed'));
 const failed=page.waitForEvent('requestfailed',request=>request.url().endsWith('/src/scene/SceneView.tsx'));
 await page.goto('/?local=1');
 await failed;
 await expect(page.getByTestId('menu-scene')).toBeVisible();
 await expect(page.locator('[data-card]').first()).toBeVisible();
});

test('el fondo queda visible mientras carga el atlas de la mesa',async({page})=>{
 let release!:()=>void;
 const loading=new Promise<void>(resolve=>{release=resolve;});
 await page.route(/\/assets\/art\/washington@\dx\.json$/,async route=>{await loading;await route.continue();});
 try{
  await page.goto('/?local=1',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid=scene]')).toHaveAttribute('data-drawn','false');
  await expect(page.getByTestId('menu-scene')).toBeVisible();
 }finally{release();}
 await expect(page.locator('canvas')).toBeVisible();
 await expect(page.getByTestId('menu-scene')).toHaveCount(0);
});

test('la animación respeta los asientos, conserva la baza y vuelve a reposo al interrumpirse',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?local=1');
 await expect(page.locator('canvas')).toBeVisible();
 const result=await page.evaluate(async()=>{
  const modulePath='/src/scene/Scene.ts';
  const {Scene}=await import(modulePath) as typeof import('../apps/client/src/scene/Scene');
  const host=document.createElement('div');
  host.style.cssText='position:absolute;left:-400px;width:390px;height:844px';
  document.documentElement.appendChild(host);
  const scene=new Scene();
  try{
   await scene.init(host);
   const base=window.bolicheDebug!.view()!;
   const plays=[{seat:0,card:'7O'},{seat:1,card:'1E'}] as const;
   scene.update({...base,seat:0,seq:1,played:[plays[0]],trick:[plays[0]]},2,false,false,false);
   scene.update({...base,seat:0,seq:2,played:[...plays],trick:[]},2,false,false,false);
   scene.timeline!.pause(0);
   const card=scene.cards.children.find(child=>child.label==='played:1E')!;
   const fromRival=Math.abs(card.y-scene.seatOrigin(1).y)<1;
   scene.timeline!.progress(.2);
   scene.clearAnimation();
   const settledAt=card.y;
   const trickCards=scene.cards.children.filter(child=>child.label?.startsWith('played:')).length;
   scene.renderCards();
   const settled=Math.abs(settledAt-scene.cards.children.find(child=>child.label==='played:1E')!.y)<1;
   scene.update(null,4,false,false,false);
   scene.animate('deal');
   const dealt=scene.transients.size;
   scene.timeline!.progress(.2);
   scene.update(null,4,false,true,false);
   const cleaned=scene.transients.size===0&&scene.cards.children.find(child=>child.label==='sample')!.visible;
   return {fromRival,settled,trickCards,dealt,cleaned};
  }finally{scene.destroy();host.remove();}
 });
 expect(result).toEqual({fromRival:true,settled:true,trickCards:2,dealt:12,cleaned:true});
});
