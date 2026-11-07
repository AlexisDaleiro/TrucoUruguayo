import {Capacitor} from '@capacitor/core';
import {publicOrigin} from '../../../packages/shared/src/mobile';

export const isAndroid=Capacitor.getPlatform()==='android';
export const publicSite=isAndroid?new URL(import.meta.env.VITE_ANDROID_API_ORIGIN||publicOrigin).origin:location.origin;
const sessionKey='boliche-android-session-v1';
export function saveNativeSession(token:string|null){
 if(!isAndroid)return;
 if(token)localStorage.setItem(sessionKey,token);else localStorage.removeItem(sessionKey);
}
export function serverFetch(path:string,options:RequestInit={}){
 if(!isAndroid)return fetch(path,options);
 const headers=new Headers(options.headers);
 const token=localStorage.getItem(sessionKey);if(token)headers.set('X-Boliche-Session',token);
 return fetch(new URL(path,publicSite),{...options,headers,credentials:'omit'});
}
export function hapticCue(strong=false){
 if(!isAndroid)return;
 void import('@capacitor/haptics').then(({Haptics,ImpactStyle})=>Haptics.impact({style:strong?ImpactStyle.Medium:ImpactStyle.Light})).catch(()=>{});
}
export async function shareInvite(url:string,title:string){
 if(isAndroid){const {Share}=await import('@capacitor/share');await Share.share({title,url});return;}
 if(navigator.share){await navigator.share({title,url});return;}
 await navigator.clipboard.writeText(url);
}
