import {deck,rank,envido,flor,team,type Action,type Card,type PlayerView} from '../../engine/src/index';
export type Difficulty='low'|'medium'|'high';
export const profiles={low:{samples:4,noise:.75,bluff:.03},medium:{samples:24,noise:.14,bluff:.08},high:{samples:96,noise:.015,bluff:.12}} as const;
export const nicknames=['El Tano','La Flaca','Cacho','Nelly','El Zurdo','Pocha','El Vasco','Lili'];
export function thinkMs(random:()=>number=Math.random):number {
 const normal=Math.sqrt(-2*Math.log(Math.max(random(),.00001)))*Math.cos(2*Math.PI*random());return Math.max(1200,Math.min(6000,Math.exp(7.8+.42*normal)));
}
/** Determinizations use only the seat-filtered view, never server state. */
export function chooseAction(view:PlayerView,difficulty:Difficulty='medium',random:()=>number=Math.random):Action {
 const actions=view.legal;if(!actions.length)throw new Error('Sin acciones');
 const profile=profiles[difficulty];
 if(random()<profile.noise)return actions[Math.floor(random()*actions.length)];
 const hand=view.hands[view.seat].filter((c):c is Card=>c!==null);
 const original=[...hand,...view.played.filter(p=>p.seat===view.seat).map(p=>p.card)];
 const known=new Set([view.sample,...original,...view.played.map(p=>p.card),...view.revealed.flatMap(r=>r.cards)]);
 const unseen=deck().filter(c=>!known.has(c));
 let strength=0;
 for(let iteration=0;iteration<profile.samples;iteration++){
  const pool=[...unseen];const opponent:Card[]=[];
  for(let i=0;i<3&&pool.length;i++){const j=Math.floor(random()*pool.length);opponent.push(pool.splice(j,1)[0]);}
  const ours=original.map(c=>rank(c,view.sample)).sort((a,b)=>a-b);const theirs=opponent.map(c=>rank(c,view.sample)).sort((a,b)=>a-b);
  strength+=ours.filter((r,i)=>r<=theirs[i]).length>=2?1:0;
 }
 strength/=profile.samples;
 const find=(type:Action['type'])=>actions.find(a=>a.type===type);
 if(view.handWinner!==null)return actions[0];
 if(view.pending){
  if(view.pending.kind==='florChoose')return find('FLOR')!;
  if(view.pending.kind==='florConfirm')return find('QUIERO')!;
  if(view.pending.kind==='resto')return find(flor(original,view.sample)!>=38?'QUIERO':'NO_QUIERO')!;
  if(view.pending.kind==='envido')return find(envido(original,view.sample)>=(view.pending.sequence.includes('F')?32:27)?'QUIERO':'NO_QUIERO')!;
  const raise=find('TRUCO');if(raise&&strength>.86)return raise;
  return find(strength>.35?'QUIERO':'NO_QUIERO')!;
 }
 const tanto=envido(original,view.sample);
 const call=actions.find(a=>a.type==='ENVIDO'&&a.bid==='E');if(call&&tanto>=29&&random()<.8)return call;
 const truco=find('TRUCO');if(truco&&(strength>.78||random()<profile.bluff*.2))return truco;
 const plays=actions.filter((a):a is Extract<Action,{type:'PLAY_CARD'}>=>a.type==='PLAY_CARD');
 const sorted=[...plays].sort((a,b)=>rank(b.cardId,view.sample)-rank(a.cardId,view.sample));
 const top=view.trick.length?view.trick.reduce((a,b)=>rank(a.card,view.sample)<=rank(b.card,view.sample)?a:b):null;
 if(top&&team(top.seat)===team(view.seat))return sorted[0];
 if(top)return sorted.find(a=>rank(a.cardId,view.sample)<rank(top.card,view.sample))??sorted[0];
 // Open with the best card when we can contest; keep a weak card for a lost trick.
 return sorted.at(-1)!;
}
