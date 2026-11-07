import {z} from 'zod';
import {passProduct,tokenPacks,localeDay,type CommerceCredit} from '../../../packages/shared/src/mobile';
import {feedbackAuthorized} from './Feedback';
import {readJson} from './body';
import {accountCall} from './Accounts';
import type {Env} from './types';

const responseError=(error:string,status:number)=>Response.json({error},{status});
const keyUrl='https://www.gstatic.com/admob/reward/verifier-keys.json';
let publicKeys:{expires:number;keys:Map<string,string>}|undefined;
async function googleKey(id:string){
 if(!publicKeys||publicKeys.expires<Date.now()){
  const response=await fetch(keyUrl);if(!response.ok)throw Error('SSV_KEYS');
  const body=z.object({keys:z.array(z.object({keyId:z.number().int(),base64:z.string()}))}).parse(await response.json());
  publicKeys={expires:Date.now()+3600000,keys:new Map(body.keys.map(key=>[String(key.keyId),key.base64]))};
 }
 return publicKeys.keys.get(id);
}
function base64(value:string){return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0));}
function p1363(der:Uint8Array){
 if(der[0]!==0x30||der[1]!==der.length-2)throw Error('SSV_DER');
 const result=new Uint8Array(64);let offset=2;
 for(let part=0;part<2;part++){
  const length=der[offset+1];
  if(der[offset]!==2||length<1||length>33||offset+2+length>der.length)throw Error('SSV_DER');
  const value=der.slice(offset+2,offset+2+length);
  if(value[0]>127||length===33&&value[0]!==0||length>1&&value[0]===0&&value[1]<128)throw Error('SSV_DER');
  const unsigned=length===33?value.subarray(1):value;
  result.set(unsigned,part*32+32-unsigned.length);offset+=2+length;
 }
 if(offset!==der.length)throw Error('SSV_DER');
 return result;
}
export async function verifyReward(url:URL,expectedUnit:string,keyLookup=googleKey){
 const query=url.search.slice(1);
 const match=/^(.+)&signature=([A-Za-z0-9_%=-]+)&key_id=([0-9]+)$/.exec(query);
 if(!match||query.length>4096)return null;
 const [,signed,signature,keyId]=match;
 const params=new URLSearchParams(signed);
 if(new Set(params.keys()).size!==[...params.keys()].length||params.has('key_id')||params.has('signature'))return null;
 const unit=params.get('ad_unit'),amount=params.get('reward_amount'),item=params.get('reward_item');
 const transaction=params.get('transaction_id'),nonce=params.get('custom_data');
 if(!unit||unit!==expectedUnit.split('/').at(-1)||amount!=='2'||item!=='fichas'||!transaction||!/^([a-f0-9]{16,128})$/i.test(transaction)||!z.uuid().safeParse(nonce).success)return null;
 let timestamp=Number(params.get('timestamp'));if(timestamp>1e14)timestamp=Math.floor(timestamp/1000);
 if(!Number.isSafeInteger(timestamp)||timestamp<Date.now()-86400000||timestamp>Date.now()+300000)return null;
 const key=await keyLookup(keyId);if(!key)return null;
 try{
  const publicKey=await crypto.subtle.importKey('spki',base64(key),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const data=new TextEncoder().encode(signed);
  if(!await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},publicKey,p1363(base64(decodeURIComponent(signature))),data))return null;
  return {nonce:nonce!,ref:'ad:'+transaction.toLowerCase(),at:timestamp};
 }catch{return null;}
}

const eventSchema=z.object({
 id:z.string().regex(/^[A-Za-z0-9_-]{1,160}$/),type:z.string(),store:z.string().optional(),
 app_id:z.string().optional(),app_user_id:z.uuid().optional(),environment:z.string().optional(),
 product_id:z.string().optional(),transaction_id:z.string().regex(/^[A-Za-z0-9_.:-]{1,180}$/).optional(),
 event_timestamp_ms:z.number().int().positive().optional(),purchased_at_ms:z.number().int().positive().optional(),
 expiration_at_ms:z.number().int().positive().nullable().optional(),cancel_reason:z.string().optional()
});
export function parseRevenueEvent(input:unknown,appId:string,environment:string):CommerceCredit|null{
 const result=z.object({event:eventSchema}).safeParse(input);if(!result.success)return null;
 const event=result.data.event;
 if(event.app_id!==appId||event.environment!==environment||event.store!=='PLAY_STORE'||!event.app_user_id)return null;
 const amount=tokenPacks[event.product_id as keyof typeof tokenPacks];
 if(amount&&typeof amount==='number'&&event.type==='NON_RENEWING_PURCHASE'&&event.transaction_id){
  return {kind:'pack',id:event.app_user_id,ref:'play:'+event.transaction_id,amount};
 }
 if(event.product_id!==passProduct||!event.event_timestamp_ms)return null;
 const base={kind:'pass' as const,id:event.app_user_id,ref:'pass:'+event.id,at:event.event_timestamp_ms};
 if(event.type==='CANCELLATION'&&event.cancel_reason==='CUSTOMER_SUPPORT'&&event.expiration_at_ms)return {...base,expires:event.event_timestamp_ms,periodEnd:event.expiration_at_ms};
 if(event.type==='EXPIRATION'&&event.expiration_at_ms)return {...base,expires:event.expiration_at_ms,periodEnd:event.expiration_at_ms};
 if(!['INITIAL_PURCHASE','RENEWAL','UNCANCELLATION','SUBSCRIPTION_EXTENDED'].includes(event.type)||!event.expiration_at_ms||!event.purchased_at_ms)return null;
 const stamp=['INITIAL_PURCHASE','RENEWAL'].includes(event.type)?'pass_stamp:'+localeDay(event.purchased_at_ms).slice(0,7):undefined;
 return {...base,expires:event.expiration_at_ms,stamp};
}
export async function commerceCallback(request:Request,env:Env,url:URL):Promise<Response|null>{
 if(url.pathname==='/api/hooks/admob'){
  if(request.method!=='GET')return responseError('METHOD',405);
  if(!env.ADMOB_REWARDED_ID)return responseError('UNAVAILABLE',503);
  const reward=await verifyReward(url,env.ADMOB_REWARDED_ID);if(!reward)return responseError('AUTH',401);
  return Response.json(await accountCall(env,{op:'adReward',...reward}));
 }
 if(url.pathname==='/api/hooks/revenuecat'){
  if(request.method!=='POST')return responseError('METHOD',405);
  if(!await feedbackAuthorized(request,env.REVENUECAT_WEBHOOK_KEY)||!env.REVENUECAT_APP_ID)return responseError('AUTH',401);
  const body=await readJson(request,32768);
  const credit=parseRevenueEvent(body,env.REVENUECAT_APP_ID,env.REVENUECAT_ENVIRONMENT??'PRODUCTION');
  if(!credit)return Response.json({ok:true,ignored:true});
  return Response.json(await accountCall(env,{op:'commerceCredit',credit}));
 }
 return null;
}
