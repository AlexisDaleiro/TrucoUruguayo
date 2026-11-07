import {test,expect} from 'vitest';
import worker from './index';
test('Worker responds without accounts', async()=>{
 const response=await worker.fetch(new Request('http://localhost/api/health'),{ASSETS:{} as Fetcher});
 expect(await response.json()).toEqual({ok:true,name:'Truco de Boliche',storage:'local'});
});
