import {DurableObject} from 'cloudflare:workers';
import {type Env,type Profile,type PlayerSettings,type MatchResult,internal,stub} from './types';
import {nicknameSchema} from '../../../packages/protocol/src/index';
import {weekKey,economy} from '../../../packages/shared/src/economy';
import {readProfile,reserveEntries,refundEntries,recordResult,equippedProfile,normalize,type WeekRow,type WalletEntry} from './meta';
import {remoteMeta} from './RemoteMeta';
async function collectPrefix<T>(storage:DurableObjectStorage,prefix:string){const all=new Map<string,T>();let cursor:string|undefined;for(;;){const page=await storage.list<T>({prefix,limit:500,startAfter:cursor});for(const [key,value]of page)all.set(key,value);if(page.size<500)break;cursor=[...page.keys()].at(-1);}return all;}
interface Command{op:string;token?:string;accessToken?:string;id?:string;nickname?:string;character?:'washington'|'marta';ids?:string[];ref?:string;uid?:string;result?:MatchResult;age13Confirmed?:boolean;tutorialDone?:boolean;settings?:Partial<PlayerSettings>;itemId?:string;variant?:string;code?:string;}
export class Accounts extends DurableObject<Env>{
 locked:Promise<unknown>=Promise.resolve();remote=remoteMeta(this.env);
 fetch(request:Request):Promise<Response>{const next=this.locked.then(()=>this.handle(request)).catch(error=>{const message=error instanceof Error?error.message:'UNKNOWN';const code=['BALANCE','PROFILE','ITEM_LOCKED','ACCOUNT_EXISTS','AUTH','DELETE_RETRY','REMOTE_META'].find(code=>message.includes(code))??'ACCOUNT_ERROR';return Response.json({error:code},{status:code==='AUTH'?401:409});});this.locked=next;return next;}
 async profile(id:string):Promise<Profile|null>{if(await this.ctx.storage.get('deleted:'+id))return null;if(this.remote&&await this.ctx.storage.get('linked:'+id)){const profile=await this.remote.call<Profile|null>({op:'profile',id});if(profile)await this.ctx.storage.put('profile:'+id,profile);return profile;}return this.ctx.storage.transaction(tx=>readProfile(tx,id));}
 async handle(request:Request):Promise<Response>{const body=await request.json() as Command;
  if(body.op==='session'){const id=body.token?await this.ctx.storage.get<string>('session:'+body.token):undefined;return Response.json(id?await this.profile(id):null);}
  if(body.op==='create'){
   if(body.uid&&await this.ctx.storage.get('deletedUID:'+body.uid))throw Error('AUTH');
   const linked=body.uid?await this.ctx.storage.get<string>('uid:'+body.uid):undefined;let profile=linked?await this.profile(linked):null;
   if(!profile){const nickname=nicknameSchema.parse(body.nickname);profile=normalize({id:crypto.randomUUID(),nickname,character:body.character==='marta'?'marta':'washington',wallet:economy.welcome,xp:0,mmr:1000,createdAt:Date.now(),regenAt:Date.now(),age13Confirmed:body.age13Confirmed??false,loadout:{character:body.character==='marta'?'char_marta':'char_don_washington',environment:'env_galpon',cardSkin:'cards_clasica'}});if(this.remote&&body.uid)profile=await this.remote.bootstrap(profile,body.uid);
    await this.ctx.storage.transaction(async tx=>{await tx.put('profile:'+profile!.id,profile!);const key='wallet:'+profile!.id+':welcome';if(!await tx.get(key))await tx.put(key,{profileId:profile!.id,delta:profile!.wallet,reason:'welcome',ref:'welcome',createdAt:Date.now()});});
   }
   const token=crypto.randomUUID()+crypto.randomUUID();await this.ctx.storage.put('session:'+token,profile.id);if(body.uid){await this.ctx.storage.put('uid:'+body.uid,profile.id);await this.ctx.storage.put('linked:'+profile.id,body.uid);}return Response.json({profile,token});
  }
  if(body.op==='profile')return Response.json(body.id?await this.profile(body.id):null);
  if(body.op==='linkedUID')return Response.json(await this.ctx.storage.get<string>('linked:'+body.id)??null);
  if(body.op==='reserve'||body.op==='refund'){if(body.op==='reserve')for(const id of body.ids??[])if(await this.ctx.storage.get('deleted:'+id))throw Error('PROFILE');const result=this.remote?await this.remote.call(body):body.op==='reserve'?await reserveEntries(this.ctx.storage,body.ids??[],body.ref!):await refundEntries(this.ctx.storage,body.ids??[],body.ref!);return Response.json(result);}
  if(body.op==='result')return Response.json(this.remote?await this.remote.call(body):await recordResult(this.ctx.storage,body.result!));
  if(body.op==='ranking'){if(this.remote)return Response.json(await this.remote.call(body));const week=weekKey(Date.now()),rows=await this.ctx.storage.list<WeekRow>({prefix:`week:${week}:`});return Response.json({week,rows:[...rows.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||a.profileId.localeCompare(b.profileId)).slice(0,50)});}
  if(body.op==='ledger'){if(this.remote)return Response.json(await this.remote.call(body));const rows=await this.ctx.storage.list({prefix:`wallet:${body.id}:`});return Response.json([...rows.values()].sort((a,b)=>(b as {createdAt:number}).createdAt-(a as {createdAt:number}).createdAt).slice(0,100));}
  if(body.op==='update'||body.op==='equip'){
   const profile=await this.profile(body.id!);if(!profile)throw Error('PROFILE');let updated=profile;
   if(body.op==='equip')updated=equippedProfile(profile,body.itemId!,body.variant);
   else{if(body.nickname!==undefined)updated.nickname=nicknameSchema.parse(body.nickname);if(body.age13Confirmed===true)updated.age13Confirmed=true;if(body.tutorialDone===true)updated.tutorialDone=true;if(body.settings)updated.settings={fast:false,reduced:false,haptics:false,quality:'auto',telemetry:false,...profile.settings,...body.settings};}
   if(this.remote)updated=await this.remote.call<Profile>({op:'update',profile:updated});await this.ctx.storage.put('profile:'+updated.id,updated);return Response.json(updated);
  }
  if(body.op==='link'){
   if(await this.ctx.storage.get('deletedUID:'+body.uid))throw Error('AUTH');const priorUID=await this.ctx.storage.get<string>('linked:'+body.id);if(priorUID===body.uid)return Response.json({ok:true});if(priorUID)throw Error('ACCOUNT_EXISTS');const existing=await this.ctx.storage.get<string>('uid:'+body.uid);if(existing&&existing!==body.id)throw Error('ACCOUNT_EXISTS');
   const profile=await this.ctx.storage.get<Profile>('profile:'+body.id);if(!profile)throw Error('PROFILE');if(this.remote){const ledger=[...(await collectPrefix<WalletEntry>(this.ctx.storage,`wallet:${profile.id}:`))].map(([key,entry])=>({...entry,ref:key.slice(('wallet:'+profile.id+':').length)}));const results=[...(await collectPrefix<MatchResult>(this.ctx.storage,'result:')).values()].filter(result=>result.members.some(member=>member.id===profile.id));const canonical=await this.remote.bootstrap(normalize(profile),body.uid!,{ledger,results});if(canonical.id!==profile.id)throw Error('ACCOUNT_EXISTS');await this.ctx.storage.put('profile:'+profile.id,canonical);}
   await this.ctx.storage.put('uid:'+body.uid,body.id!);await this.ctx.storage.put('linked:'+body.id,body.uid!);return Response.json({ok:true});
  }
  if(body.op==='registerRoom'){await this.ctx.storage.put(`room:${body.id}:${body.code}`,Date.now());return Response.json({ok:true});}
  if(body.op==='deleting'){const id=body.token?await this.ctx.storage.get<string>('session:'+body.token):undefined;return Response.json(id?Boolean(await this.ctx.storage.get('deleted:'+id)):false);}
  if(body.op==='deleteTarget'){const id=body.token?await this.ctx.storage.get<string>('session:'+body.token):undefined;return Response.json(id??null);}
  if(body.op==='beginDelete'){const id=body.id!,uid=await this.ctx.storage.get<string>('linked:'+id);await this.ctx.storage.put('deleted:'+id,true);if(uid)await this.ctx.storage.put('deletedUID:'+uid,true);const rooms=await collectPrefix<number>(this.ctx.storage,`room:${id}:`);return Response.json({rooms:[...rooms].filter(([,at])=>Date.now()-at<31*86400000).map(([key])=>key.split(':').at(-1)!),uid:uid??null});}
  if(body.op==='delete'){
   const id=body.id!,uid=await this.ctx.storage.get<string>('linked:'+id);if(!await this.ctx.storage.get('deleted:'+id))throw Error('DELETE_RETRY');
   if(this.remote&&uid){if(body.accessToken){const signout=await this.remote.client.auth.admin.signOut(body.accessToken,'global');if(signout.error&&!['session_not_found','user_not_found','bad_jwt'].includes(signout.error.code??''))throw Error('DELETE_RETRY');}await this.remote.call({op:'delete',id});const {error}=await this.remote.client.auth.admin.deleteUser(uid);if(error&&error.code!=='user_not_found')throw Error('DELETE_RETRY');}
   const sessions=await collectPrefix<string>(this.ctx.storage,'session:');for(const [key,owner]of sessions)if(owner===id)await this.ctx.storage.delete(key);
   for(const prefix of ['wallet:','room:']){const entries=await collectPrefix(this.ctx.storage,`${prefix}${id}:`);for(const key of entries.keys())await this.ctx.storage.delete(key);}
   const weekly=await collectPrefix<WeekRow>(this.ctx.storage,'week:');for(const [key,row]of weekly)if(row.profileId===id)await this.ctx.storage.delete(key);
   const results=await collectPrefix<MatchResult>(this.ctx.storage,'result:');for(const [key,result]of results)if(result.members.some(member=>member.id===id)){result.members=result.members.map(member=>member.id===id?{...member,id:'deleted'}:member);delete result.bonuses[id];await this.ctx.storage.put(key,result);}
   await this.ctx.storage.delete('profile:'+id);await this.ctx.storage.delete('linked:'+id);if(uid)await this.ctx.storage.delete('uid:'+uid);return Response.json({ok:true});
  }
  if(body.op==='logout'){if(body.token)await this.ctx.storage.delete('session:'+body.token);return Response.json({ok:true});}
  return Response.json({error:'UNKNOWN'},{status:400});
 }
}
export async function accountCall<T>(env:Env,body:unknown):Promise<T>{const response=await stub(env.ACCOUNTS,'accounts-v1').fetch(internal(body));if(!response.ok)throw new Error((await response.json() as {error:string}).error);return response.json() as Promise<T>;}
