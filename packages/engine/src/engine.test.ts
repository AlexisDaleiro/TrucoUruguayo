import {describe,test,expect} from 'vitest';
import fc from 'fast-check';
import {act,bidPoints,cardPoints,deck,defaultRules,deal,envido,envidoCards,envidoRaises,falta,flor,handResult,legalActions,newMatch,order,pieceOf,rank,shuffledDeck,team,timeout,viewFor,type Card,type State,type Action} from './index';
import {senas,senaCooldownMs,signalFor} from './senas';
const h=(text:string)=>text.split(' ') as Card[];
const rig=(hands:string[],sample:Card,config:Parameters<typeof newMatch>[2]={}):State=>{
 const seats=hands.length as 2|4;const hs=hands.map(h);const initial:Card[]=[];for(let i=0;i<3;i++)for(const hand of hs)initial.push(hand[i]);initial.push(sample);return newMatch(seats,[...initial,...deck().filter(c=>!initial.includes(c))],config);
};
describe('vectores exactos del maestro',()=>{
 test.each([
  ['7O','4O 1B 1O',30,null],['6C','4C 3E 6B',35,null],['3B','7C 6C 1E',33,null],['7O','10E 11B 12C',0,null],['4O','12O 7E 3B',36,null],
  ['1E','2E 4E 5E',null,47],['7O','2O 7C 6C',null,43],['7O','7E 6E 5E',null,38],['3C','2C 10C 1E',null,38],['7O','12E 5E 4E',null,29]
 ] as [Card,string,number|null,number|null][])('%s / %s',(sample,hand,e,f)=>{if(e!==null)expect(envido(h(hand),sample)).toBe(e);expect(flor(h(hand),sample)).toBe(f);});
 test('alcahuete y jerarquía completa',()=>{
  expect(rank('12O','4O')).toBe(1);expect(rank('12O','4O')).toBeLessThan(rank('1E','4O'));
  const ranked=h('2C 4C 5C 11C 10C 1E 1B 7E 7O 3E 2E 1O 12E 11E 10E 7B 6E 5E 4E');expect(ranked.map(c=>rank(c,'6C'))).toEqual(Array.from({length:19},(_,i)=>i));
  expect(pieceOf('12E','6E')).toBeNull();expect(cardPoints('12E','6E')).toBe(0);expect(cardPoints('10C','6C')).toBe(27);
 });
 test.each([[[0,0],0],[[0,1,0],0],[[null,1],1],[[null,null,0],0],[[null,null,null],1],[[0,null],0],[[0,1,null],0],[[0],null],[[null,null],null]] as [(0|1|null)[],0|1|null][])('bazas %j',(tricks,result)=>expect(handResult(tricks,1)).toBe(result));
 test('falta y flags',()=>{expect(falta([22,10],defaultRules)).toBe(8);expect(falta([2,10],{...defaultRules,faltaEnvidoMode:'malasGanaPartida'})).toBe(30);expect(falta([22,10],{...defaultRules,faltaEnvidoMode:'malasGanaPartida'})).toBe(8);});
 test.each([['E',2,1],['EE',4,2],['ER',5,2],['EER',7,4],['R',3,1],['EERF',8,7]])('envido %s',(sequence,yes,no)=>{const s={scores:[22,10] as [number,number],config:defaultRules};expect(bidPoints(sequence.split('') as ('E'|'R'|'F')[],s)).toBe(yes);expect(Math.max(1,bidPoints(sequence.slice(0,-1).split('') as ('E'|'R'|'F')[],s))).toBe(no);});
});
describe('transiciones',()=>{
 const base=()=>rig(['1E 7E 3B','4C 6B 10E'],'6O',{florEnabled:false});
 test('justificantes se muestran al ganar la partida con tanto y al cerrar flor automática',()=>{let state=base();state.scores=[22,20];state=act(state,0,{type:'ENVIDO',bid:'F'});state=act(state,1,{type:'QUIERO'});expect(state.winner).toBe(0);expect(new Set(viewFor(state,1).revealed[0].cards)).toEqual(new Set<Card>(['1E','7E']));expect(viewFor(state,1).hands[0]).toEqual([null,null,null]);let flower=rig(['2O 7C 6C','4B 5E 10C'],'7O');expect(viewFor(flower,1).revealed).toEqual([]);flower=act(flower,0,{type:'MAZO'});expect(viewFor(flower,1).revealed[0]).toEqual({seat:0,cards:['2O','7C','6C']});});
 test('cantos, alternancia y rechazos',()=>{
  let s=base();s=act(s,0,{type:'TRUCO'});expect(legalActions(s,0)).toEqual([]);s=act(s,1,{type:'QUIERO'});expect(s.value).toBe(2);expect(legalActions(s,0).some(a=>a.type==='TRUCO')).toBe(false);
  s=act(s,0,{type:'PLAY_CARD',cardId:'1E'});s=act(s,1,{type:'TRUCO'});s=act(s,0,{type:'NO_QUIERO'});expect(s.scores).toEqual([0,2]);
  s=base();s=act(s,0,{type:'TRUCO'});s=act(s,1,{type:'TRUCO'});s=act(s,0,{type:'TRUCO'});s=act(s,1,{type:'NO_QUIERO'});expect(s.scores).toEqual([3,0]);
  s=base();s=act(s,0,{type:'TRUCO'});s=act(s,1,{type:'NO_QUIERO'});expect(s.scores).toEqual([1,0]);
 });
 test('envido primero y truco pendiente',()=>{
  let s=base();s=act(s,0,{type:'TRUCO'});s=act(s,1,{type:'ENVIDO',bid:'E'});s=act(s,0,{type:'ENVIDO',bid:'R'});s=act(s,1,{type:'QUIERO'});expect(s.scores).toEqual([5,0]);expect(s.pending?.kind).toBe('truco');s=act(s,1,{type:'QUIERO'});expect(s.value).toBe(2);
 });
 test('envido no querido, falta gana en el acto, mostrar al cierre',()=>{
  let s=base();s=act(s,0,{type:'ENVIDO',bid:'E'});s=act(s,1,{type:'NO_QUIERO'});expect(s.scores).toEqual([1,0]);
  s=base();s=act(s,0,{type:'ENVIDO',bid:'E'});s=act(s,1,{type:'QUIERO'});expect(viewFor(s,0).revealed).toEqual([]);s=act(s,0,{type:'MAZO'});expect(viewFor(s,0).revealed).toHaveLength(1);
  s=base();s.scores=[22,20];s=act(s,0,{type:'ENVIDO',bid:'F'});s=act(s,1,{type:'QUIERO'});expect(s.winner).toBe(0);expect(legalActions(s,0)).toEqual([]);
 });
 test('flor simple, contraflor y achico',()=>{
  for(const response of ['QUIERO','NO_QUIERO'] as const){
   let s=rig(['7E 6E 5E','7B 6B 4B'],'3C');expect(s.pending?.kind).toBe('florChoose');s=act(s,1,{type:'RESTO'});s=act(s,0,{type:response});expect(s.scores).toEqual(response==='QUIERO'?[30,0]:[0,6]);
  }
  let s=rig(['7E 6E 5E','7B 6B 4B'],'3C');s=act(s,1,{type:'FLOR'});s=act(s,0,{type:'QUIERO'});expect(s.scores).toEqual([6,0]);
  s=rig(['7E 6E 5E','7B 6B 4B'],'3C');s=act(s,1,{type:'FLOR'});s=act(s,0,{type:'RESTO'});s=act(s,1,{type:'NO_QUIERO'});expect(s.scores).toEqual([6,0]);
 });
 test('flor de compañeros, flor anula envido y retoma truco',()=>{
  let s=rig(['7E 6E 5E','7B 1C 4B','7C 6C 4C','3E 6B 5B'],'3O');expect(s.scores).toEqual([3,0]);s=act(s,0,{type:'PLAY_CARD',cardId:'7E'});s=act(s,1,{type:'PLAY_CARD',cardId:'7B'});expect(s.scores).toEqual([6,0]);
  s=rig(['1E 3B 6O','7B 6B 4B'],'3C');s=act(s,0,{type:'ENVIDO',bid:'E'});expect(s.scores).toEqual([0,3]);expect(s.envidoDone).toBe(true);expect(s.pending).toBeNull();
  s=rig(['1E 3B 6O','7B 6B 4B'],'3C');s=act(s,0,{type:'TRUCO'});expect(s.scores).toEqual([0,3]);expect(s.pending?.kind).toBe('truco');
 });
 test('bazas, empate, tiempos, nueva mano e ilegalidad',()=>{
  let s=base();const before=structuredClone(s);expect(()=>act(s,1,{type:'MAZO'})).toThrow();expect(s).toEqual(before);expect(legalActions(s,-1)).toEqual([]);expect(legalActions(s,9)).toEqual([]);
  expect(timeout(s)).toEqual({seat:0,action:{type:'PLAY_CARD',cardId:'3B'}});s=act(s,0,{type:'TRUCO'});const expired=timeout(s);expect(expired.action.type).toBe('NO_QUIERO');s=act(s,expired.seat,expired.action);expect(()=>timeout(s)).toThrow();const n=act(s,0,{type:'NEXT_HAND'},deck());expect(n.dealer).toBe(0);expect(n.handNo).toBe(2);
  expect(()=>deal(base(),deck())).toThrow();s=base();s=act(s,0,{type:'MAZO'});expect(()=>act(s,0,{type:'NEXT_HAND'})).toThrow();s.winner=1;expect(()=>deal(s,deck())).toThrow();
  expect(()=>viewFor(base(),5)).toThrow();expect(envidoRaises(['F'])).toEqual([]);expect(order(3,4)).toEqual([3,0,1,2]);expect(team(2)).toBe(0);expect(Object.keys(senas)).toHaveLength(15);expect(senaCooldownMs).toBe(1500);
 });
 test('config inválida y mazos inválidos',()=>{
  expect(()=>newMatch(2,deck(),{florEnvido:true})).toThrow();expect(()=>newMatch(2,deck(),{echarLosPerros:true})).toThrow();expect(()=>newMatch(2,deck(),{turnSeconds:0})).toThrow();expect(()=>newMatch(2,deck(),{},4)).toThrow();expect(()=>newMatch(2,deck().slice(1))).toThrow();const bad=deck();bad[0]='8E';expect(()=>newMatch(2,bad)).toThrow();expect(()=>newMatch(2,Array(40).fill('1E'))).toThrow();
 });
});
test('propiedades: mazo, privacidad, puntos, terminación y múltiples políticas',()=>{
 fc.assert(fc.property(fc.integer(),fc.boolean(),fc.boolean(),(seed,four,flowers)=>{
  let value=seed>>>0;const rng=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
  const cards=shuffledDeck(rng);expect(new Set(cards).size).toBe(40);
  let s=newMatch(four?4:2,cards,{florEnabled:flowers,targetScore:seed%2?30:40,pardaLead:seed%2?'opener':'mano',faltaEnvidoMode:seed%3?'leaderNeeds':'malasGanaPartida'});let count=0;
  while(s.winner===null){
   expect(++count).toBeLessThan(2000);
   const actors=order(s.mano,s.seats).filter(i=>legalActions(s,i).length);const seat=actors[Math.floor(rng()*actors.length)];const v=viewFor(s,seat);
   expect(v.hands.every((hand,i)=>i===seat||hand.every(c=>c===null))).toBe(true);expect(v).not.toHaveProperty('deck');expect(v).not.toHaveProperty('original');expect(v).not.toHaveProperty('suspended');
   const choices=legalActions(s,seat);const action=choices[Math.floor(rng()*choices.length)];
   s=act(s,seat,action,action.type==='NEXT_HAND'?shuffledDeck(rng):undefined);expect(s.scores.every(n=>n>=0)).toBe(true);
  }
 }),{numRuns:250});
});
test('pardas y cartas de compañeros no son parda',()=>{
 for(const pardaLead of ['opener','mano'] as const){
  let s=rig(['3E 6E 4E','3B 6B 4B'],'7O',{florEnabled:false,pardaLead});
  for(const card of ['3E','3B','6E','6B','4E','4B'] as Card[])s=act(s,s.turn,{type:'PLAY_CARD',cardId:card});expect(s.handWinner).toBe(0);
 }
 let s=rig(['3E 1E 4E','6B 5B 4B','3C 1B 4C','6C 5C 12B'],'7O',{florEnabled:false});
 for(const card of ['3E','6B','3C','6C'] as Card[])s=act(s,s.turn,{type:'PLAY_CARD',cardId:card});expect(s.tricks).toEqual([0]);
});
test('timeout flor y límites',()=>{
 const s=rig(['7E 6E 5E','7B 6B 4B'],'3C');expect(timeout(s).action.type).toBe('FLOR');
 for(const n of [-1,2])expect(()=>newMatch(2,deck(),{senaCatchChance:n})).toThrow();
 const invalid={type:'PLAY_CARD',cardId:'12O'} as Action;expect(()=>act(s,0,invalid)).toThrow();
});
test('Son buenas oculta el tanto; se revelan solo las cartas que justifican',()=>{
 let s=rig(['7E 6E 3B','4C 6B 10E'],'6O',{florEnabled:false});s=act(s,0,{type:'ENVIDO',bid:'E'});s=act(s,1,{type:'QUIERO'});const events=viewFor(s,0).events;expect(events.find(e=>e.seat===1&&e.type==='TANTO')?.value).toBeUndefined();s=act(s,0,{type:'MAZO'});expect(viewFor(s,1).revealed).toEqual([{seat:0,cards:['7E','6E']}]);
 expect(envidoCards(h('4O 1B 1O'),'7O')).toHaveLength(2);expect(envidoCards(h('10E 11B 12C'),'7O')).toHaveLength(1);expect(envidoCards(h('2O 4O 5O'),'7O')).toEqual(['2O']);
});
test.each([
 ['2O 4O 5O','cachetes'],['2O 6B 7E','lamerLabio'],['2O 4O 6B','cejas'],['4O 5O 6B','beso'],['5O 10O 6B','nariz'],['11O 10O 6B','guinoDerecho'],['10O 6B 5B','guinoIzquierdo'],['1E 6B 5B','labiosDerecha'],['1B 6B 5B','menton'],['7E 6B 5B','labiosIzquierda'],['7O 6B 5B','cejaIzquierda'],['3E 6B 5B','morderLabio'],['2E 6B 5B','bocaAbierta'],['1C 6B 5B','lengua'],['6C 6B 5B','ojosCerrados']
])('seña verdadera %s',(cards,expected)=>expect(signalFor(h(cards),'7O')).toBe(expected));
