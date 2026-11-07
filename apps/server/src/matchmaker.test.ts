import {expect,test,vi} from 'vitest';
import {Matchmaker} from './Matchmaker';
import {contextFor,MemoryStorage} from '../../../tests/support/storage';
import {internal,type Env,type Profile} from './types';

test('recupera el mismo código tras perder la respuesta del reparto y une tickets duplicados',async()=>{
 vi.useFakeTimers();
 try{
  const storage=new MemoryStorage();
  const env={} as Env;
  const calls:{code:string;initRef:string;members:Profile[]}[]=[];
  env.MATCH_ROOM={
   idFromName:(name:string)=>name,
   get:()=>({fetch:async(request:Request)=>{
    const plan=await request.json() as typeof calls[number];calls.push(plan);
    expect(await storage.get('queue')).toMatchObject({plan:{code:plan.code,ref:plan.initRef}});
    if(calls.length===1)throw Error('Respuesta perdida después del reparto');
    return Response.json({code:plan.code});
   }})
  } as unknown as DurableObjectNamespace;
  const start=async()=>{const {context,ready}=contextFor(storage);const queue=new Matchmaker(context,env);await Promise.all(ready);return queue;};
  let queue=await start();
  const post=async(ticket:string,id:string,op='join')=>queue.fetch(internal({op,ticket,profile:{id,wallet:10,mmr:1000},seats:2}));
  expect(await(await post('first','A')).json()).toMatchObject({queued:true});
  expect(await(await post('duplicate','A')).json()).toMatchObject({queued:true});
  expect(calls).toHaveLength(0);
  expect(await(await post('second','B')).json()).toMatchObject({queued:true});
  expect(calls[0].members.map(member=>member.id)).toEqual(['A','B']);
  queue=await start();vi.setSystemTime(Date.now()+1600);await queue.alarm();
  expect(calls).toHaveLength(2);expect(calls[1]).toEqual(calls[0]);
  for(const [ticket,id]of [['first','A'],['duplicate','A'],['second','B']])expect(await(await post(ticket,id,'poll')).json()).toEqual({code:calls[0].code});
  expect((await post('first','B','poll')).status).toBe(403);
 }finally{vi.useRealTimers();}
});
