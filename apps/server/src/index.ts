import {z} from 'zod';
import {readJson} from './body';
import {type Env,type Profile,stub,internal} from './types';
import {accountCall} from './Accounts';
import {identity,verifiedUid,sessionToken,sessionCookie} from './auth';
import {roomSchema,codeSchema,roomCode,nicknameSchema} from '../../../packages/protocol/src/index';
import {economy} from '../../../packages/shared/src/economy';
import {defaultSettings} from './meta';
export {Accounts} from './Accounts';export {MatchRoom} from './MatchRoom';export {Matchmaker} from './Matchmaker';
function error(code:string,status=400){return Response.json({error:code},{status,headers:{'Cache-Control':'no-store'}});}
function sameOrigin(request:Request){const origin=request.headers.get('Origin');if(!origin)return true;const url=new URL(request.url);return origin===url.origin||(['127.0.0.1','localhost'].includes(url.hostname)&&['http://127.0.0.1:5173','http://localhost:5173'].includes(origin));}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(url.pathname==='/api/health')return Response.json({ok:true,name:'Truco de Boliche',storage:'local'});
 if(!sameOrigin(request))return error('ORIGIN',403);
 try{
  if(url.pathname==='/api/auth/config')return Response.json({mode:env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SERVICE_ROLE_KEY?'supabase':'local',url:env.SUPABASE_URL??null,key:env.SUPABASE_PUBLISHABLE_KEY??null},{headers:{'Cache-Control':'no-store'}});
  if(url.pathname==='/api/economy')return Response.json(economy,{headers:{'Cache-Control':'no-store'}});
  if(request.method==='POST'&&(!request.headers.get('Content-Type')?.includes('application/json')||Number(request.headers.get('Content-Length')??0)>4096))return error('CONTENT');
  if(url.pathname==='/api/account/delete'&&request.method==='POST'){z.object({confirm:z.literal(true)}).strict().parse(await readJson(request));const id=await accountCall<string|null>(env,{op:'deleteTarget',token:sessionToken(request)});if(!id)return error('AUTH',401);const {rooms}=await accountCall<{rooms:string[]}>(env,{op:'beginDelete',id});for(const code of rooms){const response=await stub(env.MATCH_ROOM,code).fetch(internal({id},'/forget'));if(!response.ok&&response.status!==404)throw Error('DELETE_RETRY');}await accountCall(env,{op:'delete',id});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(request,'',true),'Cache-Control':'no-store'}});}
  const profile=await identity(request,env);
  if(url.pathname==='/api/auth/session')return Response.json({profile},{headers:{'Cache-Control':'no-store'}});
  if(url.pathname==='/api/auth/guest'&&request.method==='POST'){
   if(profile)return Response.json({profile});const body=z.object({nickname:nicknameSchema.optional(),character:z.enum(['washington','marta']).optional(),age13Confirmed:z.literal(true).optional()}).strict().parse(await readJson(request));const nickname=nicknameSchema.parse(body.nickname??'Paisano '+Math.floor(Math.random()*9000+1000));const uid=await verifiedUid(request,env);if(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&!uid)return error('AUTH',401);const created=await accountCall<{profile:Profile;token:string}>(env,{op:'create',nickname,character:body.character,uid,age13Confirmed:body.age13Confirmed});return Response.json({profile:created.profile},{headers:{'Set-Cookie':sessionCookie(request,created.token),'Cache-Control':'no-store'}});
  }
  if(!profile)return error('AUTH',401);
  if(url.pathname==='/api/profile'&&request.method==='POST'){const settings=z.object({fast:z.boolean(),reduced:z.boolean(),haptics:z.boolean(),quality:z.enum(['auto','high','medium','low']),telemetry:z.boolean()}).partial();const body=z.object({nickname:nicknameSchema.optional(),age13Confirmed:z.literal(true).optional(),tutorialDone:z.literal(true).optional(),settings:settings.optional()}).strict().parse(await readJson(request));return Response.json(await accountCall(env,{op:'update',id:profile.id,...body,settings:body.settings?{...defaultSettings,...profile.settings,...body.settings}:undefined}),{headers:{'Cache-Control':'no-store'}});}
  if(url.pathname==='/api/equip'&&request.method==='POST'){const body=z.object({itemId:z.string().max(80),variant:z.string().max(40).optional()}).strict().parse(await readJson(request));return Response.json(await accountCall(env,{op:'equip',id:profile.id,...body}),{headers:{'Cache-Control':'no-store'}});}
  if(url.pathname==='/api/ledger')return Response.json(await accountCall(env,{op:'ledger',id:profile.id}),{headers:{'Cache-Control':'no-store'}});
  if(url.pathname==='/api/ranking')return Response.json(await accountCall(env,{op:'ranking'}),{headers:{'Cache-Control':'no-store'}});
  if((url.pathname.startsWith('/api/rooms')||url.pathname==='/api/queue')&&!profile.age13Confirmed)return error('AGE_REQUIRED',409);
  if(url.pathname==='/api/auth/logout'&&request.method==='POST'){await accountCall(env,{op:'logout',token:sessionToken(request)});return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(request,'',true)}});}
  if(url.pathname==='/api/rooms'&&request.method==='POST'){
   const body=roomSchema.parse(await readJson(request));for(let tries=0;tries<10;tries++){const code=roomCode();const response=await stub(env.MATCH_ROOM,code).fetch(internal({...body,code,host:profile},'/init'));if(response.ok)return Response.json({code});if(response.status!==409)return response;}return error('CODE_COLLISION',503);
  }
  const room=url.pathname.match(/^\/api\/rooms\/([^/]+)\/(join|ready|fill|seat|abandon|rematch|socket|snapshot)$/);
  if(room){
   const code=codeSchema.parse(room[1].toUpperCase()),op=room[2];const target=stub(env.MATCH_ROOM,code);
   if(op==='socket'){const headers=new Headers(request.headers);headers.set('x-profile-id',profile.id);return target.fetch(new Request('https://internal/socket',{method:'GET',headers}));}
   if(op==='snapshot'){const headers=new Headers({'x-profile-id':profile.id,'Content-Type':'application/json'});return target.fetch(new Request('https://internal/snapshot',{method:'POST',headers,body:'{}'}));}
   if(request.method!=='POST')return error('METHOD',405);const body=await readJson(request) as Record<string,unknown>;const payload=op==='join'?{profile}:op==='seat'?z.object({from:z.number().int().min(0).max(3),to:z.number().int().min(0).max(3)}).strict().parse(body):{};const forwarded=internal(payload,'/'+op);forwarded.headers.set('x-profile-id',profile.id);return target.fetch(forwarded);
  }
  if(url.pathname==='/api/queue'&&request.method==='POST'){
   const body=z.object({op:z.enum(['join','poll','cancel']),ticket:z.uuid(),seats:z.union([z.literal(2),z.literal(4)])}).strict().parse(await readJson(request));return stub(env.MATCHMAKER,String(body.seats)).fetch(internal({...body,profile}));
  }
  return error('NOT_FOUND',404);
 }catch(caught){const message=caught instanceof Error?caught.message:'UNKNOWN';if(caught instanceof z.ZodError)return error('INVALID_REQUEST');if(message==='AUTH')return error('AUTH',401);if(message==='INVALID_REQUEST')return error(message);if(['BALANCE','ACCOUNT_EXISTS','ITEM_LOCKED','DELETE_RETRY','SERVER_ABORT'].includes(message))return error(message,409);console.error('api',url.pathname,message);return error('SERVER',500);}
}} satisfies ExportedHandler<Env>;
