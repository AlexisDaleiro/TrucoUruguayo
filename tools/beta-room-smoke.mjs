import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const origin=process.argv[2]??'http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const contexts=[],pages=[],errors=[];
const check=(ok,label)=>{if(!ok)throw Error(label);};
try{
 for(const name of ['QA Oriental','QA Paisana']){
  const context=await browser.newContext({baseURL:origin,viewport:{width:390,height:844}});
  contexts.push(context);
  const guest=await context.request.post('/api/auth/guest',{data:{nickname:name,age13Confirmed:true}});
  check(guest.ok(),'No se pudo iniciar la cuenta temporal');
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  pages.push(page);
 }
 const room=await contexts[0].request.post('/api/rooms',{data:{seats:2,florEnabled:false}});
 check(room.ok(),'No se pudo crear la mesa');
 const {code}=await room.json();
 for(const page of pages){
  await page.goto('/sala/'+code);
  await page.getByText(code,{exact:true}).waitFor();
 }
 for(const page of pages)await page.getByRole('button',{name:/^Listo/}).click();
 for(const page of pages){
  await page.locator('[data-card]').first().waitFor();
  await page.locator('canvas').waitFor();
 }
 const debits=await Promise.all(contexts.map(async context=>{
  const rows=await (await context.request.get('/api/ledger')).json();
  return rows.filter(row=>row.reason==='entry').length;
 }));
 const report={origin,websocket:true,players:2,entryRows:debits,consoleErrors:errors};
 check(debits.every(count=>count===1),'Se esperaba una entrada por cuenta');
 check(errors.length===0,'La mesa produjo errores de navegador');
 await mkdir('docs/evidencia',{recursive:true});
 await writeFile('docs/evidencia/online-publico-fase-6.json',JSON.stringify(report,null,2)+'\n');
 await pages[0].screenshot({path:'docs/capturas/fase-6/produccion-390x844.png'});
 console.log(JSON.stringify(report));
}finally{
 try{
  for(const page of pages)await page.close();
  for(const context of contexts){
   const response=await context.request.post('/api/account/delete',{data:{confirm:true}});
   if(!response.ok()&&response.status()!==401)process.exitCode=1;
   await context.close();
  }
 }finally{await browser.close();}
}
