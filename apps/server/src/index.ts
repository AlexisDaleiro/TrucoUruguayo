import {androidOrigin,androidPackage,demoRewardedUnit} from '../../../packages/shared/src/mobile';
import {commerceCallback} from './commerce';
import {feedbackAuthorized} from './Feedback';
export {Feedback} from './Feedback';
import {z} from 'zod';
import {readJson} from './body';
import {type Env,type Profile,stub,internal} from './types';
import {accountCall} from './Accounts';
import {identity,verifiedUid,sessionToken,sessionCookie,nativeRequest} from './auth';
import {roomSchema,codeSchema,roomCode,nicknameSchema} from '../../../packages/protocol/src/index';
import {economy,type EconomyConfig} from '../../../packages/shared/src/economy';
import {catalog,ownsItem} from '../../../packages/shared/src/catalog';
import {remoteMeta} from './RemoteMeta';
export {Accounts} from './Accounts';export {MatchRoom} from './MatchRoom';export {Matchmaker} from './Matchmaker';
function error(code:string,status=400){return Response.json({error:code},{status,headers:{'Cache-Control':'no-store'}});}
function sameOrigin(request:Request){const origin=request.headers.get('Origin');if(!origin||origin===androidOrigin)return true;const url=new URL(request.url);return origin===url.origin||(['127.0.0.1','localhost'].includes(url.hostname)&&['http://127.0.0.1:5173','http://localhost:5173'].includes(origin));}
async function handle(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);
 if(url.pathname==='/.well-known/assetlinks.json'){
  const fingerprints=(env.ANDROID_SHA256??'').split(',').map(value=>value.trim().toUpperCase()).filter(value=>/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(value));
  const links=fingerprints.length?[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:androidPackage,sha256_cert_fingerprints:fingerprints}}]:[];
  return Response.json(links,{headers:{'Cache-Control':'public,max-age=300'}});
 }
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(url.pathname==='/api/health')return Response.json({ok:true,name:'Truco de Boliche',storage:'local'});
 if(!sameOrigin(request))return error('ORIGIN',403);
 try{
  const callback=await commerceCallback(request,env,url);if(callback)return callback;
  if(url.pathname==='/api/auth/config'){
   const mode=env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SERVICE_ROLE_KEY?'supabase':'local';
   const profile=mode==='local'&&url.searchParams.get('profile')==='1'?await identity(request,env):undefined;
   return Response.json({mode,url:env.SUPABASE_URL??null,key:env.SUPABASE_PUBLISHABLE_KEY??null,profile},{headers:{'Cache-Control':'no-store'}});
  }
  if(url.pathname==='/api/feedback'&&request.method==='GET'){if(!await feedbackAuthorized(request,env.FEEDBACK_READ_KEY))return error('FORBIDDEN',403);return stub(env.FEEDBACK,'feedback-v1').fetch('https://internal/feedback');}
  if(url.pathname==='/api/economy')return Response.json(await remoteMeta(env)?.call({op:'config'})??economy,{headers:{'Cache-Control':'no-store'}});
  if(request.method==='POST'&&(!request.headers.get('Content-Type')?.includes('application/json')||Number(request.headers.get('Content-Length')??0)>4096))return error('CONTENT');
  if(url.pathname==='/api/account/delete'&&request.method==='POST'){z.object({confirm:z.literal(true)}).strict().parse(await readJson(request));const id=await accountCall<string|null>(env,{op:'deleteTarget',token:sessionToken(request)});if(!id)return error('AUTH',401);const linked=await accountCall<string|null>(env,{op:'linkedUID',id});const uid=await verifiedUid(request,env).catch(()=>null);const accessToken=uid&&uid===linked?request.headers.get('Authorization')?.slice(7):undefined;const {rooms}=await accountCall<{rooms:string[]}>(env,{op:'beginDelete',id});for(const code of rooms){const response=await stub(env.MATCH_ROOM,code).fetch(internal({id},'/forget'));if(!response.ok&&response.status!==404)throw Error('DELETE_RETRY');}await accountCall(env,{op:'delete',id,accessToken});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(request,'',true),'Cache-Control':'no-store'}});}
  const socket=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/socket$/);
  const protocol=request.headers.get('Sec-WebSocket-Protocol');
  if(socket&&protocol){
   const offered=protocol.split(',').map(value=>value.trim());
   if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket'||!offered.includes('boliche.v1'))return error('AUTH',401);
   const ticket=offered.find(value=>/^boliche-ticket\.[0-3]\.[a-f0-9-]{36}$/.test(value));
   if(!ticket)return error('AUTH',401);
   const headers=new Headers(request.headers);headers.delete('x-profile-id');headers.set('x-boliche-ticket',ticket.slice('boliche-ticket.'.length));
   return stub(env.MATCH_ROOM,socket[1]).fetch(new Request('https://internal/socket',{headers}));
  }
  const profile=await identity(request,env);
  if(url.pathname==='/api/auth/session'){const token=sessionToken(request);const deleting=!profile&&token&&await accountCall<boolean>(env,{op:'deleting',token});return Response.json({profile},{headers:{'Cache-Control':'no-store',...(!profile&&token&&!deleting?{'Set-Cookie':sessionCookie(request,'',true)}:{})}});}
  if(url.pathname==='/api/auth/guest'&&request.method==='POST'){
   if(profile)return Response.json({profile});const body=z.object({nickname:nicknameSchema.optional(),character:z.enum(['washington','marta']).optional(),age13Confirmed:z.literal(true).optional()}).strict().parse(await readJson(request));const nickname=nicknameSchema.parse(body.nickname??'Paisano '+Math.floor(Math.random()*9000+1000));const uid=await verifiedUid(request,env);if(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SERVICE_ROLE_KEY&&!uid)return error('AUTH',401);const created=await accountCall<{profile:Profile;token:string}>(env,{op:'create',nickname,character:body.character,uid,age13Confirmed:body.age13Confirmed});return nativeRequest(request)?Response.json({profile:created.profile,sessionToken:created.token},{headers:{'Cache-Control':'no-store'}}):Response.json({profile:created.profile},{headers:{'Set-Cookie':sessionCookie(request,created.token),'Cache-Control':'no-store'}});
  }
  if(!profile)return error('AUTH',401);
  if(url.pathname==='/api/mobile/config'&&request.method==='GET'){
   if(!nativeRequest(request)||!profile.age13Confirmed)return error('FORBIDDEN',403);
   const adUnit=env.ADMOB_REWARDED_ID??demoRewardedUnit;
   const revenueCatKey=env.REVENUECAT_APP_ID&&env.REVENUECAT_WEBHOOK_KEY&&env.REVENUECAT_SECRET_KEY?env.REVENUECAT_PUBLIC_KEY??null:null;
   if(revenueCatKey)await accountCall(env,{op:'billingSeen',id:profile.id});
   return Response.json({adUnit,testAds:!env.ADMOB_REWARDED_ID,revenueCatKey},{headers:{'Cache-Control':'no-store'}});
  }
  if(url.pathname==='/api/mobile/ad-intent'&&request.method==='POST'){
   if(!nativeRequest(request)||!profile.age13Confirmed)return error('FORBIDDEN',403);
   if(!env.ADMOB_REWARDED_ID)return error('UNAVAILABLE',503);
   return Response.json(await accountCall(env,{op:'adIntent',id:profile.id}),{headers:{'Cache-Control':'no-store'}});
  }
  if(url.pathname==='/api/feedback'&&request.method==='POST'){if(!profile.age13Confirmed)return error('AGE_REQUIRED',409);const body=z.object({category:z.enum(['bug','idea','other']),message:z.string().trim().min(10).max(800)}).strict().parse(await readJson(request));return stub(env.FEEDBACK,'feedback-v1').fetch(internal({...body,profileId:profile.id}));}
  if(url.pathname==='/api/profile'&&request.method==='POST'){const settings=z.object({fast:z.boolean(),reduced:z.boolean(),haptics:z.boolean(),quality:z.enum(['auto','high','medium','low']),telemetry:z.boolean()}).partial();const body=z.object({nickname:nicknameSchema.optional(),age13Confirmed:z.literal(true).optional(),tutorialDone:z.literal(true).optional(),settings:settings.optional()}).strict().parse(await readJson(request));return Response.json(await accountCall(env,{op:'update',id:profile.id,...body,settings:body.settings}),{headers:{'Cache-Control':'no-store'}});}
  if(url.pathname==='/api/equip'&&request.method==='POST'){const body=z.object({itemId:z.string().max(80),variant:z.string().max(40).optional()}).strict().parse(await readJson(request));return Response.json(await accountCall(env,{op:'equip',id:profile.id,...body}),{headers:{'Cache-Control':'no-store'}});}
  if(url.pathname==='/api/ledger')return Response.json(await accountCall(env,{op:'ledger',id:profile.id}),{headers:{'Cache-Control':'no-store'}});
  if(url.pathname==='/api/ranking')return Response.json(await accountCall(env,{op:'ranking'}),{headers:{'Cache-Control':'no-store'}});
  if((url.pathname.startsWith('/api/rooms')||url.pathname==='/api/queue')&&!profile.age13Confirmed)return error('AGE_REQUIRED',409);
  if(url.pathname==='/api/auth/logout'&&request.method==='POST'){await accountCall(env,{op:'logout',token:sessionToken(request)});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(request,'',true)}});}
  if(url.pathname==='/api/rooms'&&request.method==='POST'){
   const body=roomSchema.parse(await readJson(request));const config=await remoteMeta(env)?.call<EconomyConfig>({op:'config'})??economy;if(profile.wallet<config.entry&&(profile.passUntil??0)<=Date.now())return error('BALANCE',409);if(body.environment){const item=catalog.find(item=>item.id===(body.environment==='boliche'?'env_boliche':'env_galpon'))!;if(!ownsItem(item,profile.xp,profile.inventory??[]))return error('ITEM_LOCKED',409);}for(let tries=0;tries<10;tries++){const code=roomCode();const response=await stub(env.MATCH_ROOM,code).fetch(internal({...body,code,host:profile},'/init'));if(response.ok){await accountCall(env,{op:'registerRoom',id:profile.id,code});return Response.json({code});}if(response.status!==409)return response;}return error('CODE_COLLISION',503);
  }
  const room=url.pathname.match(/^\/api\/rooms\/([^/]+)\/(join|ready|fill|seat|abandon|rematch|socket|socket-ticket|snapshot)$/);
  if(room){
   const code=codeSchema.parse(room[1].toUpperCase()),op=room[2];const target=stub(env.MATCH_ROOM,code);
   if(op==='socket'){const headers=new Headers(request.headers);headers.delete('x-boliche-ticket');headers.set('x-profile-id',profile.id);return target.fetch(new Request('https://internal/socket',{method:'GET',headers}));}
   if(op==='snapshot'){const headers=new Headers({'x-profile-id':profile.id,'Content-Type':'application/json'});return target.fetch(new Request('https://internal/snapshot',{method:'POST',headers,body:'{}'}));}
   if(request.method!=='POST')return error('METHOD',405);const body=await readJson(request) as Record<string,unknown>;const payload=op==='join'?{profile}:op==='seat'?z.object({from:z.number().int().min(0).max(3),to:z.number().int().min(0).max(3)}).strict().parse(body):{};const forwarded=internal(payload,'/'+op);forwarded.headers.set('x-profile-id',profile.id);return target.fetch(forwarded);
  }
  if(url.pathname==='/api/queue'&&request.method==='POST'){
   const body=z.object({op:z.enum(['join','poll','cancel']),ticket:z.uuid(),seats:z.union([z.literal(2),z.literal(4)])}).strict().parse(await readJson(request));const config=body.op==='join'?(await remoteMeta(env)?.call<EconomyConfig>({op:'config'})??economy):economy;return stub(env.MATCHMAKER,String(body.seats)).fetch(internal({...body,profile,entry:config.entry}));
  }
  return error('NOT_FOUND',404);
 }catch(caught){const message=caught instanceof Error?caught.message:'UNKNOWN';if(caught instanceof z.ZodError)return error('INVALID_REQUEST');if(message==='AUTH')return error('AUTH',401);if(message==='INVALID_REQUEST')return error(message);if(['BALANCE','ACCOUNT_EXISTS','ITEM_LOCKED','DELETE_RETRY','SERVER_ABORT'].includes(message))return error(message,409);console.error('api',url.pathname,message);return error('SERVER',500);}
}
export default {async fetch(request:Request,env:Env){
 const native=nativeRequest(request)&&new URL(request.url).pathname.startsWith('/api/');
 if(native&&request.method==='OPTIONS')return new Response(null,{status:204,headers:{
  'Access-Control-Allow-Origin':androidOrigin,
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Boliche-Session',
  'Access-Control-Max-Age':'600','Vary':'Origin'
 }});
 const response=await handle(request,env);
 if(!native||response.status===101)return response;
 const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',androidOrigin);headers.append('Vary','Origin');
 headers.delete('Set-Cookie');
 return new Response(response.body,{status:response.status,headers});
}} satisfies ExportedHandler<Env>;
