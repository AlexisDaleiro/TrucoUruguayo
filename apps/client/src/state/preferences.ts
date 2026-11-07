import {create} from 'zustand';
export interface Preferences{fast:boolean;reduced:boolean;haptics:boolean;quality:'auto'|'high'|'medium'|'low';telemetry:boolean;}
const defaults:Preferences={fast:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,haptics:matchMedia('(pointer: coarse)').matches,quality:'auto',telemetry:false};
function saved(){try{return {...defaults,...JSON.parse(localStorage.getItem('boliche-preferences')??'{}')} as Preferences;}catch{return defaults;}}
export const usePreferences=create<Preferences>(()=>saved());
export function setPreferences(values:Partial<Preferences>){usePreferences.setState(values);try{localStorage.setItem('boliche-preferences',JSON.stringify(usePreferences.getState()));}catch{/* Private mode retains settings in memory. */}}
