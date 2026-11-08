import {useReducedMotion} from '../hooks/useReducedMotion';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Scene} from './Scene';
import {useGame} from '../state/game';
import {useOnline} from '../network/online';
import {usePreferences} from '../state/preferences';
export default function SceneView({menu=true,mode=2,onReady,fallback}:{menu?:boolean;mode?:2|4;onReady?:(scene:Scene)=>void;fallback?:ReactNode}){
 const [drawn,setDrawn]=useState(false);
 const systemReduced=useReducedMotion();const host=useRef<HTMLDivElement>(null),scene=useRef<Scene|null>(null);const view=useGame(s=>s.view),reduced=useGame(s=>s.reduced)||systemReduced,fast=useGame(s=>s.fast);
 const snapshot=useOnline(state=>state.snapshot),profile=useOnline(state=>state.profile),quality=usePreferences(state=>state.quality);
 const characters=snapshot?.members.map(member=>`${member?.character??'washington'}:${member?.characterVariant??'base'}`).join(',')??[`${profile?.character??'marta'}:${profile?.loadout.characterVariant??'base'}`,'washington:base','marta:base','washington:camisa_roja'].slice(0,mode).join(',');
 const skin=profile?.loadout.cardSkin==='cards_celeste'?'celeste':'classica';const environment=snapshot?.environment??(profile?.loadout.environmentVariant?(profile.loadout.environment==='env_boliche'?'boliche':'galpon'):'auto');
 const senas=useOnline(s=>s.senas);const lastSignal=useRef(0);const latest=useRef({mode,menu,onReady,characters,skin,environment,quality,reduced,fast});latest.current={mode,menu,onReady,characters,skin,environment,quality,reduced,fast};
 useEffect(()=>{
  const current=new Scene();scene.current=current;
  let paint=0;
  void current.init(host.current!).then(async()=>{
   if(current.destroyed)return;
   const props=latest.current;
   current.update(useGame.getState().view,props.mode,props.menu,props.reduced,props.fast,props.characters);
   await current.setCosmetics(props.skin as 'classica'|'celeste',props.environment as 'auto'|'galpon'|'boliche',props.quality);
   if(current.destroyed)return;
   for(const signal of useOnline.getState().senas){if(signal.id>lastSignal.current&&Date.now()-signal.at<2500){current.showGesture(signal.seat,signal.gesture);lastSignal.current=signal.id;}}
   paint=requestAnimationFrame(()=>{setDrawn(true);props.onReady?.(current);});
  }).catch(error=>{if(!current.destroyed){console.error(error);host.current?.setAttribute('data-error','true');}});
  return()=>{cancelAnimationFrame(paint);current.destroy();};
 },[]);
 useEffect(()=>{scene.current?.update(view,mode,menu,reduced,fast,characters);},[view,mode,menu,reduced,fast,characters]);
 useEffect(()=>{void scene.current?.setCosmetics(skin,environment as 'auto'|'galpon'|'boliche',quality).catch(error=>console.error(error));},[skin,environment,quality]);
 useEffect(()=>{if(!scene.current?.ready)return;for(const signal of senas){if(signal.id>lastSignal.current){scene.current.showGesture(signal.seat,signal.gesture);lastSignal.current=signal.id;}}},[senas]);
 return <>{!drawn?fallback:null}<div className="scene" ref={host} data-testid="scene" data-drawn={drawn} style={{visibility:drawn?'visible':'hidden'}}/></>;
}
