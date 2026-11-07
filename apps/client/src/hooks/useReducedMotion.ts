import {useSyncExternalStore} from 'react';
const media=matchMedia('(prefers-reduced-motion: reduce)');
const subscribe=(listener:()=>void)=>{media.addEventListener('change',listener);return()=>media.removeEventListener('change',listener);};
export function useReducedMotion(){return useSyncExternalStore(subscribe,()=>media.matches,()=>false);}
