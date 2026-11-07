import {deck,newMatch,pieceOf,suitOf,type Card} from '../../engine/src/index';
export function tutorialState(step:number){const seats=step===5?4:2,sample:Card='7O';const own:Card[]=step===3?['6E','7E','1C']:step===4?['2O','4E','6E']:['2O','1E','3B'];const hands:Card[][]=[own];const used=new Set<Card>([sample,...own]);
 for(let seat=1;seat<seats;seat++){const hand:Card[]=[];for(const card of deck())if(!used.has(card)&&pieceOf(card,sample)===null&&!hand.some(other=>suitOf(other)===suitOf(card))){hand.push(card);used.add(card);if(hand.length===3)break;}hands.push(hand);}
 const order:Card[]=[];for(let round=0;round<3;round++)for(let seat=0;seat<seats;seat++)order.push(hands[seat][round]);order.push(sample,...deck().filter(card=>!used.has(card)));return newMatch(seats,order,{florEnabled:true});
}
