import {chooseAction} from '../../../../packages/bots/src/index';
import type {PlayerView} from '../../../../packages/engine/src/index';
self.onmessage=(event:MessageEvent<{id:number;view:PlayerView;partnerSignal?:string}>)=>{
 const {id,view,partnerSignal}=event.data;self.postMessage({id,action:chooseAction(view,'medium',Math.random,{partnerSignal})});
};
