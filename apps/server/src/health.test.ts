import {test,expect} from 'vitest';
import worker from './index';
import type {Env} from './types';
test('Worker responds without accounts', async()=>{
 const response=await worker.fetch(new Request('http://localhost/api/health'),{ASSETS:{} as Fetcher} as Env);
 expect(await response.json()).toEqual({ok:true,name:'Truco de Boliche',storage:'local'});
});
