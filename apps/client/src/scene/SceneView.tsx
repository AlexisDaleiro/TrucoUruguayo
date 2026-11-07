import {useEffect,useRef} from 'react';
import {Scene} from './Scene';
import {useGame} from '../state/game';
import {useOnline} from '../network/online';
export default function SceneView({menu=true,mode=2,onReady}:{menu?:boolean;mode?:2|4;onReady?:(scene:Scene)=>void}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Scene|null>(null);const view=useGame(s=>s.view),reduced=useGame(s=>s.reduced),fast=useGame(s=>s.fast);
 const characters=useOnline(s=>s.snapshot?.members.map(m=>m?.character??'washington').join(',')??'');const senas=useOnline(s=>s.senas);const lastSignal=useRef(0);const latest=useRef({mode,menu,onReady,characters});latest.current={mode,menu,onReady,characters};
 useEffect(()=>{const current=new Scene();scene.current=current;void current.init(host.current!).then(()=>{const props=latest.current;current.update(useGame.getState().view,props.mode,props.menu,useGame.getState().reduced,useGame.getState().fast,props.characters);for(const signal of useOnline.getState().senas){if(signal.id>lastSignal.current&&Date.now()-signal.at<2500){current.showGesture(signal.seat,signal.gesture);lastSignal.current=signal.id;}}props.onReady?.(current);}).catch(error=>{console.error(error);host.current?.setAttribute('data-error','true');});return()=>current.destroy();},[]);
 useEffect(()=>{scene.current?.update(view,mode,menu,reduced,fast,characters);},[view,mode,menu,reduced,fast,characters]);
 useEffect(()=>{if(!scene.current?.ready)return;for(const signal of senas){if(signal.id>lastSignal.current){scene.current.showGesture(signal.seat,signal.gesture);lastSignal.current=signal.id;}}},[senas]);
 return <div className="scene" ref={host} data-testid="scene"/>;
}
