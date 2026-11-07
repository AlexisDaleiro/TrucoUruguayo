import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {capturePhase,captureRoot,captureSizes} from './captures';
const production='http://127.0.0.1:8787';
test('la PWA de producción instala recursos y deja practicar en frío sin red',async({browser})=>{
 test.setTimeout(90000);await mkdir(captureRoot,{recursive:true});
 const context=await browser.newContext({baseURL:production,viewport:{width:390,height:844},deviceScaleFactor:2});
 try{
  const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  const manifest=await (await context.request.get('/manifest.webmanifest')).json();expect(manifest.display).toBe('standalone');expect(manifest.icons.map((icon:{sizes:string})=>icon.sizes)).toContain('512x512');
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),{},{timeout:30000});
  const cacheUrls=await page.evaluate(async()=>{const names=await caches.keys();return (await Promise.all(names.map(async name=>(await (await caches.open(name)).keys()).map(request=>request.url)))).flat();});
  expect(cacheUrls.some(url=>url.includes('/api/'))).toBe(false);expect(cacheUrls.includes(production+'/')).toBe(true);
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:/Tocá para entrar/}).click();
  await page.getByLabel(/Confirmá que tenés 13 años/).check();await page.getByRole('button',{name:'Ir a la práctica'}).click();
  await expect(page.getByText('Estás sin conexión. Podés practicar gratis.')).toBeVisible();await expect(page.getByTestId('menu-scene')).toBeVisible();
  if(capturePhase){for(const [width,height]of captureSizes){await page.setViewportSize({width,height});await page.screenshot({path:`${captureRoot}/offline-${width}x${height}.png`});}await page.setViewportSize({width:390,height:844});}
  await page.getByRole('button',{name:/^Jugar/}).first().click();
  await expect(page.getByRole('button',{name:/Buscar partida/})).toHaveCount(0);await page.getByRole('button',{name:/^Práctica/}).click();
  const first=page.locator('[data-card]:not(:disabled)').first();for(let turn=0;turn<3&&!await first.isVisible();turn++){const bid=page.getByRole('button',{name:/^(¡Flor!|Quiero|No quiero)$/}).first();if(await bid.isVisible())await bid.click();else break;}await first.click();await expect(page.locator('[data-card]')).toHaveCount(2);
  await page.screenshot({path:`${captureRoot}/mesa-offline.png`});
  await page.goto('/reglamento');await expect(page.getByRole('heading',{name:'Reglamento',level:1})).toBeVisible();
  await context.setOffline(false);await page.goto('/');await expect(page.getByRole('heading',{name:'Antes de sentarte'})).toBeVisible();expect(errors).toEqual([]);
 }finally{await context.close();}
});
test('feedback pide perfil, valida el comentario y limita reenvíos',async({page,request})=>{
 test.setTimeout(90000);await mkdir(captureRoot,{recursive:true});
 expect((await request.post('/api/feedback',{data:{category:'idea',message:'Una idea de ejemplo'}})).status()).toBe(401);
 expect((await request.get('/api/feedback')).status()).toBe(403);
 await page.request.post('/api/auth/guest',{data:{nickname:'Paisana de pruebas',age13Confirmed:true}});
 expect((await page.request.post('/api/feedback',{data:{category:'idea',message:'Muy breve',extra:'x'}})).status()).toBe(400);
 await page.goto('/soporte');await page.getByRole('combobox',{name:'Tema',exact:true}).selectOption('idea');
 await page.getByLabel('Tu comentario',{exact:true}).fill('Me gustaría ver el reglamento desde la mesa.');
 if(capturePhase){for(const [width,height]of captureSizes){await page.setViewportSize({width,height});await page.screenshot({path:`${captureRoot}/feedback-${width}x${height}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.getByRole('button',{name:'Enviar comentario'}).click();await expect(page.getByRole('status')).toHaveText('Gracias. Recibimos tu comentario.');
 expect((await page.request.post('/api/feedback',{data:{category:'idea',message:'Un segundo comentario válido'}})).status()).toBe(429);
});
