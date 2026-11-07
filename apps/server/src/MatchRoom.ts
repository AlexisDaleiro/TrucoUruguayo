import {DurableObject} from 'cloudflare:workers';
import {act,legalActions,newMatch,order,team,timeout,viewFor,type Action,type Card} from '../../../packages/engine/src/index';
import {chooseAction,thinkMs,nicknames,difficultyForMmr} from '../../../packages/bots/src/index';
import {intentSchema,MAX_MESSAGE_BYTES,CHAT_COOLDOWN_MS} from '../../../packages/protocol/src/index';
import {type Env,type RoomData,type Attachment,type Member,type Profile} from './types';
import {accountCall} from './Accounts';
import {secureDeal} from './random';
import {signalFor} from '../../../packages/engine/src/senas';
import {matchXp} from '../../../packages/shared/src/economy';
export class MatchRoom extends DurableObject<Env>{
 data:RoomData|null=null;
 locked:Promise<unknown>=Promise.resolve();
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','{"type":"PONG"}'));ctx.blockConcurrencyWhile(async()=>{this.data=await ctx.storage.get<RoomData>('room')??null;if(this.data?.state?.winner!==null&&this.data?.state?.winner!==undefined)this.data.endedAt??=this.data.updatedAt;if(this.data?.entryReserved&&!this.data.state){this.data.refundPending=true;this.data.aborted=true;await this.save();}if(this.data&&(this.data.refundPending||this.data.resultPending||this.data.state?.winner!==null&&this.data.state?.winner!==undefined&&!this.data.finished))await ctx.storage.setAlarm(Date.now()+1000);});}
 async save(){if(this.data)await this.ctx.storage.put('room',this.data);}
 serial<T>(fn:()=>Promise<T>):Promise<T>{const next=this.locked.then(fn);this.locked=next.catch(()=>{});return next;}
 fetch(request:Request):Promise<Response>{return this.serial(()=>this.handle(request)).catch(error=>{const code=error instanceof Error&&['BALANCE','PROFILE','SERVER_ABORT'].includes(error.message)?error.message:'SERVER';return Response.json({error:code},{status:code==='SERVER'?500:409});});}
 async handle(request:Request):Promise<Response>{
  const url=new URL(request.url);const op=url.pathname.slice(1);const profileId=request.headers.get('x-profile-id')??'';
  if(op==='socket'){
   const token=request.headers.get('x-boliche-ticket');
   if(!token)return this.connectSocket(request,profileId);
   const key='socket-ticket:'+token[0];
   const ticket=await this.ctx.storage.get<{token:string;id:string;expires:number}>(key);
   if(!ticket||ticket.token!==token||ticket.expires<=Date.now())return Response.json({error:'AUTH'},{status:401});
   await this.ctx.storage.delete(key);
   return this.connectSocket(request,ticket.id,'boliche.v1');
  }
  const body=await request.json() as {id?:string;code?:string;initRef?:string;host?:Profile;seats?:2|4;targetScore?:30|40;florEnabled?:boolean;environment?:string;members?:Profile[];profile?:Profile;seat?:number;from?:number;to?:number};
  if(op==='init'){
   if(this.data){
    if(!body.initRef||body.initRef!==this.data.initRef)return Response.json({error:'EXISTS'},{status:409});
    if(this.data.aborted)return Response.json({error:'SERVER_ABORT'},{status:409});
    if(!this.data.state)await this.fill();
    await this.schedule();
    return Response.json({code:this.data.code});
   }
   const profiles=body.members??[body.host!];
   if(!profiles.length||new Set(profiles.map(profile=>profile.id)).size!==profiles.length)return Response.json({error:'PROFILE'},{status:409});
   this.data={code:body.code!,initRef:body.initRef,matchId:crypto.randomUUID(),host:profiles[0].id,seats:body.seats!,rules:{targetScore:body.targetScore??30,florEnabled:body.florEnabled??true},members:Array.from({length:body.seats!},(_,i)=>profiles[i]?this.member(profiles[i]):null),state:null,hasBots:false,private:!body.members,environment:body.environment??null,createdAt:Date.now(),updatedAt:Date.now(),deadline:null,botAt:null,nextHandAt:null,roomSeq:0,finished:false};
   if(body.members){for(const member of this.data.members)if(member)member.ready=true;await this.fill();}
   await this.save();await this.schedule();return Response.json({code:this.data.code});
  }
  const d=this.data;if(!d)return Response.json({error:'NOT_FOUND'},{status:404});
  if(op==='forget'){const forgotten=d.members.findIndex(member=>member?.id===body.id);if(forgotten>=0){for(const socket of this.ctx.getWebSockets())if((socket.deserializeAttachment() as Attachment).profileId===body.id)socket.close(1000,'Cuenta eliminada');if(d.state){const member=d.members[forgotten]!;member.id='deleted:'+crypto.randomUUID();member.nickname='Cuenta eliminada';member.abandoned=true;member.bot=true;member.originalBot=true;member.disconnectedAt=null;}else d.members[forgotten]=null;if(d.host===body.id)d.host=d.members.find(member=>member&&!member.originalBot)?.id??'';if(d.bonuses)delete d.bonuses[body.id!];if(d.resultPending){d.resultPending.members=d.resultPending.members.map(member=>member.id===body.id?{...member,id:'deleted:'+crypto.randomUUID(),originalBot:true}:member);delete d.resultPending.bonuses[body.id!];}await this.resetDecision();await this.save();this.broadcast();await this.schedule();}return Response.json({ok:true});}
  if(op==='abort'){if(d.firstHandFinished)return Response.json({error:'FIRST_HAND_FINISHED'},{status:409});d.aborted=true;d.refundPending=Boolean(d.entryReserved);d.deadline=null;d.botAt=null;d.nextHandAt=null;await this.save();await this.flushOutbox();this.broadcast();await this.schedule();return Response.json({ok:true});}
  if(op==='join'){
   const profile=body.profile!;let seat=d.members.findIndex(m=>m?.id===profile.id);
   if(seat<0){if(d.state)return Response.json({error:'STARTED'},{status:409});seat=d.members.findIndex(m=>m===null);if(seat<0)return Response.json({error:'FULL'},{status:409});d.members[seat]=this.member(profile);}
   if(!d.host)d.host=profile.id;await accountCall(this.env,{op:'registerRoom',id:profile.id,code:d.code});d.updatedAt=Date.now();d.roomSeq++;await this.save();this.broadcast();await this.schedule();return Response.json({seat});
  }
  const seat=d.members.findIndex(m=>m?.id===profileId);if(seat<0)return Response.json({error:'FORBIDDEN'},{status:403});
  if(op==='socket-ticket'){
   const token=seat+'.'+crypto.randomUUID();
   await this.ctx.storage.put('socket-ticket:'+seat,{token,id:profileId,expires:Date.now()+20000});
   return Response.json({token},{headers:{'Cache-Control':'no-store'}});
  }
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
   await this.flushOutbox();if(d.resultPending||d.refundPending)return Response.json({error:'RESULT_PENDING'},{status:409});
   if(!d.private||d.state?.winner===null||!d.state)return Response.json({error:'FORBIDDEN'},{status:403});d.state=null;d.matchId=crypto.randomUUID();d.deadline=null;d.botAt=null;d.nextHandAt=null;d.finished=false;
   d.hasBots=d.members.some(member=>member?.originalBot);d.entryReserved=false;d.endedAt=undefined;d.firstHandFinished=false;d.bonuses={};d.stats={tricks:[0,0],truco:[0,0],tantos:[0,0]};d.aborted=false;for(const member of d.members)if(member){member.ready=member.originalBot;member.abandoned=false;member.returning=false;member.bot=member.originalBot;}
   d.members[seat]!.ready=true;d.roomSeq++;await this.save();this.broadcast();await this.schedule();return Response.json({ok:true});
  }
  if(op==='snapshot')return Response.json(this.snapshot(seat));
  return Response.json({error:'UNKNOWN'},{status:400});
 }
 member(profile:Profile):Member{return {id:profile.id,nickname:profile.nickname,character:profile.character,characterVariant:profile.loadout.characterVariant??'base',mmr:profile.mmr,ready:false,bot:false,originalBot:false,disconnectedAt:null,returning:false,abandoned:false};}
 async fill(){const d=this.data!;for(let i=0;i<d.seats;i++)if(!d.members[i]){d.members[i]={id:'bot:'+crypto.randomUUID(),nickname:nicknames[Math.floor(Math.random()*nicknames.length)],character:i%2?'washington':'marta',mmr:d.members.find(m=>m&&!m.originalBot)?.mmr??1000,ready:true,bot:true,originalBot:true,disconnectedAt:null,returning:false,abandoned:false};d.hasBots=true;}if(d.members.every(m=>m?.ready))await this.start();}
 async start(){
  const d=this.data!;if(d.aborted||d.refundPending)throw Error('SERVER_ABORT');if(d.state||d.members.some(m=>!m?.ready))return;
  const audit=secureDeal();const state=newMatch(d.seats,audit.order,d.rules);
  const humans=d.members.filter(m=>!m!.originalBot).map(m=>m!);for(const member of humans){const profile=await accountCall<Profile|null>(this.env,{op:'profile',id:member.id});if(!profile)throw Error('PROFILE');member.mmr=profile.mmr;member.character=profile.character;member.characterVariant=profile.loadout.characterVariant??'base';await accountCall(this.env,{op:'registerRoom',id:member.id,code:d.code});}
  d.entryReserved=true;d.entryIds=humans.map(member=>member.id);d.firstHandFinished=false;d.bonuses={};d.stats={tricks:[0,0],truco:[0,0],tantos:[0,0]};await this.save();await this.ctx.storage.setAlarm(Date.now()+5000);
  try{await accountCall(this.env,{op:'reserve',ids:humans.map(m=>m.id),ref:d.matchId});d.state=state;d.updatedAt=Date.now();await this.resetDecision();await this.ctx.storage.transaction(async tx=>{await tx.put('audit:1',audit);await tx.put('room',d);});}
  catch(error){d.state=null;d.refundPending=true;d.aborted=true;await this.save();await this.flushOutbox();await this.schedule();throw error;}
 }
 earnedXp(seat:number){const d=this.data!,member=d.members[seat]!,won=!member.abandoned&&team(seat)===d.state?.winner,bonus=d.bonuses?.[member.id];return matchXp(won,won?bonus?.flor??0:0,won?bonus?.truco??0:0);}
 snapshot(seat:number){const d=this.data!;return {type:'SNAPSHOT',roomSeq:d.roomSeq,code:d.code,seat,seats:d.seats,host:d.members[seat]?.id===d.host,private:d.private,environment:d.environment,deadline:d.deadline,aborted:d.aborted??false,resultReady:d.finished,stats:d.stats??null,resultXp:d.finished?this.earnedXp(seat):null,members:d.members.map(m=>m?{nickname:m.nickname,character:m.character,characterVariant:m.characterVariant??'base',ready:m.ready,connected:m.bot||m.disconnectedAt===null}:null),view:d.state?viewFor(d.state,seat):null};}
 send(ws:WebSocket,value:unknown){try{ws.send(JSON.stringify(value));}catch{/* Close event handles disconnected state. */}}
 broadcast(){if(!this.data)return;for(const socket of this.ctx.getWebSockets()){const a=socket.deserializeAttachment() as Attachment;const seat=this.data.members.findIndex(m=>m?.id===a.profileId);if(seat>=0){a.seat=seat;socket.serializeAttachment(a);this.send(socket,this.snapshot(seat));if(this.data.seats===4&&this.data.state&&a.signaledHand!==this.data.state.handNo){for(let i=0;i<this.data.seats;i++){if(!this.data.members[i]?.bot)continue;this.send(socket,{type:'SENA',seat:i,gesture:team(i)===team(seat)?signalFor(this.data.state.original[i],this.data.state.sample):'tic'});}a.signaledHand=this.data.state.handNo;socket.serializeAttachment(a);}}}}
 async connectSocket(request:Request,profileId:string,protocol?:string):Promise<Response>{
  const d=this.data;if(!d)return Response.json({error:'NOT_FOUND'},{status:404});if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});const seat=d.members.findIndex(m=>m?.id===profileId);if(seat<0)return Response.json({error:'FORBIDDEN'},{status:403});
  const pair=new WebSocketPair();const [client,server]=Object.values(pair);const member=d.members[seat]!;
  if(member.abandoned)return Response.json({error:'ABANDONED'},{status:403});
  for(const old of this.ctx.getWebSockets()){const a=old.deserializeAttachment() as Attachment;if(a.profileId===profileId)old.close(1000,'Nueva conexión');}
  const attachment:Attachment={profileId,seat,windowStart:Date.now(),messages:0,lastChat:0,lastSena:0};server.serializeAttachment(attachment);this.ctx.acceptWebSocket(server);member.disconnectedAt=null;
  if(member.bot&&!member.originalBot){if(d.state&&legalActions(d.state,seat).length)member.bot=false;else member.returning=true;}
  d.updatedAt=Date.now();await this.save();this.broadcast();await this.schedule();return new Response(null,{status:101,webSocket:client,headers:protocol?{'Sec-WebSocket-Protocol':protocol}:undefined});
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
  const d=this.data!,state=d.state!;if(d.aborted)throw Error('ABORTED');const audit=action.type==='NEXT_HAND'?secureDeal():undefined;const cards:Card[]|undefined=audit?.order;const next=act(state,seat,action,cards);
  const previous=structuredClone(d);d.state=next;if(action.type==='NEXT_HAND')d.partnerSignals={};d.roomSeq++;d.updatedAt=Date.now();
  for(const member of d.members)if(member?.returning){member.bot=false;member.returning=false;}
  d.firstHandFinished ||=next.handWinner!==null||next.winner!==null;if(next.winner!==null)d.endedAt??=d.updatedAt;d.stats??={tricks:[0,0],truco:[0,0],tantos:[0,0]};d.bonuses??={};for(const event of next.events){if(event.type==='TRICK'&&event.seat!==undefined)d.stats.tricks[event.seat]++;if(event.type==='HAND_END'&&event.seat!==undefined&&next.value>=2){d.stats.truco[event.seat]++;for(const member of d.members)if(member&&!member.originalBot&&team(d.members.indexOf(member))===event.seat){d.bonuses[member.id]??={flor:0,truco:0};d.bonuses[member.id].truco++;}}if(event.type==='POINTS'&&event.seat!==undefined&&(state.pending?.kind==='envido'||['resto','florChoose','florConfirm'].includes(state.pending?.kind??'')||next.events.some(event=>event.type==='FLOR'))){d.stats.tantos[event.seat]++;if(next.events.some(event=>event.type==='FLOR')||['resto','florChoose','florConfirm'].includes(state.pending?.kind??''))for(const [index,member]of d.members.entries())if(member&&!member.originalBot&&team(index)===event.seat){d.bonuses[member.id]??={flor:0,truco:0};d.bonuses[member.id].flor++;}}}
  await this.resetDecision();try{await this.ctx.storage.transaction(async tx=>{if(audit)await tx.put('audit:'+next.handNo,audit);await tx.put('log:'+next.seq,{seat,action,at:Date.now()});await tx.put('room',d);});}catch(error){this.data=previous;throw error;}await this.flushOutbox();
 }
 async flushOutbox(){const d=this.data!;
  if(d.refundPending){try{await accountCall(this.env,{op:'refund',ids:d.entryIds??d.members.filter(member=>member&&!member.originalBot).map(member=>member!.id),ref:d.matchId});d.refundPending=false;d.entryReserved=false;try{await this.save();}catch(error){d.refundPending=true;d.entryReserved=true;throw error;}}catch{await this.schedule();return;}}
  if(d.state?.winner!==null&&d.state?.winner!==undefined&&!d.finished&&!d.aborted){d.resultPending??={ref:d.matchId,at:d.endedAt??d.updatedAt,hasBots:d.hasBots,winner:d.state.winner,members:d.members.map((member,seat)=>({id:member!.id,seat,originalBot:member!.originalBot,abandoned:member!.abandoned,mmr:member!.mmr??1000})),bonuses:d.bonuses??{}};await this.save();}
  if(d.resultPending){const pending=d.resultPending;try{await accountCall(this.env,{op:'result',result:pending});d.finished=true;d.resultPending=undefined;try{await this.save();}catch(error){d.finished=false;d.resultPending=pending;throw error;}}catch{await this.schedule();}}
 }
 async resetDecision(){const d=this.data!;const s=d.state;if(d.aborted||!s||s.winner!==null){d.deadline=null;d.botAt=null;d.nextHandAt=null;return;}
  if(s.handWinner!==null){d.deadline=null;d.botAt=null;d.nextHandAt=Date.now()+2200;return;}
  if(s.seats===4){d.partnerSignals??={};for(let i=0;i<s.seats;i++)if(d.members[i]?.bot)d.partnerSignals[(i+2)%4]={gesture:signalFor(s.original[i],s.sample),handNo:s.handNo};}
  d.nextHandAt=null;d.deadline=Date.now()+s.config.turnSeconds*1000;const bot=order(s.mano,s.seats).find(i=>d.members[i]?.bot&&legalActions(s,i).length);d.botAt=bot===undefined?null:Date.now()+thinkMs(Math.random,Boolean(s.pending));
 }
 async schedule(){const d=this.data;if(!d)return;const due=[d.resultPending||d.refundPending?Date.now()+5000:null,d.deadline,d.botAt,d.nextHandAt,...d.members.map(m=>m?.disconnectedAt?m.disconnectedAt+45000:null)].filter((n):n is number=>n!==null);if(!d.state)due.push(d.updatedAt+600000);if(d.state?.winner!==null&&d.state?.winner!==undefined)due.push((d.endedAt??d.updatedAt)+30*86400000);if(due.length)await this.ctx.storage.setAlarm(Math.max(Date.now()+20,Math.min(...due)));else await this.ctx.storage.deleteAlarm();}
 alarm(){return this.serial(()=>this.onAlarm());}
 async onAlarm(){
  const d=this.data;if(!d)return;const now=Date.now();
  if(d.state?.winner!==null&&d.state?.winner!==undefined&&now-(d.endedAt??d.updatedAt)>=30*86400000){for(const socket of this.ctx.getWebSockets())socket.close(1000,'Partida archivada');await this.ctx.storage.deleteAll();this.data=null;return;}
  if(!d.state&&now-d.updatedAt>=600000){for(const socket of this.ctx.getWebSockets())socket.close(1000,'Sala expirada');await this.ctx.storage.deleteAll();this.data=null;return;}
  for(const member of d.members){if(member?.disconnectedAt&&now-member.disconnectedAt>=45000){member.bot=true;member.disconnectedAt=null;}}
  await this.flushOutbox();const state=d.state;
  if(!d.aborted&&state&&state.winner===null){
   if(d.nextHandAt!==null&&d.nextHandAt<=now)await this.apply(0,{type:'NEXT_HAND'});
   else if(d.botAt!==null&&d.botAt<=now){const seat=order(state.mano,state.seats).find(i=>d.members[i]?.bot&&legalActions(state,i).length);if(seat!==undefined)await this.apply(seat,chooseAction(viewFor(state,seat),difficultyForMmr(d.members[seat]?.mmr??1000),Math.random,{partnerSignal:d.partnerSignals?.[seat]?.handNo===state.handNo?d.partnerSignals[seat].gesture:undefined}));else d.botAt=null;}
   else if(d.deadline!==null&&d.deadline<=now){const expired=timeout(state);await this.apply(expired.seat,expired.action);}
   else if(d.members.some(m=>m?.bot)&&d.botAt===null){const seat=order(state.mano,state.seats).find(i=>d.members[i]?.bot&&legalActions(state,i).length);if(seat!==undefined)d.botAt=now+thinkMs(Math.random,Boolean(state.pending));}
  }
  await this.save();this.broadcast();await this.schedule();
 }
 webSocketClose(ws:WebSocket,code=1000,reason=''){try{ws.close([1005,1006,1015].includes(code)?1000:code,reason);}catch{/* A closed peer needs no additional acknowledgement. */}return this.serial(()=>this.onClose(ws));}
 async onClose(ws:WebSocket){
  if(!this.data)return;const a=ws.deserializeAttachment() as Attachment;const other=this.ctx.getWebSockets().some(s=>s!==ws&&(s.deserializeAttachment() as Attachment).profileId===a.profileId&&s.readyState===1);if(other)return;const member=this.data.members.find(m=>m?.id===a.profileId);if(member&&!member.originalBot&&!member.abandoned){member.disconnectedAt=Date.now();await this.save();this.broadcast();await this.schedule();}
 }
 async webSocketError(ws:WebSocket){await this.webSocketClose(ws);}
}
