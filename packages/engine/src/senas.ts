import {rank,pieceOf,numberOf,suitOf,type Card} from './cards';
export const senas={piece2:'cejas',piece4:'beso',piece5:'nariz',piece11:'guinoDerecho',piece10:'guinoIzquierdo',espada1:'labiosDerecha',basto1:'menton',espada7:'labiosIzquierda',oro7:'cejaIzquierda',tres:'morderLabio',dos:'bocaAbierta',falso:'lengua',comunes:'ojosCerrados',envido:'lamerLabio',flor:'cachetes'} as const;
export const senaCooldownMs=1500;
export function signalFor(hand:readonly Card[],sample:Card):string{
 const pieces=hand.filter(c=>pieceOf(c,sample)!==null);if(pieces.length===3)return senas.flor;
 const rest=hand.filter(c=>pieceOf(c,sample)===null);if(pieces.length===1&&rest.length===2&&suitOf(rest[0])!==suitOf(rest[1]))return senas.envido;
 const best=[...hand].sort((a,b)=>rank(a,sample)-rank(b,sample))[0],piece=pieceOf(best,sample);
 if(piece!==null)return ({2:senas.piece2,4:senas.piece4,5:senas.piece5,11:senas.piece11,10:senas.piece10} as Record<number,string>)[piece];
 if(best==='1E')return senas.espada1;if(best==='1B')return senas.basto1;if(best==='7E')return senas.espada7;if(best==='7O')return senas.oro7;
 if(numberOf(best)===3)return senas.tres;if(numberOf(best)===2)return senas.dos;if(numberOf(best)===1)return senas.falso;return senas.comunes;
}
