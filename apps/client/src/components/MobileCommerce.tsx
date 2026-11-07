import {useEffect,useState} from 'react';
import type {PurchasesPackage} from '@revenuecat/purchases-capacitor';
import {demoRewardedUnit,passProduct,tokenPacks,type MobileConfig} from '../../../../packages/shared/src/mobile';
import {api} from '../network/auth';
import {reloadProfile,useMeta} from '../state/meta';
import {useGame} from '../state/game';
import {useConnected} from '../pwa';
import {t} from '../i18n';
import s from '../App.module.css';

const demo:MobileConfig={adUnit:demoRewardedUnit,testAds:true,revenueCatKey:null};
let billingTransition:Promise<unknown>=Promise.resolve(),adInitialized=false;
function billing(config:MobileConfig,profileId:string){
 const operation=billingTransition.catch(()=>{}).then(async()=>{
  const {Purchases}=await import('@revenuecat/purchases-capacitor');
  const {isConfigured}=await Purchases.isConfigured();
  if(!isConfigured)await Purchases.configure({apiKey:config.revenueCatKey!,appUserID:profileId});
  else if((await Purchases.getAppUserID()).appUserID!==profileId)await Purchases.logIn({appUserID:profileId});
  return Purchases;
 });
 billingTransition=operation;return operation;
}
async function watchForCredit(wallet:number,pass:number){
 for(let attempt=0;attempt<5;attempt++){
  await new Promise(resolve=>setTimeout(resolve,attempt===0?650:1600));
  await reloadProfile();
  const profile=useMeta.getState().profile;
  if(profile&&(profile.wallet!==wallet||(profile.passUntil??0)!==pass))return true;
 }
 return false;
}
export default function MobileCommerce({preview=false,onlyAds=false}:{preview?:boolean;onlyAds?:boolean}){
 const profile=useMeta(state=>state.profile),playing=useGame(state=>state.playing),connected=useConnected();
 const [config,setConfig]=useState<MobileConfig|null>(preview?demo:null);
 const [products,setProducts]=useState<PurchasesPackage[]>([]);
 const [age,setAge]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [privacy,setPrivacy]=useState(()=>localStorage.getItem('boliche-ad-privacy')==='1');
 const profileId=profile?.id,ageConfirmed=profile?.age13Confirmed;
 useEffect(()=>{
  if(preview||!connected||!ageConfirmed||!profileId)return;
  let active=true;
  void api<MobileConfig>('/api/mobile/config').then(async remote=>{
   if(!active)return;
   const next=import.meta.env.VITE_ANDROID_REAL_ADS==='1'?remote:{...demo,revenueCatKey:remote.revenueCatKey};
   setConfig(next);
   if(next.revenueCatKey&&!onlyAds){
    const sdk=await billing(next,profileId);
    const offers=await sdk.getOfferings();
    if(active)setProducts(offers.current?.availablePackages??[]);
   }
  }).catch(()=>{if(active)setStatus(t.mobileUnavailable);});
  return()=>{active=false;};
 },[preview,connected,ageConfirmed,profileId,onlyAds]);
 const disabled=busy||playing||!connected||!profile?.age13Confirmed||preview;
 async function run(task:()=>Promise<string>){
  if(disabled)return;
  setBusy(true);setStatus('');
  try{setStatus(await task());}
  catch(error){setStatus(error instanceof Error&&error.message==='AD_LIMIT'?t.mobileLimit:t.mobileUnavailable);}
  finally{setBusy(false);}
 }
 async function showAd(){
  if(!config||!age||!profile)throw Error('UNAVAILABLE');
  const {AdMob,AdmobConsentStatus,MaxAdContentRating}=await import('@capacitor-community/admob');
  let nonce:string|undefined;
  if(!config.testAds){
   let consent=await AdMob.requestConsentInfo();
   if(consent.status===AdmobConsentStatus.REQUIRED&&consent.isConsentFormAvailable)consent=await AdMob.showConsentForm();
   const required=consent.privacyOptionsRequirementStatus==='REQUIRED';setPrivacy(required);localStorage.setItem('boliche-ad-privacy',required?'1':'0');
   if(!consent.canRequestAds)throw Error('UNAVAILABLE');
   const response=await api<{nonce?:string;error?:string}>('/api/mobile/ad-intent',{});
   if(!response.nonce)throw Error(response.error??'UNAVAILABLE');
   nonce=response.nonce;
  }
  if(!adInitialized){await AdMob.initialize({initializeForTesting:config.testAds,maxAdContentRating:MaxAdContentRating.ParentalGuidance});adInitialized=true;}
  await AdMob.prepareRewardVideoAd({adId:config.adUnit,isTesting:config.testAds,npa:true,ssv:nonce?{customData:nonce}:undefined});
  await AdMob.showRewardVideoAd();
  if(config.testAds)return t.mobileTestNote;
  return await watchForCredit(profile.wallet,profile.passUntil??0)?t.mobileUpdated:t.mobilePending;
 }
 async function buy(item?:PurchasesPackage){
  if(!config?.revenueCatKey||!profile)throw Error('UNAVAILABLE');
  const sdk=await billing(config,profile.id);
  if(item)await sdk.purchasePackage({aPackage:item});else await sdk.restorePurchases();
  return await watchForCredit(profile.wallet,profile.passUntil??0)?t.mobileUpdated:t.mobilePending;
 }
 function pack(id:string){return products.find(item=>item.product.identifier===id);}
 return <section className={s.mobileCommerce}>
  {playing?<p>{t.mobileStopMatch}</p>:null}
  <article className={s.mobileReward}>
   <h3>{t.mobileAdsTitle}</h3>
   {config?.testAds?<p>{t.mobileTestNote}</p>:null}
   <label className={s.checkbox}><input type="checkbox" checked={age} disabled={playing||!connected} onChange={event=>setAge(event.target.checked)}/>{t.mobileAdAge}</label>
   <button className={s.primary} disabled={disabled||!config||!age} onClick={()=>void run(showAd)}>{config?.testAds?t.mobileAdTest:t.mobileAdAction}</button>
   {privacy&&config&&!config.testAds?<button disabled={disabled} onClick={()=>void run(async()=>{const {AdMob}=await import('@capacitor-community/admob');await AdMob.showPrivacyOptionsForm();return '';})}>{t.mobilePrivacy}</button>:null}
  </article>
  {!onlyAds?<><div className={s.mobilePacks}>{Object.entries(tokenPacks).map(([id,amount])=>{
   const item=pack(id);
   return <article className={s.shopCard} key={id}>
    <h3>{amount} {t.tokens}</h3><p>{item?.product.priceString??t.mobilePlayPrice}</p>
    <button disabled={disabled||!item} onClick={()=>void run(()=>buy(item))}>{t.mobileBuy}</button>
   </article>;
  })}</div>
  <article className={s.mobileReward}><h3>{t.passName}</h3><p>{t.passDescription}</p><p>{t.mobileMonthlyPrice} · {pack(passProduct)?.product.priceString??t.mobilePlayPrice}</p>
   <button disabled={disabled||!pack(passProduct)} onClick={()=>void run(()=>buy(pack(passProduct)))}>{t.mobileBuy}</button>
   <button disabled={disabled||!config?.revenueCatKey} onClick={()=>void run(()=>buy())}>{t.mobileRestore}</button>
  </article></>:null}
  {status?<p role="status">{status}</p>:null}
 </section>;
}
