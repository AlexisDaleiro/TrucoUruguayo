import {deck,envido,flor,order,team,numberOf,pieceOf,suitOf,type Card,type PlayerView} from '../../engine/src/index';
import {senas,signalFor} from '../../engine/src/senas';

const cards=deck();
const cached=new Map<string,Card[][]>();
/** Exact declarations are rare. Index their possible hands once per muestra/tanto. */
function possible(sample:Card,kind:'envido'|'flor',value:number){
 const key=[sample,kind,value].join(':');const hit=cached.get(key);if(hit)return hit;
 const pool=cards.filter(c=>c!==sample), result:Card[][]=[];const points=kind==='envido'?envido:flor;
 for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)for(let c=b+1;c<pool.length;c++){
  const hand=[pool[a],pool[b],pool[c]];if(points(hand,sample)===value)result.push(hand);
 }
 if(cached.size>=256)cached.delete(cached.keys().next().value!);cached.set(key,result);return result;
}
export function publicConsistent(view:PlayerView,hands:readonly Card[][]){
 for(const seat of view.florAnnounced)if(flor(hands[seat],view.sample)===null)return false;
 if(view.config.florEnabled&&view.pending&&['florChoose','florConfirm','resto'].includes(view.pending.kind)){
  for(const seat of order(view.mano,view.seats))if(!view.florAnnounced.includes(seat)&&flor(hands[seat],view.sample)!==null)return false;
 }
 if(view.config.florEnabled&&view.publicTantos.some(t=>t.kind==='envido')&&hands.some(hand=>flor(hand,view.sample)!==null))return false;
 for(const kind of ['envido','flor'] as const){
  const best=[-1,-1];for(const declaration of view.publicTantos){if(declaration.kind!==kind)continue;
   const n=(kind==='envido'?envido:flor)(hands[declaration.seat],view.sample);
   if(n===null||(n>best[1-team(declaration.seat)]?n:undefined)!==declaration.value)return false;
   best[team(declaration.seat)]=Math.max(best[team(declaration.seat)],n);
  }
 }
 return true;
}
function plausible(gesture:string,hand:Card[],sample:Card){
 if(signalFor(hand,sample)===gesture)return true;
 const pieces=[senas.piece2,senas.piece4,senas.piece5,senas.piece11,senas.piece10] as string[];
 const index=pieces.indexOf(gesture);if(index>=0)return hand.some(c=>pieceOf(c,sample)===[2,4,5,11,10][index]);
 const special:Record<string,Card>={[senas.espada1]:'1E',[senas.basto1]:'1B',[senas.espada7]:'7E',[senas.oro7]:'7O'};
 if(special[gesture])return hand.includes(special[gesture]);
 if(gesture===senas.tres||gesture===senas.dos)return hand.some(c=>numberOf(c)===(gesture===senas.tres?3:2)&&pieceOf(c,sample)===null);
 if(gesture===senas.falso)return hand.some(c=>numberOf(c)===1&&suitOf(c)!=='E'&&suitOf(c)!=='B');
 return false;
}
export function sampleHands(view:PlayerView,count:number,random:()=>number,partnerSignal?:string):Card[][][]{
 const known=view.hands.map(h=>h.filter((c):c is Card=>c!==null));
 for(const play of view.played)known[play.seat].push(play.card);
 for(const reveal of view.revealed)for(const card of reveal.cards)if(!known[reveal.seat].includes(card))known[reveal.seat].push(card);
 const visible=new Set([view.sample,...known.flat()]);
 const free=cards.filter(c=>!visible.has(c));
 const exact=known.map((hand,seat)=>{
  const t=view.publicTantos.find(t=>t.seat===seat&&t.value!==undefined);
  if(!t||hand.length===3)return undefined;
  return possible(view.sample,t.kind,t.value!).filter(combo=>hand.every(card=>combo.includes(card))&&combo.every(card=>hand.includes(card)||!visible.has(card)));
 });
 const seats=order(view.mano,view.seats).filter(seat=>known[seat].length<3).sort((a,b)=>(exact[a]?.length??Infinity)-(exact[b]?.length??Infinity));
 const output:Card[][][]=[],backup:Card[][][]=[];
 for(let attempt=0;attempt<count*12&&output.length<count;attempt++){
  const hands=known.map(hand=>[...hand]);const pool=[...free];let ok=true;
  for(const seat of seats){
   const hand=hands[seat],choices=exact[seat];
   if(choices){let picked:Card[]|undefined;
    for(let i=0;i<8&&choices.length;i++){const combo=choices[Math.floor(random()*choices.length)];if(combo.every(card=>hand.includes(card)||pool.includes(card))){picked=combo;break;}}
    if(!picked){ok=false;break;}for(const card of picked)if(!hand.includes(card)){pool.splice(pool.indexOf(card),1);hand.push(card);}
   }else while(hand.length<3){const index=Math.floor(random()*pool.length);hand.push(pool[index]);pool[index]=pool[pool.length-1];pool.pop();}
  }
  if(!ok||!publicConsistent(view,hands))continue;
  if(view.seats===4&&partnerSignal&&!plausible(partnerSignal,hands[(view.seat+2)%4],view.sample)&&random()<.7){if(backup.length<count)backup.push(hands);continue;}
  output.push(hands);
 }
 return output.concat(backup.slice(0,count-output.length));
}
