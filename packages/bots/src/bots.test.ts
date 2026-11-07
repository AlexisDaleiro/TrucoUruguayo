import {test,expect} from 'vitest';
import {newMatch,shuffledDeck,act,viewFor,legalActions} from '../../engine/src/index';
import {chooseAction,thinkMs} from './index';
test('tres niveles eligen intenciones legales desde la vista pública',()=>{
 for(const difficulty of ['low','medium','high'] as const){let s=newMatch(4,shuffledDeck());let n=0;while(s.winner===null&&n++<1200){const seat=Array.from({length:s.seats},(_,i)=>i).find(i=>legalActions(s,i).length)!;const a=chooseAction(viewFor(s,seat),difficulty);expect(legalActions(s,seat)).toContainEqual(a);s=act(s,seat,a,a.type==='NEXT_HAND'?shuffledDeck():undefined);}expect(s.winner).not.toBeNull();}
 expect(thinkMs(()=>.5)).toBeGreaterThanOrEqual(1200);expect(thinkMs(()=>.999)).toBeLessThanOrEqual(6000);expect(()=>chooseAction({...viewFor(newMatch(2,shuffledDeck()),0),legal:[]})).toThrow();
});
