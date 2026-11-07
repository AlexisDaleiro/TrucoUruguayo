import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('base responsive y servidor local',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const folder=`docs/capturas/fase-${process.env.CAPTURE_PHASE??'2'}/splash`;
 await mkdir(folder,{recursive:true});
 for(const [width,height] of [[360,640],[390,844],[412,915],[844,390],[768,1024],[1024,768],[1280,720],[1366,768],[1920,1080],[2560,1440],[3440,1440]]){
  await page.setViewportSize({width,height});await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Truco');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${folder}/${width}x${height}.png`});
 }
 expect((await request.get('/api/health')).ok()).toBe(true);expect(errors).toEqual([]);
});
