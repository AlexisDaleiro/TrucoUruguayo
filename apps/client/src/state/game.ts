import {create} from 'zustand';
import {act,legalActions,newMatch,shuffledDeck,timeout,viewFor,type State,type PlayerView,type Action} from '../../../../packages/engine/src/index';
import {chooseAction,thinkMs} from '../../../../packages/bots/src/index';
import {audio} from '../audio/AudioManager';
interface GameStore {state:State|null;view:PlayerView|null;playing:boolean;fast:boolean;reduced:boolean;start:(seats?:2|4)=>void;send:(action:Action)=>void;stop:()=>void;setFast:(fast:boolean)=>void;setReduced:(reduced:boolean)=>void;}
let botTimer:ReturnType<typeof setTimeout>|undefined,turnTimer:ReturnType<typeof setTimeout>|undefined;
let onlineSender:((action:Action)=>void)|null=null,onlineClose:(()=>void)|null=null;
let localPartnerSignal:string|undefined,lastLocalSignal=0;
export function sendLocalSignal(gesture:string){const state=useGame.getState().state;if(!state||state.seats!==4||Date.now()-lastLocalSignal<1500)return false;localPartnerSignal=gesture;lastLocalSignal=Date.now();audio.play('sena');return true;}
function cancel(){clearTimeout(botTimer);clearTimeout(turnTimer);}
export const useGame=create<GameStore>((set,get)=>({
 state:null,view:null,playing:false,fast:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
 start:(seats=2)=>{onlineClose?.();onlineSender=null;onlineClose=null;localPartnerSignal=undefined;lastLocalSignal=0;cancel();const state=newMatch(seats,shuffledDeck());set({state,view:viewFor(state,0),playing:true});audio.play('shuffle');schedule();},
 send:action=>{if(onlineSender){onlineSender(action);return;}const state=get().state;if(!state)return;apply(0,action);},
 stop:()=>{onlineClose?.();onlineSender=null;onlineClose=null;cancel();set({state:null,view:null,playing:false});},
 setFast:fast=>set({fast}),setReduced:reduced=>set({reduced})
}));
function apply(seat:number,action:Action){
 const s=useGame.getState().state;if(!s)return;
 if(!legalActions(s,seat).some(a=>JSON.stringify(a)===JSON.stringify(action)))return;
 const next=act(s,seat,action,action.type==='NEXT_HAND'?shuffledDeck():undefined);if(action.type==='NEXT_HAND')localPartnerSignal=undefined;useGame.setState({state:next,view:viewFor(next,0)});
 audio.play(action.type==='PLAY_CARD'?'play':action.type==='NEXT_HAND'?'deal':action.type==='ENVIDO'?'envido':'truco',seat===1?.4:0);
 if(next.winner!==null)audio.play(next.winner===0?'victory':'defeat');else if(next.events.some(e=>e.type==='FLOR'))audio.play('flor');
 schedule();
}
function schedule(){
 cancel();const {state,fast}=useGame.getState();if(!state||state.winner!==null)return;
 // A human always gets a chance to answer before a bot teammate.
 if(!legalActions(state,0).length){const seat=Array.from({length:state.seats},(_,i)=>i).find(i=>legalActions(state,i).length);if(seat!==undefined)botTimer=setTimeout(()=>{const s=useGame.getState().state;if(s)apply(seat,chooseAction(viewFor(s,seat),'medium',Math.random,{partnerSignal:seat===2?localPartnerSignal:undefined}));},fast?40:thinkMs());}
 if(state.handWinner===null)turnTimer=setTimeout(()=>{const s=useGame.getState().state;if(s&&s.handWinner===null&&s.winner===null){const expired=timeout(s);apply(expired.seat,expired.action);}},state.config.turnSeconds*1000);
}
if(import.meta.env.DEV){Object.assign(window,{bolicheDebug:{view:()=>useGame.getState().view,fast:()=>useGame.getState().setFast(true)}});}
export function acceptOnlineView(view:PlayerView,sender:(action:Action)=>void,close:()=>void){cancel();onlineSender=sender;onlineClose=close;useGame.setState({state:null,view,playing:true});}
export function detachOnline(){onlineSender=null;onlineClose=null;cancel();useGame.setState({state:null,view:null,playing:false});}
