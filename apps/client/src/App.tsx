import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {t} from './i18n';
import {useGame} from './state/game';
import {audio,type Bus,sounds} from './audio/AudioManager';
import {Card,CardArt} from './components/Card';
import {type Action,type Card as CardId,type PlayerView} from '../../../packages/engine/src/index';
import type {Scene,AnimationName} from './scene/Scene';
import s from './App.module.css';
import {OnlinePlay,Lobby,Queue,ErrorPanel} from './components/OnlinePanels';
import {useOnline,joinRoom,disconnectOnline,roomOperation,sendChat,sendSena,cancelSearch} from './network/online';
import {linkGoogle} from './network/auth';
import {team} from '../../../packages/engine/src/index';
const SceneView=lazy(()=>import('./scene/SceneView'));
const actionLabel=(a:Action,value=1)=>a.type==='TRUCO'?(value===1?t.truco:value===2?t.retruco:t.four):a.type==='ENVIDO'?t[a.bid]:a.type==='PLAY_CARD'?'':t[a.type];
function Speech({view}:{view:PlayerView}){
 const [index,setIndex]=useState(0);const flowers=view.events.some(e=>e.type==='FLOR');const words=view.events.filter(e=>['TRUCO','ENVIDO','FLOR','PARDA','TANTO'].includes(e.type)&&!(flowers&&e.type==='ENVIDO'));
 useEffect(()=>{if(words.length<2)return;const timer=setInterval(()=>setIndex(i=>Math.min(i+1,words.length-1)),700);return()=>clearInterval(timer);},[]);
 const word=words[index];if(!word)return null;const text=word.type==='TRUCO'?actionLabel({type:'TRUCO'},view.value):word.type==='ENVIDO'?t[view.pending?.sequence.at(-1)??'E']:word.type==='FLOR'?t.flor:word.type==='PARDA'?t.parda:word.value===undefined?t.goodCards:t.tanto.replace('{n}',String(word.value));
 return <div key={index} className={s.bubble} aria-live="polite" style={{top:word.seat===view.seat?'61%':'39%'}}>{text}</div>;
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
 const panel=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=panel.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={panel} className={s.modal} onCancel={onClose} aria-label={title}><div className={s.modalHeader}><h2>{title}</h2><button className={s.icon} onClick={onClose} aria-label={t.close}>×</button></div>{children}</dialog>;
}
function Options({onClose}:{onClose:()=>void}){
 const fast=useGame(x=>x.fast),reduced=useGame(x=>x.reduced);return <Modal title={t.options} onClose={onClose}><div className={s.options}>{(['master','music','ambience','sfx','voice','ui'] as Bus[]).map(bus=><label key={bus}>{bus==='master'?t.master:t[bus]}<input type="range" min="0" max="1" step="0.05" defaultValue={bus==='master'?.65:1} onChange={e=>audio.setVolume(bus,Number(e.target.value))}/></label>)}<label>{t.speed}<select value={fast?'fast':'normal'} onChange={e=>useGame.getState().setFast(e.target.value==='fast')}><option value="normal">{t.normal}</option><option value="fast">{t.fast}</option></select></label><label>{t.motion}<input type="checkbox" checked={reduced} onChange={e=>useGame.getState().setReduced(e.target.checked)}/></label><button onClick={()=>void linkGoogle().catch(error=>useOnline.setState({error:error.message}))}>{t.googleLink}</button><a href="/reglamento">{t.help} ↗</a><a href="/privacidad">{t.privacy} ↗</a><a href="/terminos">{t.terms} ↗</a></div></Modal>;
}
function Gallery({kind}:{kind:'animations'|'sounds'}){
 const scene=useRef<Scene|null>(null);const [speed,setSpeed]=useState(1),[loop,setLoop]=useState(false),[current,setCurrent]=useState('deal');
 const names=kind==='sounds'?sounds:['shuffle','deal','sample','select','play','piece','trick','parda','truco','envido','flor','collect','points','victory','defeat','idle','thinking','sena','disconnect'];
 function preview(name:string){void audio.unlock().then(()=>audio.play(name==='idle'||name==='thinking'||name==='disconnect'?'button':name as typeof sounds[number]));scene.current?.animate(name as AnimationName,speed);setCurrent(name);}
 useEffect(()=>{if(!loop)return;const id=setInterval(()=>{scene.current?.animate(current as AnimationName,speed);audio.play(current as typeof sounds[number]);},2000/speed);return()=>clearInterval(id);},[loop,current,speed]);
 return <div className={s.app}><Suspense><SceneView onReady={value=>{scene.current=value;}}/></Suspense><div className={s.gallery}><a href="/">← {t.back}</a><h1>{t.gallery}</h1><h2>{kind==='sounds'?t.sounds:t.animations}</h2><label>{t.speedLabel}<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.25,.5,1].map(n=><option key={n} value={n}>{n}×</option>)}</select></label><label>{t.repeat} <input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/></label><div className={s.galleryButtons}>{names.map(name=><button key={name} onClick={()=>preview(name)}>{name}</button>)}</div></div></div>;
}
function RulePage(){return <main className={s.document}><a href="/">← {t.back}</a><h1>{t.help}</h1>{t.rulesIntro.map(rule=><section key={rule.title}><h2>{rule.title}</h2><p>{rule.body}</p></section>)}</main>;}
export default function App(){
 const [entered,setEntered]=useState(sessionStorage.getItem('boliche-entered')==='1'||location.search.includes('local=1'));
 const [panel,setPanel]=useState<'options'|'play'|'shop'|'menu'|'chat'|'friends'|'senas'|null>(null);const [mode,setMode]=useState<2|4>(2);
 const online=useOnline();const effectiveMode=online.snapshot?.seats??mode;
 const playing=useGame(x=>x.playing),view=useGame(x=>x.view),fast=useGame(x=>x.fast);const sceneRef=useRef<Scene|null>(null);
 useEffect(()=>{const params=new URLSearchParams(location.search);if(params.get('local')==='1'){useGame.getState().start(params.get('mode')==='2v2'?4:2);setMode(params.get('mode')==='2v2'?4:2);}else {const code=location.pathname.match(/^\/sala\/([A-Z2-9]{6})$/)?.[1]??sessionStorage.getItem('boliche_room_v1');if(code){setEntered(true);void joinRoom(code);}}return()=>{disconnectOnline();useGame.getState().stop();};},[]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,select,textarea')||panel||!playing)return;const state=useGame.getState();const legal=state.view?.legal??[];let action:Action|undefined;const key=e.key.toLowerCase();if(['1','2','3'].includes(key))action=legal.filter(a=>a.type==='PLAY_CARD')[Number(key)-1];else if(key==='t')action=legal.find(a=>a.type==='TRUCO');else if(['e','r','f'].includes(key))action=legal.find(a=>a.type==='ENVIDO'&&a.bid===key.toUpperCase());else if(key==='q')action=legal.find(a=>a.type==='QUIERO');else if(key==='n')action=legal.find(a=>a.type==='NO_QUIERO');else if(key==='m')action=legal.find(a=>a.type==='MAZO');else if(key==='escape')setPanel('menu');else if(key==='c')setPanel('chat');else if(key==='s'&&state.view?.seats===4)setPanel('senas');if(action){e.preventDefault();state.send(action);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[playing,panel]);
 if(import.meta.env.DEV&&location.pathname.startsWith('/dev/'))return <Gallery kind={location.pathname.includes('sonidos')?'sounds':'animations'}/>;
 if(location.pathname==='/reglamento')return <RulePage/>;
 const enter=()=>{void audio.unlock();sessionStorage.setItem('boliche-entered','1');setEntered(true);audio.play('button');};
 const start=()=>{void audio.unlock();setPanel(null);if(online.code&&view?.winner!==null){if(online.snapshot?.private)void roomOperation('rematch');else{disconnectOnline();setPanel('play');}return;}useGame.getState().start(mode);};
 const legal=view?.legal??[],hand=(view?.hands[view.seat]??[]).filter((c):c is CardId=>c!==null);const isTurn=legal.some(a=>a.type==='PLAY_CARD');
 return <div className={`${s.app} ${playing?s.inGame:''}`} data-testid="app"><Suspense fallback={<div className="scene"/>}><SceneView menu={!playing} mode={effectiveMode} onReady={scene=>{sceneRef.current=scene;}}/></Suspense><div className={s.vignette}/>
  <header className={s.topbar}><a className={s.wordmark} href="/" aria-label={t.brand}><svg className={s.brandIcon} width="37" height="43" viewBox="0 0 40 46" aria-hidden="true"><path d="M24 23L31 4M8 24Q3 44 20 44Q37 44 32 24Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><ellipse cx="20" cy="24" rx="12" ry="5" fill="none" stroke="currentColor" strokeWidth="3"/></svg><span>{t.brandTop}<span>{t.brandBottom}</span></span></a><div className={s.topRight}><span className={s.profile}><span className={s.avatar}>M</span><span>{online.profile?.nickname??t.you}<small>{t.level} 1</small></span></span><span className={s.wallet}><span>▰</span> {online.profile?.wallet??10} <small>{t.tokens}</small></span><button className={s.icon} onClick={()=>{audio.play('button');setPanel(playing?'menu':'options');}} aria-label={t.options}>☰</button></div></header>
  {!entered?<div className={s.splash}><div className={s.stamp}>UY · 2026</div><h1>{t.brand}</h1><p>{t.splashNote}</p><button className={s.primary} onClick={enter}>{t.enter} <span>→</span></button></div>:!playing?<><section className={s.hero}><p className={s.eyebrow}>{t.eyebrow}</p><h1>{t.brandLine1}<br/><em>{t.brandLine2}</em><span className={s.titleUnderline}/></h1><p className={s.tagline}>{t.tagline}</p><div className={s.heroActions}><button className={s.primary} onClick={()=>{audio.play('button');setPanel('play');}}>{t.play}<span>→</span></button><div className={s.secondaryRow}><button onClick={()=>setPanel('shop')}>{t.shop}</button><button onClick={()=>setPanel('options')}>{t.options}</button></div></div><p className={s.note}>{t.footer}</p></section><div className={s.menuPlaque}><span>◈</span><div>30<small>{t.target.replace('{n}','30')}</small></div><i/>{t.one}<span>◈</span></div></>:view?<>
   <div className={s.score} aria-label={`${t.us} ${view.scores[team(view.seat)]}, ${t.them} ${view.scores[1-team(view.seat)]}`}><div><small>{t.us}</small><strong>{view.scores[team(view.seat)]}</strong></div><span>:</span><div><small>{t.them}</small><strong>{view.scores[1-team(view.seat)]}</strong></div><span className={s.target}>{t.target.replace('{n}',String(view.config.targetScore))}</span></div>
   <div className={s.rivalName}><span className={s.rivalDot}/>{online.snapshot?.members[(view.seat+(view.seats===4?2:1))%view.seats]?.nickname??(view.seats===4?t.partner:t.rival)}<small>{view.turn===(view.seat+(view.seats===4?2:1))%view.seats?t.waiting:t.hand+' '+view.handNo}</small></div>
   <div className={`${s.turn} ${isTurn?s.active:''}`} role="status">{view.handWinner!==null?t.finish:isTurn?t.turn:t.waiting}<span className={s.timer} key={view.seq} style={{animationDuration:`${view.config.turnSeconds}s`}}/></div>
   <Speech key={view.seq} view={view}/>
   <span className={s.sampleLabel}>{t.sample} · {view.sample}</span>
   <div className={s.localHand} aria-label={t.choose}>{hand.map((card,index)=><Card key={`${view.handNo}-${card}`} card={card} sample={view.sample} index={index} disabled={!legal.some(a=>a.type==='PLAY_CARD'&&a.cardId===card)} onPlay={()=>useGame.getState().send({type:'PLAY_CARD',cardId:card})}/>)}</div>
   <div className={s.actionBar} aria-label={t.choose}>{legal.filter(a=>a.type!=='PLAY_CARD'&&a.type!=='NEXT_HAND').map(a=><button key={JSON.stringify(a)} className={a.type==='QUIERO'||a.type==='TRUCO'?s.call:''} onClick={()=>useGame.getState().send(a)}>{actionLabel(a,view.value)}</button>)}{view.handWinner!==null&&view.winner===null?<button className={s.primary} onClick={()=>useGame.getState().send({type:'NEXT_HAND'})}>{t.next} →</button>:null}</div>
   <div className={s.gameTools}><button className={s.icon} onClick={()=>setPanel('chat')} aria-label={t.chat}>···</button>{effectiveMode===4?<button className={s.icon} onClick={()=>setPanel('senas')} aria-label={t.signals}>◡</button>:null}<span>{online.code?`${t.room} · ${online.code}`:t.practiceNote}</span></div>
   {view.revealed.length>0&&view.handWinner!==null?<div className={s.revealed} aria-label={t.reveal}>{view.revealed.map(r=><div key={r.seat}>{r.cards.map(c=><span key={c}><CardArt card={c}/></span>)}</div>)}</div>:null}
   {view.winner!==null?<Modal title={view.winner===team(view.seat)?t.win:t.lose} onClose={()=>{useGame.getState().stop();}}><p>{view.scores[0]} — {view.scores[1]}</p><p>{t.earned}: {view.winner===team(view.seat)?50:20}</p><button className={s.primary} onClick={start}>{t.again} →</button><button onClick={()=>useGame.getState().stop()}>{t.home}</button></Modal>:null}
  </>:null}
  {panel==='options'?<Options onClose={()=>setPanel(null)}/>:null}
  {panel==='play'?<Modal title={t.play} onClose={()=>setPanel(null)}><p>{t.free}</p><div className={s.modeSelect}>{([2,4] as const).map(n=><button key={n} aria-pressed={mode===n} onClick={()=>setMode(n)}><strong>{n===2?t.one:t.two}</strong><span>{n===2?'◉  ◉':'◉ ◉  ◉ ◉'}</span></button>)}</div><button className={s.primary} onClick={start}>{t.local} <span>→</span></button><button onClick={()=>setPanel('friends')}>{t.friend}</button><OnlinePlay mode={mode} onClose={()=>setPanel(null)}/></Modal>:null}
  {panel==='shop'?<Modal title={t.shop} onClose={()=>setPanel(null)}><p>{t.androidOnly}</p><div className={s.shopGrid}><div className={s.shopCard}><span>◉</span><h3>{t.rival}</h3><p>{t.equipped}</p></div><div className={s.shopCard}><span>◉</span><h3>{t.partner}</h3><p>{t.equipped}</p></div></div></Modal>:null}
  {panel==='menu'?<Modal title={t.menu} onClose={()=>setPanel(null)}><button onClick={()=>setPanel('options')}>{t.options}</button><a href="/reglamento">{t.help}</a><p>{t.abandonWarning}</p><button onClick={()=>{if(online.code)void roomOperation('abandon');else useGame.getState().stop();setPanel(null);history.replaceState(null,'','/');}}>{t.confirmAbandon}</button></Modal>:null}
  {panel==='chat'?<Modal title={t.chat} onClose={()=>setPanel(null)}>{t.phrases.map(phrase=><button key={phrase} onClick={()=>{if(online.code)sendChat(t.phrases.indexOf(phrase));else audio.play('chat');setPanel(null);}}>{phrase}</button>)}</Modal>:null}
  {panel==='friends'?<Modal title={t.friend} onClose={()=>setPanel(null)}><OnlinePlay mode={mode} onClose={()=>setPanel(null)}/></Modal>:null}
  {panel==='senas'?<Modal title={t.senaTitle} onClose={()=>setPanel(null)}>{Object.entries(t.senaLabels).map(([gesture,label])=><button key={gesture} onClick={()=>{if(online.code)sendSena(gesture);else sceneRef.current?.animate('sena');setPanel(null);}}>{label}</button>)}</Modal>:null}
  {online.status==='lobby'?<Modal title={t.room} onClose={()=>void roomOperation('abandon')}><Lobby/></Modal>:null}
  {online.status==='queued'?<Modal title={t.searching} onClose={()=>{void cancelSearch(mode);}}><Queue mode={mode}/></Modal>:null}
  {online.status==='reconnecting'?<div className={s.reconnecting} role="alert">{t.connectionLost}</div>:null}
  {online.error?<Modal title={t.brand} onClose={()=>useOnline.setState({error:null})}><ErrorPanel/></Modal>:null}
  {online.chat&&Date.now()-online.chat.at<2500?<div key={online.chat.at} className={s.chatBubble}>{t.phrases[online.chat.phrase]}</div>:null}
  {online.sena&&online.sena.seat===view?.seat&&online.sena.gesture!=='tic'?<div key={online.sena.at} className={s.senaConfirmation}>{t.senaSent.replace('{sena}',t.senaLabels[online.sena.gesture as keyof typeof t.senaLabels])}</div>:null}
  {fast?<span className={s.fastIndicator}>2×</span>:null}
 </div>;
}
