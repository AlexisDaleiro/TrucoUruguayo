export const androidPackage='uy.trucodeboliche.app';
export const androidOrigin='https://localhost';
export const publicOrigin='https://truco-de-boliche.alexisdaleiro.workers.dev';
export const demoRewardedUnit='ca-app-pub-3940256099942544/5224354917';
export const tokenPacks={fichas_20:20,fichas_60:60,fichas_150:150} as const;
export const passProduct='pase_boliche:mensual';
export const adTokens=2;
export const adDailyLimit=5;
export const adIntentTtl=30*60*1000;
const montevideoDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'});
export function localeDay(at:number){
 const parts=montevideoDate.formatToParts(at);
 return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');
}
export type CommerceCredit=
 | {kind:'pack';id:string;ref:string;amount:20|60|150}
 | {kind:'ad';id:string;ref:string}
 | {kind:'pass';id:string;ref:string;at:number;expires:number;periodEnd?:number;stamp?:string};
export interface MobileConfig {adUnit:string;testAds:boolean;revenueCatKey:string|null;}

export function parseAppLink(input:string,origin:string){
 try{
  const url=new URL(input);
  if(url.origin!==origin||url.username||url.password)return null;
  if(/^\/sala\/[A-Z2-9]{6}$/.test(url.pathname))return {kind:'room' as const,path:url.pathname};
  if(url.pathname==='/auth/callback'){
   const code=url.searchParams.get('code'),flowId=url.searchParams.get('sb_flow_id');
   if(code&&code.length<256)return {kind:'auth' as const,code,...(flowId?{flowId}:{})};
  }
 }catch{/* A malformed external URL has no destination. */}
 return null;
}
