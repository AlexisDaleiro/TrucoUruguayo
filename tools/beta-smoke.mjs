/* global performance */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const origin=process.argv[2]??'http://127.0.0.1:8787';
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(let run=1;run<=3;run++){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular4g'});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const start=performance.now();
  await page.goto(origin,{waitUntil:'commit'});
  await page.getByRole('button',{name:/Tocá para entrar/}).click();
  await page.getByRole('heading',{name:'Antes de sentarte'}).waitFor();
  const interactiveMs=Math.round(performance.now()-start);
  await page.getByTestId('menu-scene').waitFor();
  results.push({run,interactiveMs,errors});
  await context.close();
 }
 const report={origin,method:'Chromium CDP, caché fría, 150 ms RTT, 1.6 Mbps de descarga y CPU 4×. Tiempo hasta abrir el alta mediante el botón real.',results};
 console.log(JSON.stringify(report,null,2));
 await mkdir('docs/evidencia',{recursive:true});await writeFile('docs/evidencia/4g-fase-6.json',JSON.stringify(report,null,2)+'\n');
 if(results.some(result=>result.interactiveMs>=4000||result.errors.length))process.exitCode=1;
}finally{await browser.close();}
