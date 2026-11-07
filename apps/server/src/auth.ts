import {createClient} from '@supabase/supabase-js';
import {type Env,type Profile} from './types';
import {accountCall} from './Accounts';
export const cookieName='boliche_session_v1';
export function sessionToken(request:Request):string|null{return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)??null;}
export async function verifiedUid(request:Request,env:Env):Promise<string|null>{
 const authorization=request.headers.get('Authorization');if(!authorization)return null;
 if(!authorization.startsWith('Bearer ')||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)throw new Error('AUTH');
 const client=createClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await client.auth.getClaims(authorization.slice(7));
 if(error||!data?.claims||data.claims.iss!==env.SUPABASE_URL.replace(/\/$/,'')+'/auth/v1'||data.claims.aud!=='authenticated')throw new Error('AUTH');const user=await client.auth.getUser(authorization.slice(7));if(user.error||user.data.user?.id!==data.claims.sub)throw Error('AUTH');return data.claims.sub;
}
export async function identity(request:Request,env:Env):Promise<Profile|null>{
 const token=sessionToken(request);if(!token)return null;const profile=await accountCall<Profile|null>(env,{op:'session',token});if(!profile)return null;
 const uid=await verifiedUid(request,env);if(uid)await accountCall(env,{op:'link',id:profile.id,uid});return profile;
}
export function sessionCookie(request:Request,token:string,clear=false){return `${cookieName}=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:31536000}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
