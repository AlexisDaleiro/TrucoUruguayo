import {generateKeyPairSync,sign} from 'node:crypto';
import {expect,test} from 'vitest';
import {parseRevenueEvent,verifyReward} from './commerce';
import {creditLocal,creditVerifiedAd,issueAdIntent} from './mobileEconomy';
import {MemoryStorage} from '../../../tests/support/storage';
import {parseAppLink,publicOrigin,type CommerceCredit} from '../../../packages/shared/src/mobile';
import type {Profile} from './types';

const baseProfile=(id:string,now:number):Profile=>({id,nickname:'Paisano',character:'washington',wallet:10,xp:0,mmr:1000,createdAt:now,regenAt:now,age13Confirmed:true,loadout:{}});
test('SSV autentica DER P-256 y vincula recompensa, unidad y datos exactos',async()=>{
 const key=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const publicKey=key.publicKey.export({type:'spki',format:'der'}).toString('base64');
 const transaction='0123456789abcdef',nonce=crypto.randomUUID(),at=Date.now();
 const signed=`ad_unit=123&custom_data=${nonce}&reward_amount=2&reward_item=fichas&timestamp=${at}&transaction_id=${transaction}`;
 const signature=sign('sha256',Buffer.from(signed),key.privateKey).toString('base64url');
 const request=(query:string)=>new URL('https://test.invalid/api/hooks/admob?'+query+'&signature='+signature+'&key_id=7');
 const lookup=async(id:string)=>id==='7'?publicKey:undefined;
 expect(await verifyReward(request(signed),'ca-app-pub-111/123',lookup)).toEqual({nonce,ref:'ad:'+transaction,at});
 expect(await verifyReward(request(signed.replace('reward_amount=2','reward_amount=9')),'123',lookup)).toBeNull();
 expect(await verifyReward(request(signed.replace(nonce,crypto.randomUUID())),'123',lookup)).toBeNull();
 expect(await verifyReward(request(signed),'456',lookup)).toBeNull();
 expect(await verifyReward(request(signed+'&custom_data='+nonce),'123',lookup)).toBeNull();
});
test('un nonce y un recibo acreditan una vez, con cinco recompensas por día de Montevideo',async()=>{
 const memory=new MemoryStorage(),storage=memory as unknown as DurableObjectStorage;
 const id=crypto.randomUUID(),now=Date.UTC(2026,10,7,16);await memory.put('profile:'+id,baseProfile(id,now));
 const first=await issueAdIntent(storage,id,now);expect(first.nonce).toBeTruthy();
 expect(await creditVerifiedAd(storage,null,first.nonce!,'ad:first',now,now)).toEqual({ok:true});
 expect(await creditVerifiedAd(storage,null,first.nonce!,'ad:first',now,now)).toMatchObject({duplicate:true});
 expect(await creditVerifiedAd(storage,null,first.nonce!,'ad:changed',now,now)).toMatchObject({ignored:true});
 for(let i=1;i<5;i++){
  const next=await issueAdIntent(storage,id,now+i*1000);
  await creditVerifiedAd(storage,null,next.nonce!,'ad:'+i,now+i*1000,now+i*1000);
 }
 expect((await memory.get<Profile>('profile:'+id))?.wallet).toBe(20);
 expect(await issueAdIntent(storage,id,now+60000)).toMatchObject({error:'AD_LIMIT'});
 const tomorrow=now+86400000,next=await issueAdIntent(storage,id,tomorrow);
 await creditVerifiedAd(storage,null,next.nonce!,'ad:tomorrow',tomorrow,tomorrow);
 expect((await memory.get<Profile>('profile:'+id))?.wallet).toBe(22);
});
test('RevenueCat filtra aplicación, tienda, entorno y producto. El libro usa la transacción de Play',async()=>{
 const now=Date.UTC(2026,10,7,16),id=crypto.randomUUID(),appId='app_fixture';
 const event={id:'eventA',app_id:appId,environment:'SANDBOX',store:'PLAY_STORE',app_user_id:id,type:'NON_RENEWING_PURCHASE',product_id:'fichas_60',transaction_id:'GPA.1234-1234-1234-12345'};
 const first=parseRevenueEvent({event},appId,'SANDBOX')!;
 expect(first).toMatchObject({kind:'pack',id,amount:60});
 for(const patch of [{app_id:'wrong'},{environment:'PRODUCTION'},{store:'APP_STORE'},{product_id:'fichas_900'},{type:'RENEWAL'}])expect(parseRevenueEvent({event:{...event,...patch}},appId,'SANDBOX')).toBeNull();
 const memory=new MemoryStorage(),storage=memory as unknown as DurableObjectStorage;
 const other=crypto.randomUUID();
 await memory.put('profile:'+id,baseProfile(id,now));await memory.put('profile:'+other,baseProfile(other,now));
 await creditLocal(storage,first,now);await creditLocal(storage,{...first,id:other},now);
 expect((await memory.get<Profile>('profile:'+id))?.wallet).toBe(70);
 expect((await memory.get<Profile>('profile:'+other))?.wallet).toBe(10);
 const pass=parseRevenueEvent({event:{...event,id:'paidPass',type:'INITIAL_PURCHASE',product_id:'pase_boliche:mensual',event_timestamp_ms:now,purchased_at_ms:now,expiration_at_ms:now+30*86400000}},appId,'SANDBOX') as Extract<CommerceCredit,{kind:'pass'}>;
 await creditLocal(storage,pass,now);
 await creditLocal(storage,{...pass,ref:'pass:old',at:now-2000,expires:now-1000},now);
 expect(await memory.get('profile:'+id)).toMatchObject({passUntil:now+30*86400000,inventory:['pass_stamp:2026-11']});
});
test('App Links aceptan solo el dominio y las rutas esperadas',()=>{
 expect(parseAppLink(publicOrigin+'/sala/ABCD23',publicOrigin)).toEqual({kind:'room',path:'/sala/ABCD23'});
 expect(parseAppLink(publicOrigin+'/auth/callback?code=abc',publicOrigin)).toEqual({kind:'auth',code:'abc'});
 expect(parseAppLink(publicOrigin+'/auth/callback?code=abc&sb_flow_id=flow-1',publicOrigin)).toEqual({kind:'auth',code:'abc',flowId:'flow-1'});
 expect(parseAppLink('https://otro.invalid/sala/ABCD23',publicOrigin)).toBeNull();
 expect(parseAppLink(publicOrigin+'/sala/../../privacidad',publicOrigin)).toBeNull();
});
