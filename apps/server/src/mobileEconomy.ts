import {adDailyLimit,adIntentTtl,adTokens,localeDay,type CommerceCredit} from '../../../packages/shared/src/mobile';
import {appendEntry,readProfile} from './meta';
import type {RemoteMeta} from './RemoteMeta';
interface Intent {id:string;issued:number;expires:number;used?:string;}
interface Counter {day:string;used:number;}
const receipt=(ref:string)=>'commerce:'+ref;

export async function issueAdIntent(storage:DurableObjectStorage,id:string,now=Date.now()){
 const activeKey='ad-intents:'+id;
 return storage.transaction(async tx=>{
  const active=await tx.get<string[]>(activeKey)??[];
  const kept:string[]=[];let reusable:string|undefined;
  for(const nonce of active){
   const intent=await tx.get<Intent>('ad-nonce:'+nonce);
   if(!intent||intent.expires<=now){await tx.delete('ad-nonce:'+nonce);continue;}
   kept.push(nonce);if(!intent.used&&now-intent.issued<60000)reusable=nonce;
  }
  const count=await tx.get<Counter>('ad-count:'+id);
  if(count?.day===localeDay(now)&&count.used>=adDailyLimit)return {ok:false,error:'AD_LIMIT'};
  if(reusable)return {ok:true,nonce:reusable};
  const nonce=crypto.randomUUID();
  await tx.put('ad-nonce:'+nonce,{id,issued:now,expires:now+adIntentTtl} satisfies Intent);
  await tx.put(activeKey,[...kept,nonce]);
  return {ok:true,nonce};
 });
}
export async function removeAdIntents(storage:DurableObjectStorage,id:string){
 const keys=await storage.get<string[]>('ad-intents:'+id)??[];
 for(const nonce of keys)await storage.delete('ad-nonce:'+nonce);
 await storage.delete('ad-intents:'+id);await storage.delete('ad-count:'+id);await storage.delete('pass-event:'+id);
}
export async function creditLocal(storage:DurableObjectStorage,credit:CommerceCredit,now=Date.now()){
 return storage.transaction(async tx=>{
  if(await tx.get(receipt(credit.ref)))return {ok:true,duplicate:true};
  const profile=await readProfile(tx,credit.id,now);if(!profile||!profile.age13Confirmed)return {ok:true,ignored:true};
  if(credit.kind==='ad'){
   const key='ad-count:'+credit.id,day=localeDay(now),saved=await tx.get<Counter>(key);
   const used=saved?.day===day?saved.used:0;if(used>=adDailyLimit)return {ok:true,limited:true};
   await appendEntry(tx,profile,adTokens,'ad_reward',credit.ref,now);await tx.put(key,{day,used:used+1});
  }else if(credit.kind==='pack'){
   await appendEntry(tx,profile,credit.amount,'play_purchase',credit.ref,now);
  }else{
   const key='pass-event:'+credit.id;
   if((credit.periodEnd===undefined||(profile.passUntil??0)<=credit.periodEnd)&&credit.at>(await tx.get<number>(key)??0)){profile.passUntil=credit.expires;await tx.put(key,credit.at);}
   if(credit.stamp&&!profile.inventory?.includes(credit.stamp))profile.inventory=[...(profile.inventory??[]),credit.stamp];
   await tx.put('profile:'+credit.id,profile);
  }
  await tx.put(receipt(credit.ref),true);
  return {ok:true};
 });
}
export async function creditVerifiedAd(storage:DurableObjectStorage,remote:RemoteMeta|null,nonce:string,ref:string,eventAt:number,now=Date.now()){
 if(await storage.get(receipt(ref)))return {ok:true,duplicate:true};
 const key='ad-nonce:'+nonce,intent=await storage.get<Intent>(key);
 if(!intent||intent.expires<eventAt||intent.issued>eventAt+300000||now-intent.expires>86400000)return {ok:true,ignored:true};
 if(await storage.get('deleted:'+intent.id))return {ok:true,ignored:true};
 if(intent.used)return {ok:true,ignored:intent.used!==ref,duplicate:intent.used===ref};
 const credit:CommerceCredit={kind:'ad',id:intent.id,ref};
 const result=remote?await remote.commerce(credit):await creditLocal(storage,credit,now);
 // The provider receipt is durable before this marker. A lost write can safely replay.
 await storage.put(key,{...intent,used:ref});
 return result;
}
