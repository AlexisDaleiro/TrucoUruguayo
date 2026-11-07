import type {RulesConfig,State} from '../../../packages/engine/src/index';
export interface Env {ASSETS:Fetcher;ACCOUNTS:DurableObjectNamespace;MATCH_ROOM:DurableObjectNamespace;MATCHMAKER:DurableObjectNamespace;SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string;SUPABASE_SERVICE_ROLE_KEY?:string;}
export interface Profile {id:string;nickname:string;character:'washington'|'marta';wallet:number;xp:number;mmr:number;createdAt:number;regenAt:number;loadout:Record<string,string>;}
export interface Member {id:string;nickname:string;character:'washington'|'marta';ready:boolean;bot:boolean;originalBot:boolean;disconnectedAt:number|null;returning:boolean;abandoned:boolean;mmr?:number;}
export interface RoomData {code:string;matchId:string;host:string;seats:2|4;rules:Partial<RulesConfig>;members:(Member|null)[];state:State|null;hasBots:boolean;private:boolean;environment:string|null;createdAt:number;updatedAt:number;deadline:number|null;botAt:number|null;nextHandAt:number|null;roomSeq:number;finished:boolean;partnerSignals?:Record<number,{gesture:string;handNo:number}>;}
export interface Attachment {profileId:string;seat:number;windowStart:number;messages:number;lastChat:number;lastSena:number;signaledHand?:number;}
export function stub(namespace:DurableObjectNamespace,name:string){return namespace.get(namespace.idFromName(name));}
export function internal(body:unknown,path='/'):Request{return new Request('https://internal'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
