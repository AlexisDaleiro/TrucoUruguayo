import {track} from '../telemetry';
import {create} from 'zustand';
import type {PlayerView,Action} from '../../../../packages/engine/src/index';
import {acceptOnlineView,detachOnline} from '../state/game';
import {api,ensureSession,refreshProfile,type Profile} from './auth';
import {audio} from '../audio/AudioManager';
export interface Snapshot {type:'SNAPSHOT';roomSeq:number;code:string;seat:number;seats:2|4;host:boolean;private:boolean;environment:string|null;deadline:number|null;aborted?:boolean;resultReady?:boolean;resultXp?:number|null;stats?:{tricks:[number,number];truco:[number,number];tantos:[number,number]}|null;members:({nickname:string;character:'washington'|'marta';characterVariant?:string;ready:boolean;connected:boolean}|null)[];view:PlayerView|null;}
interface SignalEvent {seat:number;gesture:string;at:number;id:number;}
interface OnlineStore {status:'idle'|'queued'|'connecting'|'lobby'|'playing'|'reconnecting'|'error';code:string|null;snapshot:Snapshot|null;profile:Profile|null;error:string|null;since:number;chat:{seat:number;phrase:number;at:number}|null;sena:SignalEvent|null;senas:SignalEvent[];}
export const useOnline=create<OnlineStore>(()=>({status:'idle',code:null,snapshot:null,profile:null,error:null,since:0,chat:null,sena:null,senas:[]}));
const queueKey='boliche_queue_v1';
let generation=0,current:RoomConnection|null=null,queueTimer:ReturnType<typeof setTimeout>|undefined,ticket:string|null=null,signalId=0;
class RoomConnection {
 socket:WebSocket|null=null;closed=false;heartbeat:ReturnType<typeof setInterval>|undefined;reconnect:ReturnType<typeof setTimeout>|undefined;
 constructor(public code:string,public version:number){}
 async connect(){
  if(this.closed||this.version!==generation)return;
  let token:string;
  try{({token}=await api<{token:string}>('/api/rooms/'+this.code+'/socket-ticket',{}));}
  catch(error){
   if(this.closed||this.version!==generation)return;
   if(error instanceof Error&&['AUTH','FORBIDDEN','NOT_FOUND'].includes(error.message)){useOnline.setState({status:'error',error:error.message});return;}
   useOnline.setState({status:'reconnecting'});this.reconnect=setTimeout(()=>void this.connect(),1200);return;
  }
  if(this.closed||this.version!==generation)return;
  const url=new URL('/api/rooms/'+this.code+'/socket',location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  const ws=new WebSocket(url,['boliche.v1','boliche-ticket.'+token]);this.socket=ws;
  ws.onopen=()=>{this.heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping');},20000);};
  ws.onmessage=e=>{if(this.closed||this.version!==generation)return;let message:Record<string,unknown>;try{message=JSON.parse(String(e.data));}catch{return;}
   if(message.type==='SNAPSHOT'){const snapshot=message as unknown as Snapshot;const previous=useOnline.getState().snapshot;useOnline.setState({snapshot,code:this.code,status:snapshot.view?'playing':'lobby',error:null});if(snapshot.view){if(!previous?.view)track('match_start',{mode:snapshot.seats,online:true});if(snapshot.view.winner!==null&&previous?.view?.winner===null)track('match_end',{mode:snapshot.seats,online:true,won:snapshot.view.winner===snapshot.seat%2});acceptOnlineView(snapshot.view,action=>this.action(action),()=>disconnectOnline());if(snapshot.view.seq!==previous?.view?.seq)audio.play(snapshot.view.events.some(event=>event.type==='FLOR')?'flor':snapshot.view.events.some(event=>event.type==='PLAY_CARD')?'play':'button');if(!previous?.view||snapshot.view.winner!==null)void refreshProfile().then(profile=>useOnline.setState({profile})).catch(()=>{});}else detachOnline();}
   if(message.type==='CHAT'){useOnline.setState({chat:{seat:Number(message.seat),phrase:Number(message.phrase),at:Date.now()}});audio.play('chat');}
   if(message.type==='SENA'){const signal:SignalEvent={seat:Number(message.seat),gesture:String(message.gesture),at:Date.now(),id:++signalId};useOnline.setState(state=>({sena:signal,senas:[...state.senas.slice(-7),signal]}));audio.play('sena');}
   if(message.type==='ERROR'){if(message.code!=='STALE')useOnline.setState({error:String(message.code)});}
  };
  ws.onclose=e=>{clearInterval(this.heartbeat);if(this.closed||this.version!==generation)return;if(e.reason==='Nueva conexión'){useOnline.setState({status:'error',error:'SESSION_REPLACED'});return;}track('reconnect');useOnline.setState({status:'reconnecting'});this.reconnect=setTimeout(()=>this.connect(),1200);};ws.onerror=()=>ws.close();
 }
 action(action:Action){const view=useOnline.getState().snapshot?.view;if(!view||this.socket?.readyState!==WebSocket.OPEN)return;this.socket.send(JSON.stringify({type:'ACTION',id:crypto.randomUUID(),seq:view.seq,action}));}
 send(value:unknown){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(value));}
 close(){this.closed=true;clearInterval(this.heartbeat);clearTimeout(this.reconnect);this.socket?.close(1000,'Salida');}
}
export function disconnectOnline(keepResume=false){generation++;current?.close();current=null;clearTimeout(queueTimer);ticket=null;if(!keepResume){sessionStorage.removeItem('boliche_room_v1');sessionStorage.removeItem(queueKey);}useOnline.setState({status:'idle',code:null,snapshot:null,error:null,chat:null,sena:null,senas:[]});detachOnline();}
export async function joinRoom(code:string){const version=++generation;current?.close();clearTimeout(queueTimer);useOnline.setState({status:'connecting',error:null});try{const profile=await ensureSession();await api('/api/rooms/'+code+'/join',{});if(version!==generation)return;useOnline.setState({profile,code});sessionStorage.removeItem(queueKey);ticket=null;sessionStorage.setItem('boliche_room_v1',code);current=new RoomConnection(code,version);current.connect();}catch(error){if(version===generation)useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}}
export async function createRoom(seats:2|4,targetScore:30|40,florEnabled:boolean,environment?:'galpon'|'boliche'){try{await ensureSession();const {code}=await api<{code:string}>('/api/rooms',{seats,targetScore,florEnabled,environment});await joinRoom(code);history.replaceState(null,'','/sala/'+code);}catch(error){useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}}
export async function roomOperation(op:'ready'|'fill'|'abandon'|'rematch'|'seat',body:unknown={}){const code=useOnline.getState().code;if(!code)return;try{await api('/api/rooms/'+code+'/'+op,body);if(op==='abandon'){disconnectOnline();history.replaceState(null,'','/');}}catch(error){useOnline.setState({error:error instanceof Error?error.message:'SERVER'});}}
type QueueTicket={id:string;seats:2|4;at:number;cancel?:true};
function queueTicket():QueueTicket|null{
 try{const saved=JSON.parse(sessionStorage.getItem(queueKey)??'null') as QueueTicket|null;
  return saved&&Date.now()-saved.at<30*60*1000?saved:null;
 }catch{return null;}
}
export function resumeSearch(){const saved=queueTicket();if(saved&&useOnline.getState().status==='idle')void runQueue(saved);}
async function runQueue(saved:QueueTicket){
 const version=++generation;clearTimeout(queueTimer);ticket=saved.id;
 sessionStorage.setItem(queueKey,JSON.stringify(saved));
 useOnline.setState({status:'queued',since:saved.at,error:null});
 const poll=async(op:'join'|'poll'|'cancel')=>{
  if(version!==generation)return;
  try{
   const profile=await ensureSession();if(version!==generation)return;useOnline.setState({profile});
   const result=await api<{code?:string;queued?:boolean}>('/api/queue',{op,ticket:saved.id,seats:saved.seats});
   if(version!==generation)return;
   if(result.code){await joinRoom(result.code);return;}
   if(result.queued===false){sessionStorage.removeItem(queueKey);ticket=null;useOnline.setState({status:'idle'});return;}
   queueTimer=setTimeout(()=>void poll(saved.cancel?'cancel':'poll'),700);
  }catch(error){
   if(version!==generation)return;
   if(error instanceof TypeError||!navigator.onLine){queueTimer=setTimeout(()=>void poll(op),1800);return;}
   sessionStorage.removeItem(queueKey);ticket=null;useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});
  }
 };
 await poll(saved.cancel?'cancel':'join');
}
export async function searchMatch(seats:2|4){
 disconnectOnline();await runQueue({id:crypto.randomUUID(),seats,at:Date.now()});
}
export async function cancelSearch(){
 const saved=queueTicket();if(saved&&ticket===saved.id)await runQueue({...saved,cancel:true});
}
export function sendChat(phrase:number){current?.send({type:'CHAT',phrase});}
export function sendSena(gesture:string){current?.send({type:'SENA',gesture});}
if(import.meta.env.DEV)Object.assign(window,{bolicheNetwork:{raw:(value:unknown)=>current?.send(value),cut:()=>current?.socket?.close(4000,'Corte de prueba'),events:()=>({chat:useOnline.getState().chat,sena:useOnline.getState().sena,senas:useOnline.getState().senas,error:useOnline.getState().error})}});
