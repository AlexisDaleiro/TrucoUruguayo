import {DurableObject} from 'cloudflare:workers';
import {roomCode} from '../../../packages/protocol/src/index';
import {type Env,type Profile,stub,internal} from './types';
interface Ticket {id:string;profile:Profile;at:number;}
interface QueueData {queue:Ticket[];assignments:Record<string,{profileId:string;code:string;expires:number}>;seats:2|4;cancelled?:Record<string,{profileId:string;expires:number}>;}
export class Matchmaker extends DurableObject<Env>{
 data:QueueData={queue:[],assignments:{},seats:2};locked:Promise<unknown>=Promise.resolve();
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get<QueueData>('queue')??this.data;});}
 serial<T>(fn:()=>Promise<T>):Promise<T>{const next=this.locked.then(fn);this.locked=next.catch(()=>{});return next;}
 fetch(request:Request){return this.serial(async()=>{
  const body=await request.json() as {op:'join'|'poll'|'cancel';ticket:string;profile:Profile;seats:2|4};const d=this.data;d.seats=body.seats;
  for(const [key,value]of Object.entries(d.assignments))if(value.expires<Date.now())delete d.assignments[key];
  const assigned=d.assignments[body.ticket];if(assigned){if(assigned.profileId!==body.profile.id)return Response.json({error:'FORBIDDEN'},{status:403});return Response.json({code:assigned.code});}
  d.cancelled??={};for(const [key,item]of Object.entries(d.cancelled))if(item.expires<Date.now())delete d.cancelled[key];
  if(d.cancelled[body.ticket]){if(d.cancelled[body.ticket].profileId!==body.profile.id)return Response.json({error:'FORBIDDEN'},{status:403});return Response.json({queued:false,cancelled:true});}
  const existing=d.queue.find(t=>t.id===body.ticket);if(existing&&existing.profile.id!==body.profile.id)return Response.json({error:'FORBIDDEN'},{status:403});
  if(body.op==='cancel'){d.queue=d.queue.filter(t=>t.id!==body.ticket);d.cancelled[body.ticket]={profileId:body.profile.id,expires:Date.now()+1800000};}
  else if(body.op==='join'&&!existing)d.queue.push({id:body.ticket,profile:body.profile,at:Date.now()});
  await this.match(false);await this.persist();return Response.json(d.assignments[body.ticket]?{code:d.assignments[body.ticket].code}:{queued:body.op!=='cancel',since:existing?.at??Date.now()});
 });}
 async match(fill:boolean){const d=this.data;let searching=true;while(searching){searching=false;for(const anchor of d.queue){const age=Date.now()-anchor.at;const window=100+Math.floor(age/3000)*50;const candidates=d.queue.filter(t=>Math.abs(t.profile.mmr-anchor.profile.mmr)<=window).slice(0,d.seats);if(candidates.length<d.seats&&(!fill||age<12000))continue;const ids=new Set(candidates.map(t=>t.id));d.queue=d.queue.filter(t=>!ids.has(t.id));
   let code='';for(let tries=0;tries<10;tries++){code=roomCode();const response=await stub(this.env.MATCH_ROOM,code).fetch(internal({code,seats:d.seats,members:candidates.map(t=>t.profile)},'/init'));if(response.ok)break;if(response.status!==409)throw new Error('ROOM_FAILED');code='';}
   if(!code)throw new Error('CODE_COLLISION');for(const ticket of candidates)d.assignments[ticket.id]={profileId:ticket.profile.id,code,expires:Date.now()+1800000};searching=true;break;
  }}}
 async persist(){await this.ctx.storage.put('queue',this.data);const times=[...this.data.queue.map(t=>Math.max(Date.now()+100,t.at+12000)),...Object.values(this.data.assignments).map(a=>a.expires),...Object.values(this.data.cancelled??{}).map(a=>a.expires)];if(times.length)await this.ctx.storage.setAlarm(Math.min(...times));else await this.ctx.storage.deleteAlarm();}
 alarm(){return this.serial(async()=>{await this.match(true);for(const [key,item]of Object.entries(this.data.cancelled??{}))if(item.expires<=Date.now())delete this.data.cancelled![key];for(const [key,a]of Object.entries(this.data.assignments))if(a.expires<Date.now())delete this.data.assignments[key];await this.persist();});}
}
