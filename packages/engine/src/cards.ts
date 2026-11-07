export const suits = ['E','B','O','C'] as const;
export type Suit = typeof suits[number];
export type Card = `${number}${Suit}`;
export const numbers = [1,2,3,4,5,6,7,10,11,12] as const;
export const pieces = [2,4,5,11,10] as const;
export function deck(): Card[] { return suits.flatMap(s=>numbers.map(n=>`${n}${s}` as Card)); }
export const numberOf = (c:Card):number => Number(c.slice(0,-1));
export const suitOf = (c:Card):Suit => c.slice(-1) as Suit;
export function pieceOf(card:Card, sample:Card):number|null {
 if(suitOf(card)!==suitOf(sample)) return null;
 const n=numberOf(card);
 if(n===12 && pieces.includes(numberOf(sample) as typeof pieces[number])) return numberOf(sample);
 return pieces.includes(n as typeof pieces[number]) ? n : null;
}
/** Smaller rank wins. Equal ranks are genuinely tied, irrespective of suit. */
export function rank(card:Card,sample:Card):number {
 const piece=pieceOf(card,sample);
 if(piece!==null)return pieces.indexOf(piece as typeof pieces[number]);
 const special:Partial<Record<Card,number>>={'1E':5,'1B':6,'7E':7,'7O':8};
 if(special[card]!==undefined)return special[card];
 return ({3:9,2:10,1:11,12:12,11:13,10:14,7:15,6:16,5:17,4:18} as Record<number,number>)[numberOf(card)];
}
export function cardPoints(card:Card,sample:Card):number {
 const p=pieceOf(card,sample);
 return p===null ? (numberOf(card)<10?numberOf(card):0) : ({2:30,4:29,5:28,11:27,10:27} as Record<number,number>)[p];
}
export function flor(hand:readonly Card[],sample:Card):number|null {
 const ps=hand.filter(c=>pieceOf(c,sample)!==null).map(c=>cardPoints(c,sample)).sort((a,b)=>b-a);
 const rest=hand.filter(c=>pieceOf(c,sample)===null);
 if(ps.length>=2)return ps[0]+ps.slice(1).reduce((sum,p)=>sum+p%10,0)+rest.reduce((sum,c)=>sum+cardPoints(c,sample),0);
 if(ps.length===1 && suitOf(rest[0])===suitOf(rest[1]))return ps[0]+rest.reduce((sum,c)=>sum+cardPoints(c,sample),0);
 if(ps.length===0 && hand.every(c=>suitOf(c)===suitOf(hand[0])))return 20+hand.reduce((sum,c)=>sum+cardPoints(c,sample),0);
 return null;
}
export function envido(hand:readonly Card[],sample:Card):number {
 const ps=hand.filter(c=>pieceOf(c,sample)!==null);
 if(ps.length)return Math.max(...ps.map(c=>cardPoints(c,sample)))+Math.max(0,...hand.filter(c=>pieceOf(c,sample)===null).map(c=>cardPoints(c,sample)));
 let best=Math.max(...hand.map(c=>cardPoints(c,sample)));
 for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++)if(suitOf(hand[i])===suitOf(hand[j]))best=Math.max(best,20+cardPoints(hand[i],sample)+cardPoints(hand[j],sample));
 return best;
}
/** Rejection sampling removes modulo bias. Server owns this source. */
export function shuffledDeck(random:()=>number=()=>{
 const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]/4294967296;
}):Card[]{
 const cards=deck();
 for(let i=cards.length-1;i>0;i--){let value:number;const bound=Math.floor(4294967296/(i+1))*(i+1);do{value=Math.floor(random()*4294967296);}while(value>=bound);const j=value%(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}
 return cards;
}
