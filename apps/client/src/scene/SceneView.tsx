import {useEffect,useRef} from 'react';
import {Scene} from './Scene';
import {useGame} from '../state/game';
export default function SceneView({menu=true,mode=2,onReady}:{menu?:boolean;mode?:2|4;onReady?:(scene:Scene)=>void}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<Scene|null>(null);const view=useGame(s=>s.view),reduced=useGame(s=>s.reduced),fast=useGame(s=>s.fast);
 useEffect(()=>{const current=new Scene();scene.current=current;void current.init(host.current!).then(()=>{current.update(useGame.getState().view,mode,menu,useGame.getState().reduced,useGame.getState().fast);onReady?.(current);}).catch(error=>{console.error(error);host.current?.setAttribute('data-error','true');});return()=>current.destroy();},[]);
 useEffect(()=>{scene.current?.update(view,mode,menu,reduced,fast);},[view,mode,menu,reduced,fast]);
 return <div className="scene" ref={host} data-testid="scene"/>;
}
