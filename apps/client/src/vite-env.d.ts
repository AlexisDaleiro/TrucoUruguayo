/// <reference types="vite/client" />
interface Window {bolicheDebug?:{view:()=>import('../../../packages/engine/src/index').PlayerView|null;fast:()=>void};}
interface Window {bolicheNetwork?:{raw:(value:unknown)=>void;cut:()=>void;events:()=>{chat:{seat:number;phrase:number;at:number}|null;sena:{seat:number;gesture:string;at:number}|null;senas:{seat:number;gesture:string;at:number;id:number}[];error:string|null}};}
