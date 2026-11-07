import {hapticCue} from '../platform';
import {create} from 'zustand';
import {act,legalActions,newMatch,shuffledDeck,timeout,viewFor,type State,type PlayerView,type Action} from '../../../../packages/engine/src/index';
import {thinkMs} from '../../../../packages/bots/src/timing';
import {audio} from '../audio/AudioManager';
import {tutorialState} from '../../../../packages/shared/src/tutorial';
import {usePreferences,setPreferences} from './preferences';
import {track} from '../telemetry';
interface GameStore {state:State|null;view:PlayerView|null;playing:boolean;fast:boolean;reduced:boolean;start:(seats?:2|4)=>void;send:(action:Action)=>void;stop:()=>void;setFast:(fast:boolean)=>void;setReduced:(reduced:boolean)=>void;}
let botTimer:ReturnType<typeof setTimeout>|undefined,turnTimer:ReturnType<typeof setTimeout>|undefined;
let onlineSender:((action:Action)=>void)|null=null,onlineClose:(()=>void)|null=null;
let practiceWorker:Worker|undefined,practiceRequest=0;
let reply:((action:Action)=>void)|null=null;
function askBot(state:State,seat:number){
 const view=viewFor(state,seat);
 const fallback=()=>{const action=view.legal.find(action=>action.type==='PLAY_CARD'||action.type==='QUIERO')??view.legal[0];if(action&&useGame.getState().state===state)apply(seat,action);};
 try{
  if(!practiceWorker){practiceWorker=new Worker(new URL('./practice.worker.ts',import.meta.url),{type:'module'});practiceWorker.onmessage=(event:MessageEvent<{id:number;action:Action}>)=>{if(event.data.id===practiceRequest){const handle=reply;reply=null;handle?.(event.data.action);}};practiceWorker.onerror=()=>{practiceWorker?.terminate();practiceWorker=undefined;const handle=reply;reply=null;if(handle)handle({type:'NEXT_HAND'});};}
  const id=++practiceRequest;reply=action=>{if(useGame.getState().state!==state)return;if(action.type==='NEXT_HAND'&&state.handWinner===null)fallback();else apply(seat,action);};
  practiceWorker.postMessage({id,view,partnerSignal:seat===2?localPartnerSignal:undefined});
 }catch{fallback();}
}
let localPartnerSignal:string|undefined,lastLocalSignal=0;
let tutorialMode=false,testingFast=false;
export function startTutorial(step:number){tutorialMode=true;cancel();const state=tutorialState(step);useGame.setState({state,view:viewFor(state,0),playing:true});audio.play('deal');}
export function tutorialAction(action:Action){if(!tutorialMode)return;apply(0,action);const state=useGame.getState().state;if(state?.pending){const responder=Array.from({length:state.seats},(_,seat)=>seat).find(seat=>seat!==0&&legalActions(state,seat).some(action=>action.type==='QUIERO'));if(responder!==undefined)apply(responder,{type:'QUIERO'});}}
export function sendLocalSignal(gesture:string){const state=useGame.getState().state;if(!state||state.seats!==4||Date.now()-lastLocalSignal<1500)return false;localPartnerSignal=gesture;lastLocalSignal=Date.now();audio.play('sena');return true;}
function cancel(){clearTimeout(botTimer);clearTimeout(turnTimer);practiceRequest++;reply=null;}
export const useGame=create<GameStore>((set,get)=>({
 state:null,view:null,playing:false,fast:usePreferences.getState().fast,reduced:usePreferences.getState().reduced,
 start:(seats=2)=>{tutorialMode=false;onlineClose?.();onlineSender=null;onlineClose=null;localPartnerSignal=undefined;lastLocalSignal=0;cancel();const state=newMatch(seats,shuffledDeck());set({state,view:viewFor(state,0),playing:true});audio.play('shuffle');track('match_start',{mode:seats,online:false});schedule();},
 send:action=>{if(onlineSender){onlineSender(action);return;}const state=get().state;if(!state)return;apply(0,action);},
 stop:()=>{tutorialMode=false;onlineClose?.();onlineSender=null;onlineClose=null;cancel();set({state:null,view:null,playing:false});},
 setFast:fast=>{setPreferences({fast});set({fast});},setReduced:reduced=>{setPreferences({reduced});set({reduced});}
}));
function apply(seat:number,action:Action){
 const s=useGame.getState().state;if(!s)return;
 if(!legalActions(s,seat).some(a=>JSON.stringify(a)===JSON.stringify(action)))return;
 if(seat===0&&usePreferences.getState().haptics&&action.type==='PLAY_CARD')hapticCue();
 const next=act(s,seat,action,action.type==='NEXT_HAND'?shuffledDeck():undefined);if(action.type==='NEXT_HAND')localPartnerSignal=undefined;useGame.setState({state:next,view:viewFor(next,0)});
 audio.play(action.type==='PLAY_CARD'?'play':action.type==='NEXT_HAND'?'deal':action.type==='ENVIDO'?'envido':'truco',seat===1?.4:0);
 if(next.winner!==null){audio.play(next.winner===0?'victory':'defeat');if(!tutorialMode)track('match_end',{mode:next.seats,online:false,won:next.winner===0});}else if(next.events.some(e=>e.type==='FLOR'))audio.play('flor');
 if(!tutorialMode)schedule();
}
function schedule(){
 cancel();const {state}=useGame.getState();if(!state||state.winner!==null)return;
 // A human always gets a chance to answer before a bot teammate.
 if(!legalActions(state,0).length){const seat=Array.from({length:state.seats},(_,i)=>i).find(i=>legalActions(state,i).length);if(seat!==undefined)botTimer=setTimeout(()=>{const s=useGame.getState().state;if(s)askBot(s,seat);},import.meta.env.DEV&&testingFast?40:thinkMs(Math.random,Boolean(state.pending&&state.pending.kind!=='florChoose')));}
 if(state.handWinner===null)turnTimer=setTimeout(()=>{const s=useGame.getState().state;if(s&&s.handWinner===null&&s.winner===null){const expired=timeout(s);apply(expired.seat,expired.action);}},state.config.turnSeconds*1000);
}
if(import.meta.env.DEV){Object.assign(window,{bolicheDebug:{view:()=>useGame.getState().view,fast:()=>{testingFast=true;useGame.getState().setFast(true);}}});}
export function acceptOnlineView(view:PlayerView,sender:(action:Action)=>void,close:()=>void){cancel();onlineSender=sender;onlineClose=close;useGame.setState({state:null,view,playing:true});}
export function detachOnline(){onlineSender=null;onlineClose=null;cancel();useGame.setState({state:null,view:null,playing:false});}
