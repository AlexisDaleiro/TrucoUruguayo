import {create} from 'zustand';
import type {PlayerView,Action} from '../../../../packages/engine/src/index';
import {acceptOnlineView,detachOnline} from '../state/game';
import {api,ensureSession,refreshProfile,type Profile} from './auth';
import {audio} from '../audio/AudioManager';
export interface Snapshot {type:'SNAPSHOT';roomSeq:number;code:string;seat:number;seats:2|4;host:boolean;private:boolean;environment:string|null;deadline:number|null;members:({nickname:string;character:'washington'|'marta';ready:boolean;connected:boolean}|null)[];view:PlayerView|null;}
interface SignalEvent {seat:number;gesture:string;at:number;id:number;}
interface OnlineStore {status:'idle'|'queued'|'connecting'|'lobby'|'playing'|'reconnecting'|'error';code:string|null;snapshot:Snapshot|null;profile:Profile|null;error:string|null;since:number;chat:{seat:number;phrase:number;at:number}|null;sena:SignalEvent|null;senas:SignalEvent[];}
export const useOnline=create<OnlineStore>(()=>({status:'idle',code:null,snapshot:null,profile:null,error:null,since:0,chat:null,sena:null,senas:[]}));
let generation=0,current:RoomConnection|null=null,queueTimer:ReturnType<typeof setTimeout>|undefined,ticket:string|null=null,signalId=0;
class RoomConnection {
 socket:WebSocket|null=null;closed=false;heartbeat:ReturnType<typeof setInterval>|undefined;reconnect:ReturnType<typeof setTimeout>|undefined;
 constructor(public code:string,public version:number){}
 connect(){if(this.closed||this.version!==generation)return;const url=new URL('/api/rooms/'+this.code+'/socket',location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';const ws=new WebSocket(url);this.socket=ws;
  ws.onopen=()=>{this.heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping');},20000);};
  ws.onmessage=e=>{if(this.closed||this.version!==generation)return;let message:Record<string,unknown>;try{message=JSON.parse(String(e.data));}catch{return;}
   if(message.type==='SNAPSHOT'){const snapshot=message as unknown as Snapshot;const previous=useOnline.getState().snapshot;useOnline.setState({snapshot,code:this.code,status:snapshot.view?'playing':'lobby',error:null});if(snapshot.view){acceptOnlineView(snapshot.view,action=>this.action(action),()=>disconnectOnline());if(snapshot.view.seq!==previous?.view?.seq)audio.play(snapshot.view.events.some(event=>event.type==='FLOR')?'flor':snapshot.view.events.some(event=>event.type==='PLAY_CARD')?'play':'button');if(!previous?.view||snapshot.view.winner!==null)void refreshProfile().then(profile=>useOnline.setState({profile}));}else detachOnline();}
   if(message.type==='CHAT'){useOnline.setState({chat:{seat:Number(message.seat),phrase:Number(message.phrase),at:Date.now()}});audio.play('chat');}
   if(message.type==='SENA'){const signal:SignalEvent={seat:Number(message.seat),gesture:String(message.gesture),at:Date.now(),id:++signalId};useOnline.setState(state=>({sena:signal,senas:[...state.senas.slice(-7),signal]}));audio.play('sena');}
   if(message.type==='ERROR'){if(message.code!=='STALE')useOnline.setState({error:String(message.code)});}
  };
  ws.onclose=e=>{clearInterval(this.heartbeat);if(this.closed||this.version!==generation)return;if(e.reason==='Nueva conexión'){useOnline.setState({status:'error',error:'SESSION_REPLACED'});return;}useOnline.setState({status:'reconnecting'});this.reconnect=setTimeout(()=>this.connect(),1200);};ws.onerror=()=>ws.close();
 }
 action(action:Action){const view=useOnline.getState().snapshot?.view;if(!view||this.socket?.readyState!==WebSocket.OPEN)return;this.socket.send(JSON.stringify({type:'ACTION',id:crypto.randomUUID(),seq:view.seq,action}));}
 send(value:unknown){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify(value));}
 close(){this.closed=true;clearInterval(this.heartbeat);clearTimeout(this.reconnect);this.socket?.close(1000,'Salida');}
}
export function disconnectOnline(){generation++;current?.close();current=null;clearTimeout(queueTimer);ticket=null;sessionStorage.removeItem('boliche_room_v1');useOnline.setState({status:'idle',code:null,snapshot:null,error:null,chat:null,sena:null,senas:[]});detachOnline();}
export async function joinRoom(code:string){const version=++generation;current?.close();clearTimeout(queueTimer);useOnline.setState({status:'connecting',error:null});try{const profile=await ensureSession();await api('/api/rooms/'+code+'/join',{});if(version!==generation)return;useOnline.setState({profile,code});sessionStorage.setItem('boliche_room_v1',code);current=new RoomConnection(code,version);current.connect();}catch(error){if(version===generation)useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}}
export async function createRoom(seats:2|4,targetScore:30|40,florEnabled:boolean){try{await ensureSession();const {code}=await api<{code:string}>('/api/rooms',{seats,targetScore,florEnabled});await joinRoom(code);history.replaceState(null,'','/sala/'+code);}catch(error){useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}}
export async function roomOperation(op:'ready'|'fill'|'abandon'|'rematch'|'seat',body:unknown={}){const code=useOnline.getState().code;if(!code)return;try{await api('/api/rooms/'+code+'/'+op,body);if(op==='abandon'){disconnectOnline();history.replaceState(null,'','/');}}catch(error){useOnline.setState({error:error instanceof Error?error.message:'SERVER'});}}
export async function searchMatch(seats:2|4){disconnectOnline();const version=generation;ticket=crypto.randomUUID();const id=ticket;useOnline.setState({status:'queued',since:Date.now(),error:null});try{const profile=await ensureSession();useOnline.setState({profile});const poll=async(op:'join'|'poll')=>{if(version!==generation)return;try{const result=await api<{code?:string}>('/api/queue',{op,ticket:id,seats});if(version!==generation)return;if(result.code)await joinRoom(result.code);else queueTimer=setTimeout(()=>void poll('poll'),700);}catch(error){useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}};await poll('join');}catch(error){useOnline.setState({status:'error',error:error instanceof Error?error.message:'SERVER'});}}
export async function cancelSearch(seats:2|4){const id=ticket;disconnectOnline();if(id){const result=await api<{code?:string}>('/api/queue',{op:'cancel',ticket:id,seats});if(result.code)await joinRoom(result.code);}}
export function sendChat(phrase:number){current?.send({type:'CHAT',phrase});}
export function sendSena(gesture:string){current?.send({type:'SENA',gesture});}
if(import.meta.env.DEV)Object.assign(window,{bolicheNetwork:{raw:(value:unknown)=>current?.send(value),cut:()=>current?.socket?.close(4000,'Corte de prueba'),events:()=>({chat:useOnline.getState().chat,sena:useOnline.getState().sena,senas:useOnline.getState().senas,error:useOnline.getState().error})}});
