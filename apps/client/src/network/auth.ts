import {isAndroid,publicSite,saveNativeSession,serverFetch} from '../platform';
import type {SupabaseClient} from '@supabase/supabase-js';
export interface Profile {id:string;nickname:string;character:'washington'|'marta';wallet:number;xp:number;mmr:number;loadout:Record<string,string>;regenAt:number;inventory?:string[];settings?:import('../state/preferences').Preferences;age13Confirmed?:boolean;tutorialDone?:boolean;wins?:number;losses?:number;passUntil?:number;}
interface AuthConfig {mode:'local'|'supabase';url:string|null;key:string|null;profile?:Profile|null;}
let configPromise:Promise<AuthConfig>|null=null;
function authConfig(){return configPromise??=serverFetch('/api/auth/config?profile=1').then(async response=>{if(!response.ok)throw Error('SERVER');return response.json() as Promise<AuthConfig>;}).catch(error=>{configPromise=null;throw error;});}
export async function initialProfile(){
 const config=await authConfig();
 return config.mode==='local'?config.profile??null:(await api<{profile:Profile|null}>('/api/auth/session')).profile;
}
let clientPromise:Promise<SupabaseClient|null>|null=null;
export function authClient():Promise<SupabaseClient|null>{return clientPromise??= (async()=>{const config=await authConfig();if(config.mode!=='supabase'||!config.url||!config.key)return null;const {createClient}=await import('@supabase/supabase-js');return createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:!isAndroid,flowType:isAndroid?'pkce':'implicit'}});})().catch(error=>{clientPromise=null;throw error;});}
export async function api<T>(path:string,body?:unknown):Promise<T>{const client=await authClient();const headers:Record<string,string>={};if(client){const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session)headers.Authorization='Bearer '+data.session.access_token;}if(body!==undefined)headers['Content-Type']='application/json';const response=await serverFetch(path,{method:body===undefined?'GET':'POST',headers,credentials:'same-origin',body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json() as T&{error?:string;sessionToken?:string};if(!response.ok)throw new Error(data.error??'SERVER');if(data.sessionToken)saveNativeSession(data.sessionToken);return data;}
let sessionPromise:Promise<Profile>|null=null;
export function cacheProfile(profile:Profile){sessionPromise=Promise.resolve(profile);}
export function ensureSession(nickname?:string,character?:string,age13Confirmed?:true):Promise<Profile>{return sessionPromise??=(async()=>{const client=await authClient();if(client){const {data}=await client.auth.getSession();if(!data.session){const result=await client.auth.signInAnonymously();if(result.error)throw result.error;}}const current=await api<{profile:Profile|null}>('/api/auth/session');if(current.profile)return current.profile;return (await api<{profile:Profile}>('/api/auth/guest',{nickname,character,age13Confirmed})).profile;})().catch(error=>{sessionPromise=null;throw error;});}
export async function refreshProfile():Promise<Profile>{const result=await api<{profile:Profile}>('/api/auth/session');sessionPromise=Promise.resolve(result.profile);return result.profile;}
export async function linkGoogle(){await ensureSession();const client=await authClient();if(!client)throw new Error('AUTH_CONFIG');const {data,error}=await client.auth.linkIdentity({provider:'google',options:googleOptions()});if(error)throw error;await nativeBrowser(data.url);}
export async function signInGoogle(){const client=await authClient();if(!client)throw Error('AUTH_CONFIG');try{await api('/api/auth/logout',{});}catch(error){if(!(error instanceof Error)||error.message!=='AUTH')throw error;}sessionPromise=null;saveNativeSession(null);const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:googleOptions()});if(error)throw error;await nativeBrowser(data.url);}
const googleOptions=()=>({redirectTo:publicSite+'/auth/callback',skipBrowserRedirect:isAndroid});
async function nativeBrowser(url:string|null){if(isAndroid&&url){const {Browser}=await import('@capacitor/browser');await Browser.open({url});}}
export async function signOut(){await api('/api/auth/logout',{});saveNativeSession(null);const client=await authClient();await client?.auth.signOut();sessionPromise=null;}
export async function forgetAuth(){saveNativeSession(null);const client=await authClient();await client?.auth.signOut({scope:'local'});sessionPromise=null;}
