import {writeFile,mkdir} from 'node:fs/promises';
import {act,newMatch,shuffledDeck,viewFor,team,type State} from '../../engine/src/index';
import {chooseAction,type Difficulty} from './index';
const args=process.argv.slice(2);const index=args.indexOf('--hands');const requested=index<0?1000:Number(args[index+1]);
if(!Number.isInteger(requested)||requested<1)throw new Error('--hands debe ser un entero positivo');
let seed=0x5eed1234;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
let hands=0,matches=0,highWins=0,lowWins=0,actions=0;const started=Date.now();
while(hands<requested){
 const highTeam=(matches%2) as 0|1;let state:State=newMatch(matches%3===0?4:2,shuffledDeck(random),{florEnabled:matches%4!==0,targetScore:matches%5===0?40:30});
 let steps=0;
 while(state.winner===null){
  if(++steps>10000)throw new Error('Partida no termina');
  const seat=Array.from({length:state.seats},(_,i)=>i).find(i=>viewFor(state,i).legal.length)!;
  const level:Difficulty=team(seat)===highTeam?'high':'low';
  const action=chooseAction(viewFor(state,seat),level,random);
  state=act(state,seat,action,action.type==='NEXT_HAND'?shuffledDeck(random):undefined);actions++;
  if(state.scores.some(n=>n<0)||new Set([...state.hands.flat(),...state.played.map(p=>p.card),state.sample,...state.deck]).size!==40)throw new Error('Estado ilegal');
  if(state.handWinner!==null){hands++;if(hands>=requested)break;}
 }
 if(state.winner!==null){matches++;if(state.winner===highTeam)highWins++;else lowWins++;}
}
const report={requested,hands,matches,actions,highWins,lowWins,highWinRate:highWins/Math.max(1,matches),elapsedSeconds:(Date.now()-started)/1000,seed:'0x5eed1234',note:'Barajado reproducible solo en simulador; producción usa crypto.getRandomValues. Alto vs bajo, alternando equipo y 1v1/2v2.'};
console.log(JSON.stringify(report,null,2));await mkdir('docs/evidencia',{recursive:true});await writeFile('docs/evidencia/simulacion.json',JSON.stringify(report,null,2)+'\n');
