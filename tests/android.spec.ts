import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {capturePhase,captureRoot,captureSizes} from './captures';

test('Android usa una sesión aislada y los callbacks requieren autenticación',async({request})=>{
 const origin='https://localhost';
 const headers={Origin:origin};
 const preflight=await request.fetch('/api/auth/guest',{method:'OPTIONS',headers:{...headers,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-boliche-session'}});
 expect(preflight.status()).toBe(204);expect(preflight.headers()['access-control-allow-origin']).toBe(origin);
 const native=await request.post('/api/auth/guest',{headers,data:{nickname:'QA Android',age13Confirmed:true}});
 expect(native.ok()).toBe(true);expect(native.headers()['set-cookie']).toBeUndefined();
 const {sessionToken}=await native.json();expect(typeof sessionToken).toBe('string');
 const tokenHeaders={...headers,'X-Boliche-Session':sessionToken};
 const profile=await(await request.get('/api/auth/session',{headers:tokenHeaders})).json();
 expect(profile.profile.wallet).toBe(10);
 expect((await(await request.get('/api/auth/session',{headers:{'X-Boliche-Session':sessionToken}})).json()).profile).toBeNull();
 expect(await(await request.get('/api/mobile/config',{headers})).json()).toMatchObject({testAds:true,revenueCatKey:null});
 expect((await request.post('/api/mobile/ad-intent',{headers:tokenHeaders,data:{}})).status()).toBe(503);
 expect((await request.post('/api/hooks/revenuecat',{headers:{Authorization:'Bearer falso'},data:{event:{}}})).status()).toBe(401);
 expect((await request.get('/api/hooks/admob')).status()).toBe(503);
 expect((await request.post('/api/account/delete',{headers:tokenHeaders,data:{confirm:true}})).ok()).toBe(true);
 expect((await(await request.get('/api/auth/session',{headers:tokenHeaders})).json()).profile).toBeNull();
});
test('vista de Android en toda la matriz, con compras desactivadas en la vista previa',async({page})=>{
 await mkdir(captureRoot,{recursive:true});await page.goto('/dev/android');
 await expect(page.getByRole('heading',{name:'Vista previa de Android'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Ver anuncio de prueba'})).toBeDisabled();
 expect(await page.getByRole('button',{name:'Comprar',exact:true}).count()).toBe(4);
 if(capturePhase)for(const [width,height]of captureSizes){
  await page.setViewportSize({width,height});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${captureRoot}/android-tienda-${width}x${height}.png`,fullPage:true});
 }
});
