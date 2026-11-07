import {regeneration,economy,weekKey,matchXp,eloDelta,entryDelta} from '../../../packages/shared/src/economy';
import {equip} from '../../../packages/shared/src/catalog';
import type {Profile,PlayerSettings,MatchResult} from './types';
export const defaultSettings:PlayerSettings={fast:false,reduced:false,haptics:true,quality:'auto',telemetry:false};
export interface WalletEntry{profileId:string;delta:number;reason:string;ref:string;createdAt:number;}
export interface WeekRow{profileId:string;nickname:string;points:number;wins:number;losses:number;week:string;}
export function normalize(profile:Profile):Profile{return {...profile,inventory:profile.inventory??[],settings:{...defaultSettings,...profile.settings},age13Confirmed:profile.age13Confirmed??false,tutorialDone:profile.tutorialDone??false,wins:profile.wins??0,losses:profile.losses??0};}
export async function readProfile(storage:DurableObjectStorage|DurableObjectTransaction,id:string,now=Date.now()):Promise<Profile|null>{if(await storage.get('deleted:'+id))return null;const saved=await storage.get<Profile>('profile:'+id);if(!saved)return null;const profile=normalize(saved),regen=regeneration(profile,now);if(regen.delta){const ref=`regen:${regen.regenAt}`;profile.wallet+=regen.delta;await storage.put('wallet:'+id+':'+ref,{profileId:id,delta:regen.delta,reason:'regeneration',ref,createdAt:now} satisfies WalletEntry);}profile.regenAt=regen.regenAt;await storage.put('profile:'+id,profile);return profile;}
export async function appendEntry(storage:DurableObjectTransaction,profile:Profile,delta:number,reason:string,ref:string,now=Date.now()){const key=`wallet:${profile.id}:${ref}`;if(await storage.get(key))return false;if(!Number.isSafeInteger(delta)||profile.wallet+delta<0)throw Error('BALANCE');profile.wallet+=delta;await storage.put(key,{profileId:profile.id,delta,reason,ref,createdAt:now} satisfies WalletEntry);await storage.put('profile:'+profile.id,profile);return true;}
export async function reserveEntries(storage:DurableObjectStorage,ids:readonly string[],ref:string,now=Date.now()){
 return storage.transaction(async tx=>{const rows:Profile[]=[];for(const id of [...new Set(ids)].sort()){const profile=await readProfile(tx,id,now);if(!profile)throw Error('PROFILE');if(!await tx.get(`wallet:${id}:${ref}`)&&profile.wallet+entryDelta(profile,now)<0)throw Error('BALANCE');rows.push(profile);}for(const profile of rows)await appendEntry(tx,profile,entryDelta(profile,now),'entry',ref,now);return {ok:true};});
}
export async function refundEntries(storage:DurableObjectStorage,ids:readonly string[],ref:string,now=Date.now()){
 return storage.transaction(async tx=>{for(const id of [...new Set(ids)].sort()){const original=await tx.get<WalletEntry>(`wallet:${id}:${ref}`),profile=await readProfile(tx,id,now);if(!original||original.reason!=='entry'||!profile)continue;await appendEntry(tx,profile,-original.delta,'server_refund',`refund:${ref}`,now);}return {ok:true};});
}
export async function recordResult(storage:DurableObjectStorage,result:MatchResult){return storage.transaction(async tx=>{
 const existing=await tx.get('result:'+result.ref);if(existing)return {ok:true,duplicate:true};
 for(const member of result.members.filter(m=>!m.originalBot)){
  const profile=await readProfile(tx,member.id,result.at);if(!profile)continue;const won=!member.abandoned&&member.seat%2===result.winner,bonus=result.bonuses[member.id]??{flor:0,truco:0};profile.xp+=matchXp(won,won?bonus.flor:0,won?bonus.truco:0);profile.wins=(profile.wins??0)+(won?1:0);profile.losses=(profile.losses??0)+(won?0:1);
  if(!result.hasBots){const rivals=result.members.filter(m=>m.seat%2!==member.seat%2);const opponent=rivals.reduce((sum,m)=>sum+m.mmr,0)/Math.max(1,rivals.length);const delta=eloDelta(member.mmr,opponent,won);profile.mmr=Math.max(0,profile.mmr+delta);const week=weekKey(result.at),key=`week:${week}:${member.id}`,row=await tx.get<WeekRow>(key)??{profileId:member.id,nickname:profile.nickname,points:0,wins:0,losses:0,week};row.nickname=profile.nickname;row.points+=won?3:0;row.wins+=won?1:0;row.losses+=won?0:1;await tx.put(key,row);}
  await tx.put('profile:'+profile.id,profile);
 }
 await tx.put('result:'+result.ref,result);return {ok:true,duplicate:false};
});}
export function equippedProfile(profile:Profile,itemId:string,variant?:string){const loadout=equip(profile.loadout,itemId,profile.xp,profile.inventory??[],variant);return {...profile,loadout,character:loadout.character==='char_marta'?'marta' as const:'washington' as const};}
export {economy};
