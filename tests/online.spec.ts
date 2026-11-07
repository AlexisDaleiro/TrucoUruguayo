import {test,expect,type Browser,type Page,type BrowserContext} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {captureRoot,capturePhase,captureSizes} from './captures';
async function room(browser:Browser,count:2|4,ready=true){
 await mkdir(captureRoot,{recursive:true});const contexts:BrowserContext[]=[],pages:Page[]=[];for(let i=0;i<count;i++){const context=await browser.newContext({baseURL:'http://127.0.0.1:5173',viewport:{width:390,height:844}});contexts.push(context);const response=await context.request.post('/api/auth/guest',{data:{age13Confirmed:true,nickname:'Paisano '+i}});expect(response.ok(),await response.text()).toBe(true);pages.push(await context.newPage());}
 const response=await contexts[0].request.post('/api/rooms',{data:{seats:count,targetScore:30,florEnabled:false}});expect(response.ok(),await response.text()).toBe(true);const {code}=await response.json() as {code:string};
 for(const page of pages){await page.goto('/sala/'+code);await expect(page.getByText(code,{exact:true})).toBeVisible();}
 if(ready){for(const page of pages)await page.getByRole('button',{name:/^Listo/}).click();
 for(const page of pages)await expect(page.locator('[data-card]').first()).toBeVisible();}return {contexts,pages,code};
}
test('dos invitados se sientan, reciben manos propias y reconectan',async({browser})=>{
 test.setTimeout(90000);const {contexts,pages,code}=await room(browser,2);try{
  const a=await pages[0].evaluate(()=>window.bolicheDebug!.view()!),b=await pages[1].evaluate(()=>window.bolicheDebug!.view()!);expect(a.seat).not.toBe(b.seat);expect(a.hands[1].every(c=>c===null)).toBe(true);expect(b.hands[0].every(c=>c===null)).toBe(true);
  const response=await contexts[0].request.get('/api/auth/session');expect((await response.json()).profile.wallet).toBe(9);
  const before=a.seq;await pages[0].evaluate(()=>window.bolicheNetwork!.cut());await expect(pages[0].getByRole('alert')).toBeVisible();await expect(pages[0].getByRole('alert')).toBeHidden({timeout:15000});expect((await pages[0].evaluate(()=>window.bolicheDebug!.view()!)).seq).toBe(before);
  await mkdir(captureRoot,{recursive:true});await pages[0].screenshot({path:`${captureRoot}/mesa-1v1.png`});expect(code).toHaveLength(6);
 }finally{for(const context of contexts)await context.close();}
});
for(const count of [2,4] as const)test(`${count} contextos completan una partida online a 30`,async({browser})=>{
 test.setTimeout(240000);const {contexts,pages}=await room(browser,count);try{
  if(count===4){
   await pages[0].evaluate(()=>window.bolicheNetwork!.raw({type:'SENA',gesture:'beso'}));
   await expect.poll(()=>pages[2].evaluate(()=>window.bolicheNetwork!.events().sena?.gesture)).toBe('beso');
   for(const i of [1,3])await expect.poll(()=>pages[i].evaluate(()=>window.bolicheNetwork!.events().sena?.gesture)).toBe('tic');
   await pages[0].evaluate(()=>window.bolicheNetwork!.raw({type:'CHAT',phrase:0}));for(const page of pages)await expect.poll(()=>page.evaluate(()=>window.bolicheNetwork!.events().chat?.phrase)).toBe(0);
   await mkdir(captureRoot,{recursive:true});await pages[0].screenshot({path:`${captureRoot}/mesa-2v2.png`});
  }
  if(capturePhase){for(const [width,height]of captureSizes){await pages[0].setViewportSize({width,height});await pages[0].screenshot({path:`${captureRoot}/online-${count}-${width}x${height}.png`});}await pages[0].setViewportSize({width:390,height:844});}
  let steps=0;while((await pages[0].evaluate(()=>window.bolicheDebug!.view()!)).winner===null){
   if(++steps>1500)throw new Error('La partida no termina');let moved=false;
   for(const page of pages){const view=await page.evaluate(()=>window.bolicheDebug!.view()!);if(view.winner!==null)break;const cards=page.locator('[data-card]:not(:disabled)');if(await cards.count()){if(steps===1)await cards.first().click();else await cards.first().evaluate((element:HTMLButtonElement)=>element.click());moved=true;}else{for(const name of ['Quiero','Flor','Siguiente mano']){const button=page.getByRole('button',{name,exact:name!=='Siguiente mano'});if(await button.count()){await button.first().evaluate((element:HTMLButtonElement)=>element.click());moved=true;break;}}}if(moved){await expect.poll(()=>page.evaluate(()=>window.bolicheDebug!.view()!.seq)).toBeGreaterThan(view.seq);break;}}
   if(!moved)await pages[0].waitForTimeout(30);if(steps%50===0)console.log(`${count} jugadores: ${steps} decisiones`);
  }
  const result=await pages[0].evaluate(()=>window.bolicheDebug!.view()!);expect(Math.max(...result.scores)).toBeGreaterThanOrEqual(30);
  for(const page of pages)await expect.poll(()=>page.evaluate(()=>window.bolicheDebug!.view()!.winner)).toBe(result.winner);
  for(const [seat,context]of contexts.entries()){const profile=(await(await context.request.get('/api/auth/session')).json()).profile;expect(profile.wallet).toBe(9);expect(profile.xp).toBe(seat%2===result.winner?50:20);expect(profile.mmr).toBe(seat%2===result.winner?1016:984);const ledger=await(await context.request.get('/api/ledger')).json();expect(ledger.filter((entry:{reason:string})=>entry.reason==='entry')).toHaveLength(1);const ranking=await(await context.request.get('/api/ranking')).json();expect(ranking.rows.find((row:{profileId:string})=>row.profileId===profile.id)?.points).toBe(seat%2===result.winner?3:0);}
  await pages[0].screenshot({path:`${captureRoot}/fin-${count}-contextos.png`});
 }finally{for(const context of contexts)await context.close();}
});
test('servidor rechaza cartas ajenas e idempotencia evita duplicar una intención',async({browser})=>{
 test.setTimeout(90000);const {contexts,pages,code}=await room(browser,2);try{
  const own=await pages[0].evaluate(()=>window.bolicheDebug!.view()!),rival=await pages[1].evaluate(()=>window.bolicheDebug!.view()!);
  await pages[0].evaluate(packet=>window.bolicheNetwork!.raw(packet),{type:'ACTION',id:crypto.randomUUID(),seq:own.seq,action:{type:'PLAY_CARD',cardId:rival.hands[rival.seat][0]}});
  await expect.poll(()=>pages[0].evaluate(()=>window.bolicheNetwork!.events().error)).toBe('ILLEGAL_ACTION');expect((await pages[0].evaluate(()=>window.bolicheDebug!.view()!)).seq).toBe(own.seq);await pages[0].getByRole('button',{name:'Cerrar',exact:true}).first().click();
  const packet={type:'ACTION',id:crypto.randomUUID(),seq:own.seq,action:own.legal.find(a=>a.type==='PLAY_CARD')!};await pages[0].evaluate(p=>{window.bolicheNetwork!.raw(p);window.bolicheNetwork!.raw(p);},packet);await expect.poll(()=>pages[0].evaluate(()=>window.bolicheDebug!.view()!.seq)).toBe(own.seq+1);await pages[0].waitForTimeout(200);expect((await pages[0].evaluate(()=>window.bolicheDebug!.view()!)).seq).toBe(own.seq+1);
  const outsider=await browser.newContext({baseURL:'http://127.0.0.1:5173'});try{await outsider.request.post('/api/auth/guest',{data:{age13Confirmed:true,nickname:'El ajeno'}});const response=await outsider.request.get('/api/rooms/'+code+'/snapshot',{headers:{'x-profile-id':(await contexts[0].request.get('/api/auth/session').then(r=>r.json())).profile.id}});expect(response.status()).toBe(403);}finally{await outsider.close();}
  expect((await contexts[0].request.get('/api/auth/session').then(r=>r.json())).profile.wallet).toBe(9);
 }finally{for(const context of contexts)await context.close();}
});
test('matchmaking completa con un rival al cumplirse doce segundos',async({browser})=>{
 test.setTimeout(60000);const context=await browser.newContext({baseURL:'http://127.0.0.1:5173'});try{const page=await context.newPage();await page.goto('/');await page.getByRole('button',{name:/Tocá para entrar/}).click();await page.getByLabel('Tu apodo',{exact:true}).fill('Rival de búsqueda');await page.getByLabel('Confirmo que tengo 13 años o más.').check();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Saltear',exact:true}).click();await page.getByRole('button',{name:/^Jugar/}).first().click();await page.getByRole('button',{name:/^Buscar partida/}).click();await expect(page.getByRole('dialog',{name:'Buscando una mesa…'})).toBeVisible();await page.screenshot({path:`${captureRoot}/busqueda.png`});await page.reload();await expect(page.getByRole('dialog',{name:'Buscando una mesa…'})).toBeVisible();await expect(page.locator('[data-card]').first()).toBeVisible({timeout:25000});expect((await context.request.get('/api/auth/session').then(r=>r.json())).profile.wallet).toBe(9);await page.screenshot({path:`${captureRoot}/matchmaking.png`});}finally{await context.close();}
});
test('gracia real de 45 segundos y recuperación del asiento',async({browser})=>{
 test.setTimeout(100000);const {contexts,pages,code}=await room(browser,2);try{
  await pages[1].evaluate(()=>window.bolicheNetwork!.cut());await expect(pages[1].getByRole('alert')).toBeVisible();await contexts[1].setOffline(true);
  await pages[0].waitForTimeout(40000);let snapshot=await contexts[0].request.get('/api/rooms/'+code+'/snapshot').then(r=>r.json());expect(snapshot.members[1].connected).toBe(false);
  await expect.poll(async()=>{snapshot=await contexts[0].request.get('/api/rooms/'+code+'/snapshot').then(r=>r.json());return snapshot.members[1].connected;},{timeout:15000,intervals:[500]}).toBe(true);
  await contexts[1].setOffline(false);await expect(pages[1].getByRole('alert')).toBeHidden({timeout:15000});expect((await pages[1].evaluate(()=>window.bolicheDebug!.view()!)).seat).toBe(1);await pages[1].screenshot({path:`${captureRoot}/reconexion.png`});
 }finally{for(const context of contexts)await context.close();}
});
test('anfitrión elige equipos y el lobby cabe en toda la matriz',async({browser})=>{
 const {contexts,pages,code}=await room(browser,4,false);try{
  await pages[0].getByRole('combobox',{name:'Asiento 1',exact:true}).selectOption('1');await expect.poll(async()=>(await contexts[0].request.get('/api/rooms/'+code+'/snapshot').then(r=>r.json())).seat).toBe(1);
  const forbidden=await contexts[2].request.post('/api/rooms/'+code+'/seat',{data:{from:0,to:2}});expect(forbidden.status()).toBe(403);
  for(const [width,height]of captureSizes){await pages[0].setViewportSize({width,height});const dialog=pages[0].getByRole('dialog',{name:'Mesa con amigos'});expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await pages[0].screenshot({path:`${captureRoot}/lobby-${width}x${height}.png`});}
 }finally{for(const context of contexts)await context.close();}
});
test('cancelar antes de un reintento no deja una entrada pendiente',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:5173'});try{await context.request.post('/api/auth/guest',{data:{age13Confirmed:true,nickname:'La Flaca'}});const ticket=crypto.randomUUID();await context.request.post('/api/queue',{data:{op:'cancel',ticket,seats:2}});const result=await context.request.post('/api/queue',{data:{op:'join',ticket,seats:2}}).then(r=>r.json());expect(result.cancelled).toBe(true);expect((await context.request.get('/api/auth/session').then(r=>r.json())).profile.wallet).toBe(10);}finally{await context.close();}
});
