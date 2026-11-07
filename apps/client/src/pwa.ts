import {useSyncExternalStore} from 'react';
const listen=(change:()=>void)=>{window.addEventListener('online',change);window.addEventListener('offline',change);return()=>{window.removeEventListener('online',change);window.removeEventListener('offline',change);};};
export const useConnected=()=>useSyncExternalStore(listen,()=>navigator.onLine,()=>true);
export const practiceAgeKey='boliche-practice-13';
interface InstallEvent extends Event{prompt():Promise<{outcome:'accepted'|'dismissed'}>}
let prompt:InstallEvent|null=null;
const installListeners=new Set<()=>void>();
const subscribe=(change:()=>void)=>{installListeners.add(change);return()=>{installListeners.delete(change);};};
function changed(){for(const change of installListeners)change();}
export const useInstallAvailable=()=>useSyncExternalStore(subscribe,()=>prompt!==null,()=>false);
export async function installPwa(){const event=prompt;if(!event)return;prompt=null;changed();await event.prompt();}
export function startPwa(){
 if(!import.meta.env.PROD||!('serviceWorker' in navigator)||location.hostname==='localhost'&&navigator.userAgent.includes('; wv)'))return;
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallEvent;changed();});
 window.addEventListener('appinstalled',()=>{prompt=null;changed();});
 const register=()=>{setTimeout(()=>void navigator.serviceWorker.register('/sw.js').catch(()=>{}),1500);};
 if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
