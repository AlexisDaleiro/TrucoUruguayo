import {useEffect} from 'react';
import {audio} from '../audio/AudioManager';
import {useMeta} from '../state/meta';
import {usePreferences} from '../state/preferences';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {CardArt} from './CardArt';
import s from './MenuScene.module.css';

export function MenuScene({mode=2,ambient=true}:{mode?:2|4;ambient?:boolean}){
 const environment=useMeta(state=>state.profile?.loadout.environmentVariant?state.profile.loadout.environment:undefined);
 const systemReduced=useReducedMotion(),userReduced=usePreferences(state=>state.reduced);
 const reduced=systemReduced||userReduced;
 const night=environment?environment==='env_boliche':mode===4;
 useEffect(()=>{if(ambient)audio.setScene(true,night,0);},[ambient,night]);
 return <div className={`${s.scene} ${night?s.night:''}`} aria-hidden="true" data-testid="menu-scene" data-reduced={reduced}>
  <div className={s.window}><span/></div>
  <div className={s.shelf}>{[0,1,2,3,4].map(i=><i key={i}/>)}</div>
  <div className={s.lamp}><i/><b/><span/></div>
  <div className={s.tv}>
   <div className={s.aerial}/>
   <svg viewBox="0 0 120 74" className={s.screen}>
    <rect width="120" height="74" fill="#719b57"/>
    <path d="M8 8h104v58H8zM60 8v58M8 24h15v26H8m104-26H97v26h15" fill="none" stroke="#e2e3bd" strokeWidth="1.5"/>
    <circle cx="60" cy="37" r="13" fill="none" stroke="#e2e3bd"/>
    <g className={s.home} fill="#ffe098"><circle cx="41" cy="20" r="2.5"/><circle cx="30" cy="45" r="2.5"/><circle cx="61" cy="57" r="2.5"/></g>
    <g className={s.away} fill="#f1eddb"><circle cx="59" cy="21" r="2.5"/><circle cx="90" cy="41" r="2.5"/><circle cx="69" cy="52" r="2.5"/></g>
   </svg>
   <i/><b/>
  </div>
  <div className={s.table}/>
  <img className={s.rival} src={night?'/assets/art/marta-base-preview.webp':'/assets/art/washington-base-preview.webp'} width="320" height="320" alt=""/>
  <div className={s.hand}><span/><span/><span/></div>
  <div className={s.mate}><span/></div>
  <div className={s.cards}><div className={s.back}/><div className={s.face}><CardArt card="7O"/></div></div>
 </div>;
}
