import {DurableObject} from 'cloudflare:workers';
import {act,legalActions,newMatch,order,team,timeout,viewFor,type Action,type Card} from '../../../packages/engine/src/index';
import {chooseAction,thinkMs,nicknames,difficultyForMmr} from '../../../packages/bots/src/index';
import {intentSchema,MAX_MESSAGE_BYTES,CHAT_COOLDOWN_MS} from '../../../packages/protocol/src/index';
import {type Env,type RoomData,type Attachment,type Member,type Profile} from './types';
import {accountCall} from './Accounts';
import {secureDeal} from './random';
import {signalFor} from '../../../packages/engine/src/senas';
export class MatchRoom extends DurableObject<Env>{
 data:RoomData|null=null;
 locked:Promise<unknown>=Promise.resolve();
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','{"type":"PONG"}'));ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get<RoomData>('room')??null;});}
 async save(){if(this.data)await this.ctx.storage.put('room',this.data);}
 serial<T>(fn:()=>Promise<T>):Promise<T>{const next=this.locked.then(fn);this.locked=next.catch(()=>{});return next;}
 fetch(request:Request):Promise<Response>{return this.serial(()=>this.handle(request));}
 async handle(request:Request):Promise<Response>{
  const url=new URL(request.url);const op=url.pathname.slice(1);const profileId=request.headers.get('x-profile-id')??'';
  if(op==='socket')return this.connectSocket(request,profileId);
  const body=await request.json() as {code?:string;host?:Profile;seats?:2|4;targetScore?:30|40;florEnabled?:boolean;environment?:string;members?:Profile[];profile?:Profile;seat?:number;from?:number;to?:number};
  if(op==='init'){
   if(this.data)return Response.json({error:'EXISTS'},{status:409});
   const profiles=body.members??[body.host!];this.data={code:body.code!,matchId:crypto.randomUUID(),host:profiles[0].id,seats:body.seats!,rules:{targetScore:body.targetScore??30,florEnabled:body.florEnabled??true},members:Array.from({length:body.seats!},(_,i)=>profiles[i]?this.member(profiles[i]):null),state:null,hasBots:false,private:!body.members,environment:body.environment??null,createdAt:Date.now(),updatedAt:Date.now(),deadline:null,botAt:null,nextHandAt:null,roomSeq:0,finished:false};
   if(body.members){for(const member of this.data.members)if(member)member.ready=true;await this.fill();}
   await this.save();await this.schedule();return Response.json({code:this.data.code});
  }
  const d=this.data;if(!d)return Response.json({error:'NOT_FOUND'},{status:404});
  if(op==='join'){
   const profile=body.profile!;let seat=d.members.findIndex(m=>m?.id===profile.id);
   if(seat<0){if(d.state)return Response.json({error:'STARTED'},{status:409});seat=d.members.findIndex(m=>m===null);if(seat<0)return Response.json({error:'FULL'},{status:409});d.members[seat]=this.member(profile);}
   d.updatedAt=Date.now();d.roomSeq++;await this.save();this.broadcast();await this.schedule();return Response.json({seat});
  }
  const seat=d.members.findIndex(m=>m?.id===profileId);if(seat<0)return Response.json({error:'FORBIDDEN'},{status:403});
  if(op==='ready'){
   if(d.state)return Response.json({error:'STARTED'},{status:409});d.members[seat]!.ready=true;
   if(d.members.every(m=>m?.ready))await this.start();d.roomSeq++;d.updatedAt=Date.now();await this.save();this.broadcast();await this.schedule();return Response.json({ok:true});
  }
  if(op==='fill'){
   if(profileId!==d.host||d.state)return Response.json({error:'FORBIDDEN'},{status:403});await this.fill();d.roomSeq++;await this.save();this.broadcast();await this.schedule();return Response.json({ok:true});
  }
  if(op==='seat'){
   const from=body.from??seat,to=body.to??body.seat;
   if(profileId!==d.host||d.state||!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=d.seats||to!<0||to!>=d.seats)return Response.json({error:'FORBIDDEN'},{status:403});
   [d.members[from],d.members[to!]]=[d.members[to!],d.members[from]];await this.save();this.broadcast();return Response.json({ok:true});
  }
  if(op==='abandon'){
   const member=d.members[seat]!;member.abandoned=true;member.bot=true;member.disconnectedAt=null;
   if(d.state){await this.resetDecision();}else d.members[seat]=null;await this.save();this.broadcast();await this.schedule();return Response.json({ok:true});
  }
  if(op==='rematch'){
   if(!d.private||d.state?.winner===null||!d.state)return Response.json({error:'FORBIDDEN'},{status:403});d.state=null;d.matchId=crypto.randomUUID();d.deadline=null;d.botAt=null;d.nextHandAt=null;d.finished=false;
   for(const member of d.members)if(member){member.ready=member.originalBot;member.abandoned=false;member.returning=false;member.bot=member.originalBot;}
   d.members[seat]!.ready=true;d.roomSeq++;await this.save();this.broadcast();await this.schedule();return Response.json({ok:true});
  }
  if(op==='snapshot')return Response.json(this.snapshot(seat));
  return Response.json({error:'UNKNOWN'},{status:400});
 }
 member(profile:Profile):Member{return {id:profile.id,nickname:profile.nickname,character:profile.character,mmr:profile.mmr,ready:false,bot:false,originalBot:false,disconnectedAt:null,returning:false,abandoned:false};}
 async fill(){const d=this.data!;for(let i=0;i<d.seats;i++)if(!d.members[i]){d.members[i]={id:'bot:'+crypto.randomUUID(),nickname:nicknames[Math.floor(Math.random()*nicknames.length)],character:i%2?'washington':'marta',mmr:d.members.find(m=>m&&!m.originalBot)?.mmr??1000,ready:true,bot:true,originalBot:true,disconnectedAt:null,returning:false,abandoned:false};d.hasBots=true;}if(d.members.every(m=>m?.ready))await this.start();}
 async start(){
  const d=this.data!;if(d.state||d.members.some(m=>!m?.ready))return;
  const audit=secureDeal();const state=newMatch(d.seats,audit.order,d.rules);
  // The same DO transaction reserves all human entries before committing the deal.
  await accountCall(this.env,{op:'reserve',ids:d.members.filter(m=>!m!.originalBot).map(m=>m!.id),ref:d.matchId});
  d.state=state;d.updatedAt=Date.now();await this.ctx.storage.put('audit:1',audit);await this.resetDecision();
 }
 snapshot(seat:number){const d=this.data!;return {type:'SNAPSHOT',roomSeq:d.roomSeq,code:d.code,seat,seats:d.seats,host:d.members[seat]?.id===d.host,private:d.private,environment:d.environment,deadline:d.deadline,members:d.members.map(m=>m?{nickname:m.nickname,character:m.character,ready:m.ready,connected:m.bot||m.disconnectedAt===null}:null),view:d.state?viewFor(d.state,seat):null};}
 send(ws:WebSocket,value:unknown){try{ws.send(JSON.stringify(value));}catch{/* Close event handles disconnected state. */}}
 broadcast(){if(!this.data)return;for(const socket of this.ctx.getWebSockets()){const a=socket.deserializeAttachment() as Attachment;const seat=this.data.members.findIndex(m=>m?.id===a.profileId);if(seat>=0){a.seat=seat;socket.serializeAttachment(a);this.send(socket,this.snapshot(seat));if(this.data.seats===4&&this.data.state&&a.signaledHand!==this.data.state.handNo){for(let i=0;i<this.data.seats;i++){if(!this.data.members[i]?.bot)continue;this.send(socket,{type:'SENA',seat:i,gesture:team(i)===team(seat)?signalFor(this.data.state.original[i],this.data.state.sample):'tic'});}a.signaledHand=this.data.state.handNo;socket.serializeAttachment(a);}}}}
 async connectSocket(request:Request,profileId:string):Promise<Response>{
  const d=this.data;if(!d)return Response.json({error:'NOT_FOUND'},{status:404});if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});const seat=d.members.findIndex(m=>m?.id===profileId);if(seat<0)return Response.json({error:'FORBIDDEN'},{status:403});
  const pair=new WebSocketPair();const [client,server]=Object.values(pair);const member=d.members[seat]!;
  if(member.abandoned)return Response.json({error:'ABANDONED'},{status:403});
  for(const old of this.ctx.getWebSockets()){const a=old.deserializeAttachment() as Attachment;if(a.profileId===profileId)old.close(1000,'Nueva conexión');}
  const attachment:Attachment={profileId,seat,windowStart:Date.now(),messages:0,lastChat:0,lastSena:0};server.serializeAttachment(attachment);this.ctx.acceptWebSocket(server);member.disconnectedAt=null;
  if(member.bot&&!member.originalBot){if(d.state&&legalActions(d.state,seat).length)member.bot=false;else member.returning=true;}
  d.updatedAt=Date.now();await this.save();this.broadcast();await this.schedule();return new Response(null,{status:101,webSocket:client});
 }
 webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){return this.serial(()=>this.onMessage(ws,message));}
 async onMessage(ws:WebSocket,message:string|ArrayBuffer){
  const d=this.data;if(!d)return;const a=ws.deserializeAttachment() as Attachment;
  if(typeof message!=='string'||new TextEncoder().encode(message).length>MAX_MESSAGE_BYTES){ws.close(1009,'Mensaje demasiado grande');return;}
  if(message==='ping'){this.send(ws,{type:'PONG'});return;}
  const now=Date.now();if(now-a.windowStart>5000){a.windowStart=now;a.messages=0;}if(++a.messages>30){this.send(ws,{type:'ERROR',code:'RATE_LIMIT'});ws.serializeAttachment(a);return;}
  let raw:unknown;try{raw=JSON.parse(message);}catch{this.send(ws,{type:'ERROR',code:'INVALID_JSON'});return;}
  const parsed=intentSchema.safeParse(raw);if(!parsed.success){this.send(ws,{type:'ERROR',code:'INVALID_MESSAGE'});return;}
  const seat=d.members.findIndex(m=>m?.id===a.profileId);if(seat<0||d.members[seat]?.abandoned)return;const msg=parsed.data;
  if(msg.type==='CHAT'){
   if(now-a.lastChat<CHAT_COOLDOWN_MS){this.send(ws,{type:'ERROR',code:'COOLDOWN'});return;}a.lastChat=now;for(const socket of this.ctx.getWebSockets())this.send(socket,{type:'CHAT',seat,phrase:msg.phrase});
  }else if(msg.type==='SENA'){
   if(d.seats!==4||now-a.lastSena<1500){this.send(ws,{type:'ERROR',code:'COOLDOWN'});return;}a.lastSena=now;
   d.partnerSignals??={};d.partnerSignals[(seat+2)%4]={gesture:msg.gesture,handNo:d.state?.handNo??0};await this.save();
   for(const socket of this.ctx.getWebSockets()){const other=socket.deserializeAttachment() as Attachment;const teammate=team(other.seat)===team(seat);const catchReal=!teammate&&Math.random()<(d.state?.config.senaCatchChance??0);this.send(socket,{type:'SENA',seat,gesture:teammate||catchReal?msg.gesture:'tic'});}
  }else{
   const key='intent:'+a.profileId+':'+msg.id;if(await this.ctx.storage.get(key)){this.send(ws,this.snapshot(seat));return;}
   if(!d.state||d.members[seat]?.bot||msg.seq!==d.state.seq){this.send(ws,{type:'ERROR',code:'STALE'});this.send(ws,this.snapshot(seat));return;}
   try{await this.apply(seat,msg.action as Action);await this.ctx.storage.put(key,true);}catch(error){this.send(ws,{type:'ERROR',code:error instanceof Error&&error.message==='Acción ilegal'?'ILLEGAL_ACTION':'ACTION_FAILED'});return;}
   this.broadcast();await this.schedule();
  }
  ws.serializeAttachment(a);
 }
 async apply(seat:number,action:Action){
  const d=this.data!,state=d.state!;const audit=action.type==='NEXT_HAND'?secureDeal():undefined;const cards:Card[]|undefined=audit?.order;const next=act(state,seat,action,cards);
  if(audit)await this.ctx.storage.put('audit:'+next.handNo,audit);await this.ctx.storage.put('log:'+next.seq,{seat,action,at:Date.now()});d.state=next;if(action.type==='NEXT_HAND')d.partnerSignals={};d.roomSeq++;d.updatedAt=Date.now();
  for(const member of d.members)if(member?.returning){member.bot=false;member.returning=false;}
  await this.resetDecision();await this.save();
 }
 async resetDecision(){const d=this.data!;const s=d.state;if(!s||s.winner!==null){d.deadline=null;d.botAt=null;d.nextHandAt=null;return;}
  if(s.handWinner!==null){d.deadline=null;d.botAt=null;d.nextHandAt=Date.now()+2200;return;}
  if(s.seats===4){d.partnerSignals??={};for(let i=0;i<s.seats;i++)if(d.members[i]?.bot)d.partnerSignals[(i+2)%4]={gesture:signalFor(s.original[i],s.sample),handNo:s.handNo};}
  d.nextHandAt=null;d.deadline=Date.now()+s.config.turnSeconds*1000;const bot=order(s.mano,s.seats).find(i=>d.members[i]?.bot&&legalActions(s,i).length);d.botAt=bot===undefined?null:Date.now()+thinkMs();
 }
 async schedule(){const d=this.data;if(!d)return;const due=[d.deadline,d.botAt,d.nextHandAt,...d.members.map(m=>m?.disconnectedAt?m.disconnectedAt+45000:null)].filter((n):n is number=>n!==null);if(!d.state)due.push(d.updatedAt+600000);if(d.state?.winner!==null&&d.state?.winner!==undefined)due.push(d.updatedAt+30*86400000);if(due.length)await this.ctx.storage.setAlarm(Math.max(Date.now()+20,Math.min(...due)));else await this.ctx.storage.deleteAlarm();}
 alarm(){return this.serial(()=>this.onAlarm());}
 async onAlarm(){
  const d=this.data;if(!d)return;const now=Date.now();
  if(d.state?.winner!==null&&d.state?.winner!==undefined&&now-d.updatedAt>=30*86400000){for(const socket of this.ctx.getWebSockets())socket.close(1000,'Partida archivada');await this.ctx.storage.deleteAll();this.data=null;return;}
  if(!d.state&&now-d.updatedAt>=600000){for(const socket of this.ctx.getWebSockets())socket.close(1000,'Sala expirada');await this.ctx.storage.deleteAll();this.data=null;return;}
  for(const member of d.members){if(member?.disconnectedAt&&now-member.disconnectedAt>=45000){member.bot=true;member.disconnectedAt=null;}}
  const state=d.state;
  if(state&&state.winner===null){
   if(d.nextHandAt!==null&&d.nextHandAt<=now)await this.apply(0,{type:'NEXT_HAND'});
   else if(d.botAt!==null&&d.botAt<=now){const seat=order(state.mano,state.seats).find(i=>d.members[i]?.bot&&legalActions(state,i).length);if(seat!==undefined)await this.apply(seat,chooseAction(viewFor(state,seat),difficultyForMmr(d.members[seat]?.mmr??1000),Math.random,{partnerSignal:d.partnerSignals?.[seat]?.handNo===state.handNo?d.partnerSignals[seat].gesture:undefined}));else d.botAt=null;}
   else if(d.deadline!==null&&d.deadline<=now){const expired=timeout(state);await this.apply(expired.seat,expired.action);}
   else if(d.members.some(m=>m?.bot)&&d.botAt===null){const seat=order(state.mano,state.seats).find(i=>d.members[i]?.bot&&legalActions(state,i).length);if(seat!==undefined)d.botAt=now+thinkMs();}
  }
  await this.save();this.broadcast();await this.schedule();
 }
 webSocketClose(ws:WebSocket,code=1000,reason=''){try{ws.close([1005,1006,1015].includes(code)?1000:code,reason);}catch{/* A closed peer needs no additional acknowledgement. */}return this.serial(()=>this.onClose(ws));}
 async onClose(ws:WebSocket){
  if(!this.data)return;const a=ws.deserializeAttachment() as Attachment;const other=this.ctx.getWebSockets().some(s=>s!==ws&&(s.deserializeAttachment() as Attachment).profileId===a.profileId&&s.readyState===1);if(other)return;const member=this.data.members.find(m=>m?.id===a.profileId);if(member&&!member.originalBot&&!member.abandoned){member.disconnectedAt=Date.now();await this.save();this.broadcast();await this.schedule();}
 }
 async webSocketError(ws:WebSocket){await this.webSocketClose(ws);}
}
