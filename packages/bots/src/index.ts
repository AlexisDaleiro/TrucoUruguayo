import {bidPoints,deck,envido,falta,flor,handResult,order,rank,resolveTrick,team,type Action,type Card,type PlayerView,type Team} from '../../engine/src/index';
import {sampleHands} from './worlds';
export {thinkMs} from './timing';
export type Difficulty='low'|'medium'|'high';
export const profiles={low:{samples:4,noise:.44,bluff:.02},medium:{samples:12,noise:.16,bluff:.04},high:{samples:24,noise:.012,bluff:.06}} as const;
export const nicknames=['El Tano','La Flaca','Cacho','Nelly','El Zurdo','Pocha','El Vasco','Lili'];
export const difficultyForMmr=(mmr:number):Difficulty=>mmr<900?'low':mmr>1300?'high':'medium';
const ranks=new Map(deck().map(sample=>[sample,new Map(deck().map(card=>[card,rank(card,sample)]))]));
function rollout(view:PlayerView,world:Card[][],first:Card|undefined,cardRank:(card:Card)=>number){
 const hands=world.map((hand,seat)=>hand.filter(card=>!view.played.some(play=>play.seat===seat&&play.card===card)).sort((a,b)=>cardRank(b)-cardRank(a)));
 const tricks=[...view.tricks];let trick=[...view.trick],turn=view.turn,lead=view.lead;
 for(let step=0;step<view.seats*3;step++){
  const hand=hands[turn];if(!hand.length)break;
  const top=trick.length?resolveTrick(trick,cardRank):null;
  const best=trick.reduce((n,play)=>Math.min(n,cardRank(play.card)),Infinity);
  let card=step===0&&first?first:!top?hand.at(-1)!:top.winner===team(turn)?hand[0]:hand.find(c=>cardRank(c)<best)??hand[0];
  if(!first&&step===0&&view.trick.length===0&&hand.length===3&&cardRank(card)>=10)card=hand[0];
  hand.splice(hand.indexOf(card),1);trick.push({seat:turn,card});
  if(trick.length===view.seats){
   const result=resolveTrick(trick,cardRank);tricks.push(result.winner);const winner=handResult(tricks,team(view.mano));if(winner!==null)return winner;
   turn=lead=result.winner===null?(view.config.pardaLead==='mano'?view.mano:lead):result.first;trick=[];
  }else turn=(turn+1)%view.seats;
 }
 return handResult(tricks,team(view.mano))??team(view.mano);
}
function bestTanto(view:PlayerView,world:Card[][],kind:'envido'|'flor'){
 let best=-1,winner=team(view.mano);const totals=[-1,-1];for(const seat of order(view.mano,view.seats)){
  const points=(kind==='envido'?envido:flor)(world[seat],view.sample);if(points===null)continue;
  const side=team(seat);totals[side]=Math.max(totals[side],points);if(points>best){best=points;winner=side;}
 }
 return {winner,totals};
}
/** Operates exclusively on public evidence and the bot's own hand. */
export function chooseAction(view:PlayerView,difficulty:Difficulty='medium',random:()=>number=Math.random,knowledge:{partnerSignal?:string}={}):Action {
 const actions=view.legal;if(!actions.length)throw Error('Sin acciones');if(actions.length===1)return actions[0];
 const policy=profiles[difficulty],us=team(view.seat),them=(1-us) as Team,p=view.pending;
 if(random()<policy.noise){const possible=actions.filter(action=>action.type!=='MAZO');return possible[Math.floor(random()*possible.length)];}
 const cardRank=(card:Card)=>ranks.get(view.sample)!.get(card)!;
 const cards=actions.filter((a):a is Extract<Action,{type:'PLAY_CARD'}>=>a.type==='PLAY_CARD').sort((a,b)=>cardRank(b.cardId)-cardRank(a.cardId));
 const worlds=sampleHands(view,policy.samples,random,knowledge.partnerSignal);
 if(!worlds.length){
  if(cards.length){const top=view.trick.length?resolveTrick(view.trick,cardRank):null;const best=Math.min(...view.trick.map(play=>cardRank(play.card)));return !top?cards.at(-1)!:top.winner===us?cards[0]:cards.find(a=>cardRank(a.cardId)<best)??cards[0];}
  return actions.find(a=>a.type==='FLOR'||a.type==='QUIERO')??actions[0];
 }
 const utility=(winner:Team,points:number)=>{const need=view.config.targetScore-view.scores[winner];return (winner===us?1:-1)*(Math.min(need,points)+(points>=need?8:0));};
 const baseWins=worlds.map(world=>rollout(view,world,undefined,cardRank));
 const strength=baseWins.filter(winner=>winner===us).length/worlds.length;
 const bluff=strength>.2&&random()<policy.bluff;
 const wantsEnvido=actions.some(a=>a.type==='ENVIDO')||p?.kind==='envido';
 const wantsFlor=p&&['florChoose','florConfirm','resto'].includes(p.kind);
 const flowerStake=view.florAnnounced.length*3;
 const hands=worlds.map((world,i)=>({world,win:baseWins[i],envido:wantsEnvido?bestTanto(view,world,'envido'):null,flor:wantsFlor?bestTanto(view,world,'flor'):null,
  interrupts:wantsEnvido&&view.config.florEnabled&&p?.kind!=='envido'&&world.some(hand=>flor(hand,view.sample)!==null)}));
 let bestAction=actions[0],bestEV=-Infinity;
 for(const action of actions){
  let total=0;
  for(const {world,win,envido:points,flor:flower,interrupts} of hands){
   const base=utility(win,view.value);
   switch(action.type){
   case 'PLAY_CARD':total+=utility(rollout(view,world,action.cardId,cardRank),view.value)+cardRank(action.cardId)*.008;break;
   case 'MAZO':total+=utility(them,view.value)-.2;break;
   case 'TRUCO':{
    const offer=view.value+(p?.kind==='truco'?1:0);
    const fold=win===us?.30:.10;total+=(1-fold)*utility(win,offer+1)+fold*utility(us,offer)-(bluff?-.6:.28);break;
   }
   case 'ENVIDO':{
    const prior=p?.kind==='envido'?p.sequence:[],sequence=[...prior,action.bid];
    const refused=Math.max(1,bidPoints(prior,view)),accepted=bidPoints(sequence,view);
    const fold=points!.totals[them]<(action.bid==='F'?32:action.bid==='R'?28:26)?.70:.14;
    total+=base+(interrupts?0:(1-fold)*utility(points!.winner,accepted)+fold*utility(us,refused)-.55);break;
   }
   case 'NO_QUIERO':{
    const refusal=p?.kind==='truco'?view.value:p?.kind==='envido'?Math.max(1,bidPoints(p.sequence.slice(0,-1),view)):flowerStake;
    total+=utility(them,refusal)+(p?.kind==='truco'?0:base);break;
   }
   case 'QUIERO':{
    if(p?.kind==='truco')total+=utility(win,view.value+1);
    else if(p?.kind==='envido')total+=base+utility(points!.winner,bidPoints(p.sequence,view));
    else total+=base+utility(flower!.winner,p?.kind==='resto'?falta(view.scores,view.config):flowerStake);
    break;
   }
   case 'FLOR':total+=base+utility(flower!.winner,flowerStake);break;
   case 'RESTO':{
    const fold=flower!.totals[them]>=37?.15:.67;
    total+=base+fold*utility(us,flowerStake)+(1-fold)*utility(flower!.winner,falta(view.scores,view.config))-.45;break;
   }
   default:total+=base;
   }
  }
  if(total>bestEV){bestEV=total;bestAction=action;}
 }
 return bestAction;
}
