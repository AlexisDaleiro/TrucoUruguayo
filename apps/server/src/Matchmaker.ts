import {DurableObject} from 'cloudflare:workers';
import {roomCode} from '../../../packages/protocol/src/index';
import {economy} from '../../../packages/shared/src/economy';
import {type Env,type Profile,stub,internal} from './types';

interface Ticket {id:string;profile:Profile;at:number;aliases?:string[];}
interface Plan {ref:string;code:string;candidates:Ticket[];retryAt:number;}
interface Expiry {profileId:string;expires:number;}
interface QueueData {
 queue:Ticket[];
 seats:2|4;
 assignments:Record<string,Expiry&{code:string}>;
 cancelled?:Record<string,Expiry>;
 failures?:Record<string,Expiry&{error:string}>;
 plan?:Plan;
}
interface QueueRequest {op:'join'|'poll'|'cancel';ticket:string;profile:Profile;seats:2|4;entry?:number;}
const fillDelay=12000, retention=1800000;
const tickets=(item:Ticket)=>[item.id,...(item.aliases??[])];
const error=(code:string,status:number)=>Response.json({error:code},{status});

export class Matchmaker extends DurableObject<Env>{
 data:QueueData={queue:[],assignments:{},seats:2};
 locked:Promise<unknown>=Promise.resolve();

 constructor(ctx:DurableObjectState,env:Env){
  super(ctx,env);
  ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get<QueueData>('queue')??this.data;});
 }
 serial<T>(fn:()=>Promise<T>):Promise<T>{
  const next=this.locked.then(fn);this.locked=next.catch(()=>{});return next;
 }
 lookup(ticket:string,profileId:string){
  const d=this.data;
  const record:(Expiry&{code?:string;error?:string})|undefined=d.assignments[ticket]??d.failures?.[ticket]??d.cancelled?.[ticket];
  if(!record)return null;
  if(record.profileId!==profileId)return error('FORBIDDEN',403);
  if(record.code)return Response.json({code:record.code});
  if(record.error)return error(record.error,409);
  return Response.json({queued:false,cancelled:true});
 }
 fetch(request:Request){return this.serial(async()=>{
  const body=await request.json() as QueueRequest;
  const d=this.data;d.seats=body.seats;this.expire();
  const prior=this.lookup(body.ticket,body.profile.id);if(prior)return prior;
  const active=[...d.queue,...(d.plan?.candidates??[])];
  const existing=active.find(item=>tickets(item).includes(body.ticket));
  if(existing&&existing.profile.id!==body.profile.id)return error('FORBIDDEN',403);
  let item=existing;
  if(body.op==='join'&&!existing){
   item=active.find(ticket=>ticket.profile.id===body.profile.id);
   if(item){
    if((item.aliases?.length??0)>=8)return error('RATE_LIMIT',429);
    (item.aliases??=[]).push(body.ticket);
   }else{
    if(body.profile.wallet<(body.entry??economy.entry)&&(body.profile.passUntil??0)<=Date.now())return error('BALANCE',409);
    item={id:body.ticket,profile:body.profile,at:Date.now()};d.queue.push(item);
   }
  }
  if(body.op==='cancel'&&!d.plan?.candidates.includes(item!)){
   if(item)d.queue=d.queue.filter(ticket=>ticket!==item);
   d.cancelled??={};
   for(const id of item?tickets(item):[body.ticket])d.cancelled[id]={profileId:body.profile.id,expires:Date.now()+retention};
  }
  await this.match();await this.persist();
  return this.lookup(body.ticket,body.profile.id)??Response.json({queued:Boolean(item),since:item?.at});
 });}
 expire(){
  const now=Date.now();
  for(const map of [this.data.assignments,this.data.cancelled??{},this.data.failures??{}]){
   for(const [key,item]of Object.entries(map))if(item.expires<=now)delete map[key];
  }
 }
 async match(){
  const d=this.data;
  for(let attempts=0;attempts<10;attempts++){
   const now=Date.now();
   if(!d.plan){
    for(const anchor of d.queue){
     const age=now-anchor.at,range=100+Math.floor(age/3000)*50;
     const candidates=d.queue.filter(item=>Math.abs(item.profile.mmr-anchor.profile.mmr)<=range).slice(0,d.seats);
     if(candidates.length<d.seats&&age<fillDelay)continue;
     d.plan={ref:crypto.randomUUID(),code:roomCode(),candidates,retryAt:now};
     d.queue=d.queue.filter(item=>!candidates.includes(item));
     break;
    }
   }
   const plan=d.plan;if(!plan||plan.retryAt>now)return;
   // Save the room code and a retry alarm before the room can debit the entry.
   plan.retryAt=now+1500;await this.persist();
   let response:Response;
   try{
    response=await stub(this.env.MATCH_ROOM,plan.code).fetch(internal({code:plan.code,initRef:plan.ref,seats:d.seats,members:plan.candidates.map(item=>item.profile)},'/init'));
   }catch{return;}
   const outcome=await response.json() as {error?:string};
   if(outcome.error==='EXISTS'){plan.code=roomCode();plan.retryAt=0;continue;}
   if(!response.ok&&!['BALANCE','PROFILE','SERVER_ABORT'].includes(outcome.error??''))return;
   d.failures??={};
   for(const item of plan.candidates)for(const id of tickets(item)){
    const record={profileId:item.profile.id,expires:Date.now()+retention};
    if(response.ok)d.assignments[id]={...record,code:plan.code};
    else d.failures[id]={...record,error:outcome.error==='BALANCE'?'BALANCE':'SERVER'};
   }
   d.plan=undefined;await this.persist();
  }
 }
 async persist(){
  const now=Date.now(),d=this.data;
  const times=[...(d.plan?[]:d.queue.map(t=>Math.max(now+100,t.at+fillDelay))),...Object.values(d.assignments).map(t=>t.expires),...Object.values(d.cancelled??{}).map(t=>t.expires),...Object.values(d.failures??{}).map(t=>t.expires)];
  if(d.plan)times.push(Math.max(now+100,d.plan.retryAt));
  if(times.length)await this.ctx.storage.setAlarm(Math.min(...times));else await this.ctx.storage.deleteAlarm();
  await this.ctx.storage.put('queue',d);
 }
 alarm(){return this.serial(async()=>{this.expire();await this.match();await this.persist();});}
}
