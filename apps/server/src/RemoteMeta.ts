import type {CommerceCredit} from '../../../packages/shared/src/mobile';
import {createClient} from '@supabase/supabase-js';
import type {Env,Profile} from './types';
import {catalog} from '../../../packages/shared/src/catalog';
export class RemoteMeta{
 client;
 constructor(env:Env){this.client=createClient(env.SUPABASE_URL!,env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
 async call<T>(command:unknown):Promise<T>{const {data,error}=await this.client.rpc('meta_command',{p_command:{...(command as Record<string,unknown>),catalog}});if(error){const code=['BALANCE','ITEM_LOCKED','ACCOUNT_EXISTS','PROFILE'].find(code=>error.message.includes(code));throw Error(code??'REMOTE_META');}return data as T;}
 async commerce(credit:CommerceCredit){const {data,error}=await this.client.rpc('commerce_command',{p_credit:credit});if(error)throw Error('REMOTE_META');return data as {ok:true;duplicate?:boolean;limited?:boolean;ignored?:boolean};}
 bootstrap(profile:Profile,uid:string,history?:{ledger:unknown[];results:unknown[]}){return this.call<Profile>({op:'bootstrap',profile,uid,history});}
}
export function remoteMeta(env:Env){return env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SERVICE_ROLE_KEY?new RemoteMeta(env):null;}
