import {App as NativeApp} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {SplashScreen} from '@capacitor/splash-screen';
import {StatusBar,Style} from '@capacitor/status-bar';
import {audio} from './audio/AudioManager';
import {authClient,ensureSession} from './network/auth';
import {publicSite} from './platform';
import {parseAppLink} from '../../../packages/shared/src/mobile';

async function open(input:string){
 const link=parseAppLink(input,new URL(publicSite).origin);
 if(link?.kind==='room'){
  if(location.pathname!==link.path)location.assign(link.path);
 }else if(link?.kind==='auth'){
  const client=await authClient();if(!client)return;
  const {error}=await client.auth.exchangeCodeForSession(link.code);
  if(!error){await ensureSession();await Browser.close().catch(()=>{});location.assign('/?entrar=1');}
 }
}
export async function startNative(){
 try{
  await NativeApp.addListener('appStateChange',({isActive})=>{
   document.documentElement.toggleAttribute('data-native-paused',!isActive);
   audio.setAppActive(isActive);
   document.dispatchEvent(new Event('boliche-visibility'));
  });
  await NativeApp.addListener('backButton',()=>{
   const event=new Event('boliche-back',{cancelable:true});
   if(window.dispatchEvent(event))void NativeApp.minimizeApp();
  });
  await NativeApp.addListener('appUrlOpen',({url})=>{void open(url).catch(()=>{});});
  void StatusBar.setStyle({style:Style.Dark}).catch(()=>{});
  const launch=await NativeApp.getLaunchUrl();if(launch)await open(launch.url);
 }finally{await SplashScreen.hide().catch(()=>{});}
}
