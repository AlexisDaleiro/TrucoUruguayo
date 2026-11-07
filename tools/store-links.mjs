import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const base=process.argv[2]??'https://truco-de-boliche.alexisdaleiro.workers.dev';
const browser=await chromium.launch({headless:true});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 for(const [route,heading] of [['/privacidad','Privacidad'],['/borrar-cuenta','Borrar mi cuenta'],['/terminos','Términos'],['/soporte','Soporte']]){
  const response=await page.goto(base+route);
  if(response?.status()!==200)throw Error('URL no disponible: '+route);
  await page.getByRole('heading',{name:heading,level:1,exact:true}).waitFor();
  if(route==='/borrar-cuenta')await page.getByRole('button',{name:'Borrar mi cuenta',exact:true}).waitFor();
  results.push({route,status:response.status(),heading});
 }
 await writeFile('docs/evidencia/urls-play-fase-8.json',JSON.stringify({origin:base,results},null,2)+'\n');
 console.log('Cuatro páginas públicas verificadas');
}finally{await browser.close();}
