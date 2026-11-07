import {DurableObject} from 'cloudflare:workers';
import {type Env,type Profile,internal,stub} from './types';
import {nicknameSchema} from '../../../packages/protocol/src/index';
interface Entry {profileId:string;delta:number;reason:string;ref:string;createdAt:number;}
export class Accounts extends DurableObject<Env>{
 locked:Promise<unknown>=Promise.resolve();
 fetch(request:Request):Promise<Response>{const next=this.locked.then(()=>this.handle(request));this.locked=next.catch(()=>{});return next;}
 async handle(request:Request):Promise<Response>{
  const body=await request.json() as {op:string;token?:string;id?:string;nickname?:string;character?:'washington'|'marta';ids?:string[];ref?:string;uid?:string;delta?:number;reason?:string};
  if(body.op==='session'){
   const id=body.token?await this.ctx.storage.get<string>('session:'+body.token):undefined;const profile=id?await this.ctx.storage.get<Profile>('profile:'+id):undefined;return Response.json(profile??null);
  }
  if(body.op==='create'){
   if(body.uid){const linked=await this.ctx.storage.get<string>('uid:'+body.uid);if(linked){const profile=await this.ctx.storage.get<Profile>('profile:'+linked);const token=crypto.randomUUID()+crypto.randomUUID();await this.ctx.storage.put('session:'+token,linked);return Response.json({profile,token});}}
   const nickname=nicknameSchema.safeParse(body.nickname);if(!nickname.success)return Response.json({error:'NICKNAME'},{status:400});
   const profile:Profile={id:crypto.randomUUID(),nickname:nickname.data,character:body.character==='marta'?'marta':'washington',wallet:10,xp:0,mmr:1000,createdAt:Date.now(),regenAt:Date.now(),loadout:{character:'char_don_washington',environment:'env_galpon',cardSkin:'cards_clasica'}};
   const token=crypto.randomUUID()+crypto.randomUUID();await this.ctx.storage.put('profile:'+profile.id,profile);
   await this.ctx.storage.put('session:'+token,profile.id);if(body.uid){await this.ctx.storage.put('uid:'+body.uid,profile.id);await this.ctx.storage.put('linked:'+profile.id,body.uid);}await this.ctx.storage.put('wallet:'+profile.id+':welcome',{profileId:profile.id,delta:10,reason:'welcome',ref:'welcome',createdAt:Date.now()} satisfies Entry);return Response.json({profile,token});
  }
  if(body.op==='profile')return Response.json(await this.ctx.storage.get<Profile>('profile:'+body.id)??null);
  if(body.op==='reserve'){
   const ids=[...new Set(body.ids??[])];const ref=body.ref!;
   const result=await this.ctx.storage.transaction(async txn=>{
    const profiles:Profile[]=[];for(const id of ids){const p=await txn.get<Profile>('profile:'+id);if(!p)return 'PROFILE';const prior=await txn.get('wallet:'+id+':'+ref);if(!prior&&p.wallet<1)return 'BALANCE';profiles.push(p);}
    for(const profile of profiles){const key='wallet:'+profile.id+':'+ref;if(await txn.get(key))continue;profile.wallet--;await txn.put('profile:'+profile.id,profile);await txn.put(key,{profileId:profile.id,delta:-1,reason:'entry',ref,createdAt:Date.now()} satisfies Entry);}return null;
   });return result?Response.json({error:result},{status:409}):Response.json({ok:true});
  }
  if(body.op==='refund'){
   for(const id of body.ids??[]){const ref=body.ref!,entry=await this.ctx.storage.get<Entry>('wallet:'+id+':'+ref);const key='wallet:'+id+':refund:'+ref;if(!entry||await this.ctx.storage.get(key))continue;const p=await this.ctx.storage.get<Profile>('profile:'+id);if(!p)continue;p.wallet++;await this.ctx.storage.put('profile:'+id,p);await this.ctx.storage.put(key,{profileId:id,delta:1,reason:'server_refund',ref,createdAt:Date.now()} satisfies Entry);}return Response.json({ok:true});
  }
  if(body.op==='link'){
   const existing=await this.ctx.storage.get<string>('uid:'+body.uid);if(existing&&existing!==body.id)return Response.json({error:'ACCOUNT_EXISTS'},{status:409});await this.ctx.storage.put('uid:'+body.uid,body.id!);await this.ctx.storage.put('linked:'+body.id,body.uid!);return Response.json({ok:true});
  }
  if(body.op==='logout'){if(body.token)await this.ctx.storage.delete('session:'+body.token);return Response.json({ok:true});}
  return Response.json({error:'UNKNOWN'},{status:400});
 }
}
export async function accountCall<T>(env:Env,body:unknown):Promise<T>{const response=await stub(env.ACCOUNTS,'accounts-v1').fetch(internal(body));if(!response.ok)throw new Error((await response.json() as {error:string}).error);return response.json() as Promise<T>;}
