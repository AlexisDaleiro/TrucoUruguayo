import {expect,test} from 'vitest';
import {act,deck,newMatch,viewFor,type Card} from '../../engine/src/index';
import {chooseAction} from './index';
import {publicConsistent,sampleHands} from './worlds';
function rig(hands:Card[][],sample:Card,florEnabled:boolean){
 const cards=hands[0].flatMap((_,round)=>hands.map(hand=>hand[round])).concat(sample);
 return newMatch(hands.length as 2|4,[...cards,...deck().filter(card=>!cards.includes(card))],{florEnabled});
}
function rng(){let seed=0x2852abc;return ()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};}
test('los mundos reproducen la declaración pública sin deducir un tanto oculto exacto',()=>{
 let state=rig([['7E','6E','3B'],['4C','6B','10E']],'6O',false);
 state=act(state,0,{type:'ENVIDO',bid:'E'});state=act(state,1,{type:'QUIERO'});state=act(state,0,{type:'PLAY_CARD',cardId:'3B'});
 const view=viewFor(state,0);expect(view.publicTantos).toEqual([{seat:0,kind:'envido',value:33},{seat:1,kind:'envido',value:undefined}]);
 expect(view.hands[1]).toEqual([null,null,null]);const worlds=sampleHands(view,24,rng());
 expect(worlds).toHaveLength(24);expect(new Set(worlds.map(world=>world[1].sort().join())).size).toBeGreaterThan(5);
 for(const world of worlds){expect(world[0]).toContain('3B');expect(publicConsistent(view,world)).toBe(true);expect(new Set([...world.flat(),view.sample]).size).toBe(7);}
});
test('las flores enfrentadas limitan los mundos a los asientos que las cantaron',()=>{
 const state=rig([['2O','4O','3B'],['7E','6E','3E'],['4C','6B','10E'],['3C','1B','7B']],'6O',true);
 const view=viewFor(state,0);expect(view.florAnnounced).toEqual([0,1]);const worlds=sampleHands(view,12,rng(),'cejas');expect(worlds.length).toBeGreaterThan(6);
 for(const world of worlds){expect(publicConsistent(view,world)).toBe(true);expect(new Set([...world.flat(),view.sample]).size).toBe(13);}
 const responder=viewFor(state,1);expect(responder.legal).toContainEqual(chooseAction(responder,'high',rng()));
});
