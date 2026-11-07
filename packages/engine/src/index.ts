import {type Card, deck, rank, flor, envido,envidoCards} from './cards';
const validCards=new Set(deck());
export * from './cards';
export interface RulesConfig {targetScore:30|40;florEnabled:boolean;florEnvido:boolean;faltaEnvidoMode:'leaderNeeds'|'malasGanaPartida';echarLosPerros:boolean;turnSeconds:number;senaCatchChance:number;pardaLead:'opener'|'mano';florBothMode:'comparison';}
export const defaultRules:RulesConfig={targetScore:30,florEnabled:true,florEnvido:false,faltaEnvidoMode:'leaderNeeds',echarLosPerros:false,turnSeconds:25,senaCatchChance:0,pardaLead:'opener',florBothMode:'comparison'};
export type Team=0|1;
export type Bid='E'|'R'|'F';
export type Action={type:'PLAY_CARD';cardId:Card}|{type:'TRUCO'|'QUIERO'|'NO_QUIERO'|'MAZO'|'FLOR'|'RESTO'|'NEXT_HAND'}|{type:'ENVIDO';bid:Bid};
export interface Pending {kind:'truco'|'envido'|'florChoose'|'florConfirm'|'resto';by:number;sequence:Bid[];}
export interface Play {seat:number;card:Card;}
export interface PublicTanto {seat:number;kind:'envido'|'flor';value?:number;}
export interface GameEvent {type:string;seat?:number;value?:number;text?:string;cards?:Card[];}
export interface State {
 config:RulesConfig;seats:2|4;dealer:number;mano:number;turn:number;lead:number;handNo:number;seq:number;
 scores:[number,number];hands:Card[][];original:Card[][];sample:Card;deck:Card[];played:Play[];trick:Play[];tricks:(Team|null)[];
 value:number;raiseTeam:Team|null;pending:Pending|null;suspended:Pending|null;envidoDone:boolean;
 florAnnounced:number[];florPaid:number[];florDone:boolean;revealSeats:number[];
 handWinner:Team|null;winner:Team|null;events:GameEvent[];publicTantos?:PublicTanto[];
}
export const team=(seat:number):Team=>(seat%2) as Team;
export function order(start:number,count:number):number[]{return Array.from({length:count},(_,i)=>(start+i)%count);}
export function falta(scores:readonly number[],config:RulesConfig):number {
 const leader=Math.max(...scores);return config.faltaEnvidoMode==='malasGanaPartida' && leader<config.targetScore/2 ? config.targetScore : config.targetScore-leader;
}
export function handResult(tricks:readonly (Team|null)[],manoTeam:Team):Team|null {
 if(tricks.length<2)return null;
 const [a,b,c]=tricks;
 if(a===null && b!==null)return b;
 if(a!==null && (b===null||a===b))return a;
 if(tricks.length<3)return null;
 if(c!==null)return c;
 return a??b??manoTeam;
}
export function resolveTrick(plays:readonly Play[],rankCard:(card:Card)=>number):{winner:Team|null;first:number}{
 let best=Infinity,first=-1,tied=false;
 for(const play of plays){const n=rankCard(play.card);if(n<best){best=n;first=play.seat;tied=false;}else if(n===best&&team(play.seat)!==team(first))tied=true;}
 return {winner:tied?null:team(first),first};
}
export function newMatch(seats:2|4,cards:Card[],config:Partial<RulesConfig>={},dealer=seats-1):State {
 const rules={...defaultRules,...config};
 if(rules.florEnvido||rules.echarLosPerros)throw new Error('Variante futura no disponible');
 if(![30,40].includes(rules.targetScore)||rules.turnSeconds<=0||rules.senaCatchChance<0||rules.senaCatchChance>1)throw new Error('Configuración inválida');
 if(![2,4].includes(seats)||!Number.isInteger(dealer)||dealer<0||dealer>=seats)throw new Error('Asientos inválidos');
 return deal({config:rules,seats,dealer,mano:0,turn:0,lead:0,handNo:0,seq:0,scores:[0,0],hands:[],original:[],sample:'1E',deck:[],played:[],trick:[],tricks:[],value:1,raiseTeam:null,pending:null,suspended:null,envidoDone:false,florAnnounced:[],florPaid:[],florDone:false,revealSeats:[],handWinner:null,winner:null,events:[]},cards,false);
}
export function deal(state:State,cards:Card[],rotate=true):State {
 if(cards.length!==40||new Set(cards).size!==40||cards.some(c=>!validCards.has(c)))throw new Error('Mazo inválido');
 if(rotate && (state.handWinner===null||state.winner!==null))throw new Error('No corresponde repartir');
 const s:State={...state,config:{...state.config},scores:[...state.scores],dealer:rotate?(state.dealer+1)%state.seats:state.dealer,handNo:state.handNo+1,seq:rotate?state.seq+1:state.seq,hands:Array.from({length:state.seats},()=>[]),original:[],played:[],trick:[],tricks:[],value:1,raiseTeam:null,pending:null,suspended:null,envidoDone:false,florAnnounced:[],florPaid:[],florDone:false,revealSeats:[],handWinner:null,events:[]};
 s.mano=(s.dealer+1)%s.seats;s.turn=s.mano;s.lead=s.mano;
 const stock=[...cards];for(let round=0;round<3;round++)for(const seat of order(s.mano,s.seats))s.hands[seat].push(stock.shift()!);
 s.original=s.hands.map(h=>[...h]);s.sample=stock.shift()!;s.deck=stock;s.events.push({type:'DEAL'});
 autoFlor(s);return s;
}
function award(s:State,who:Team,points:number):void {
 s.scores[who]+=points;s.events.push({type:'POINTS',seat:who,value:points});
 if(s.scores[who]>=s.config.targetScore){s.winner=who;s.pending=null;s.suspended=null;s.events.push({type:'MATCH_END',seat:who});}
}
function closeHand(s:State,who:Team,points:number):void {
 s.handWinner=who;s.pending=null;s.suspended=null;
 for(const seat of s.revealSeats)s.events.push({type:'REVEAL',seat,cards:tantoCards(s,seat)});
 award(s,who,points);s.events.push({type:'HAND_END',seat:who});
}
function flowerSeats(s:State):number[]{return s.config.florEnabled?order(s.mano,s.seats).filter(seat=>flor(s.original[seat],s.sample)!==null):[];}
function autoFlor(s:State):void {
 if(s.winner!==null||s.handWinner!==null||s.florDone||s.pending?.kind.startsWith('flor')||s.pending?.kind==='resto')return;
 const flowers=flowerSeats(s);
 const responders=s.pending?order(s.mano,s.seats).filter(i=>team(i)!==team(s.pending!.by)):[s.turn];
 const trigger=flowers.find(i=>responders.includes(i)&&!s.florAnnounced.includes(i));
 if(trigger===undefined)return;
 if(s.pending?.kind==='truco')s.suspended=s.pending;
 s.pending=null;s.envidoDone=true;
 const opposing=flowers.find(i=>team(i)!==team(trigger));
 if(opposing!==undefined){
  // All holders now have an immediate response decision, so all flowers are announced.
  for(const seat of flowers){if(!s.florAnnounced.includes(seat))s.events.push({type:'FLOR',seat});}
  s.florAnnounced=[...flowers];s.pending={kind:'florChoose',by:trigger,sequence:[]};
 }else{
  s.florAnnounced.push(trigger);s.florPaid.push(trigger);s.revealSeats.push(trigger);s.events.push({type:'FLOR',seat:trigger});award(s,team(trigger),3);
  s.florDone=flowers.every(i=>s.florPaid.includes(i));
  if(s.winner===null){s.pending=s.suspended;s.suspended=null;}
 }
}
const validSequences=['E','EE','ER','EER','R','F','EF','EEF','ERF','EERF','RF'];
export function envidoRaises(sequence:readonly Bid[]):Bid[]{return (['E','R','F'] as Bid[]).filter(b=>validSequences.includes([...sequence,b].join('')));}
export function bidPoints(sequence:readonly Bid[],s:{scores:readonly number[];config:RulesConfig}):number {return sequence.includes('F')?falta(s.scores,s.config):sequence.reduce((sum,b)=>sum+(b==='E'?2:3),0);}
export function legalActions(s:State,seat:number):Action[]{
 if(!Number.isInteger(seat)||seat<0||seat>=s.seats||s.winner!==null)return [];
 if(s.handWinner!==null)return [{type:'NEXT_HAND'}];
 const p=s.pending;
 if(p){
  if(team(seat)===team(p.by))return [];
  if(p.kind==='florChoose')return flor(s.original[seat],s.sample)===null?[]:[{type:'FLOR'},{type:'RESTO'}];
  if(p.kind==='florConfirm')return [{type:'QUIERO'},{type:'RESTO'}];
  const acts:Action[]=[{type:'QUIERO'},{type:'NO_QUIERO'}];
  if(p.kind==='truco'&&s.value<3)acts.push({type:'TRUCO'});
  if(p.kind==='envido')acts.push(...envidoRaises(p.sequence).map(bid=>({type:'ENVIDO' as const,bid})));
  if(p.kind==='truco'&&canEnvido(s,seat))acts.push(...envidoRaises([]).map(bid=>({type:'ENVIDO' as const,bid})));
  return acts;
 }
 if(seat!==s.turn)return [];
 const acts:Action[]=s.hands[seat].map(cardId=>({type:'PLAY_CARD',cardId}));acts.push({type:'MAZO'});
 if(s.value<4&&(s.raiseTeam===null||s.raiseTeam===team(seat)))acts.push({type:'TRUCO'});
 if(canEnvido(s,seat))acts.push(...envidoRaises([]).map(bid=>({type:'ENVIDO' as const,bid})));
 return acts;
}
function canEnvido(s:State,seat:number):boolean{return !s.envidoDone&&s.tricks.length===0&&!s.played.some(p=>p.seat===seat)&&s.florAnnounced.length===0;}
function bestTanto(s:State,kind:'envido'|'flor'):number {
 const seats=order(s.mano,s.seats).filter(i=>kind==='envido'||flor(s.original[i],s.sample)!==null);
 let best=seats[0],value=-1;const teamValues=[-1,-1];
 for(const seat of seats){const n=kind==='envido'?envido(s.original[seat],s.sample):flor(s.original[seat],s.sample)!;const declares=n>teamValues[1-team(seat)];(s.publicTantos??=[]).push({seat,kind,value:declares?n:undefined});s.events.push({type:'TANTO',seat,value:declares?n:undefined,text:declares?`Tengo ${n}`:'Son buenas'});teamValues[team(seat)]=Math.max(teamValues[team(seat)],n);if(n>value){value=n;best=seat;}}
 s.revealSeats.push(best);return best;
}
function tantoCards(s:State,seat:number):Card[]{return s.config.florEnabled&&flor(s.original[seat],s.sample)!==null?[...s.original[seat]]:envidoCards(s.original[seat],s.sample);}
function finishBid(s:State,accept:boolean):void {
 const p=s.pending!;
 if(p.kind==='truco'){
  if(!accept){closeHand(s,team(p.by),s.value);return;}
  s.value++;s.raiseTeam=(1-team(p.by)) as Team;s.pending=null;return;
 }
 if(p.kind==='envido'){
  s.envidoDone=true;
  const who=accept?team(bestTanto(s,'envido')):team(p.by);
  const points=accept?bidPoints(p.sequence,s):Math.max(1,bidPoints(p.sequence.slice(0,-1),s));
  s.pending=s.suspended;s.suspended=null;award(s,who,points);return;
 }
 const who=accept?team(bestTanto(s,'flor')):team(p.by);
 const points=p.kind==='resto'&&accept?falta(s.scores,s.config):s.florAnnounced.length*3;
 s.florDone=true;s.pending=s.suspended;s.suspended=null;award(s,who,points);
}
export function act(state:State,seat:number,action:Action,nextDeck?:Card[]):State {
 if(!legalActions(state,seat).some(a=>JSON.stringify(a)===JSON.stringify(action)))throw new Error('Acción ilegal');
 if(action.type==='NEXT_HAND'){if(!nextDeck)throw new Error('Falta el mazo del servidor');return deal(state,nextDeck);}
 const s:State=structuredClone(state);s.seq++;s.events=[{type:action.type,seat}];
 switch(action.type){
 case 'PLAY_CARD':{
  s.hands[seat].splice(s.hands[seat].indexOf(action.cardId),1);const played={seat,card:action.cardId};s.trick.push(played);s.played.push(played);
  if(s.trick.length===s.seats){
   const {winner:result,first}=resolveTrick(s.trick,card=>rank(card,s.sample));
   s.tricks.push(result);s.events.push({type:result===null?'PARDA':'TRICK',seat:result??undefined});
   s.lead=result===null?(s.config.pardaLead==='mano'?s.mano:s.lead):first;s.turn=s.lead;s.trick=[];
   const winner=handResult(s.tricks,team(s.mano));if(winner!==null)closeHand(s,winner,s.value);
  }else s.turn=(s.turn+1)%s.seats;
  break;
 }
 case 'TRUCO':if(s.pending){s.value++;s.raiseTeam=team(seat);}s.pending={kind:'truco',by:seat,sequence:[]};break;
 case 'ENVIDO':{
  if(s.pending?.kind==='truco')s.suspended=s.pending;
  const sequence=s.pending?.kind==='envido'?[...s.pending.sequence,action.bid]:[action.bid];
  s.pending={kind:'envido',by:seat,sequence};
  // An envido immediately gives every flower holder a response opportunity.
  const flowers=flowerSeats(s).filter(i=>!s.florAnnounced.includes(i));
  if(flowers.length){s.pending=null;const previous=s.turn;s.turn=flowers[0];autoFlor(s);s.turn=previous;}
  break;
 }
 case 'QUIERO':finishBid(s,true);break;
 case 'NO_QUIERO':finishBid(s,false);break;
 case 'MAZO':closeHand(s,(1-team(seat)) as Team,s.value);break;
 case 'FLOR':s.pending={kind:'florConfirm',by:seat,sequence:[]};break;
 case 'RESTO':s.pending={kind:'resto',by:seat,sequence:[]};break;
 }
 autoFlor(s);return s;
}
export function timeout(s:State):{seat:number;action:Action}{
 if(s.handWinner!==null||s.winner!==null)throw new Error('Sin turno activo');
 if(s.pending){const seat=order(s.mano,s.seats).find(i=>legalActions(s,i).length)!;const acts=legalActions(s,seat);return {seat,action:acts.find(a=>a.type==='NO_QUIERO')??acts[0]};}
 const cards=[...s.hands[s.turn]].sort((a,b)=>rank(b,s.sample)-rank(a,s.sample));return {seat:s.turn,action:{type:'PLAY_CARD',cardId:cards[0]}};
}
export function viewFor(s:State,seat:number){
 if(!Number.isInteger(seat)||seat<0||seat>=s.seats)throw new Error('Asiento inválido');
 return {seq:s.seq,seats:s.seats,seat,config:{...s.config},dealer:s.dealer,mano:s.mano,turn:s.turn,lead:s.lead,handNo:s.handNo,scores:[...s.scores],sample:s.sample,
  hands:s.hands.map((h,i)=>i===seat?[...h]:h.map(()=>null)),played:s.played.map(p=>({...p})),florAnnounced:[...s.florAnnounced],publicTantos:(s.publicTantos??[]).map(t=>({...t})),trick:s.trick.map(p=>({...p})),tricks:[...s.tricks],value:s.value,pending:s.pending?structuredClone(s.pending):null,
  winner:s.winner,handWinner:s.handWinner,events:s.events.map(e=>structuredClone(e)),legal:legalActions(s,seat),
  revealed:s.handWinner!==null||s.winner!==null?s.revealSeats.map(i=>({seat:i,cards:tantoCards(s,i)})):[]};
}
export type PlayerView=ReturnType<typeof viewFor>;
