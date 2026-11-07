import {DurableObject} from 'cloudflare:workers';
import {type Env} from './types';
interface Message {id:string;at:number;category:'bug'|'idea'|'other';message:string;}
type Submission=Pick<Message,'category'|'message'>&{profileId:string};
const retention=90*86400000,cooldown=5*60000,dailyLimit=150;
export class Feedback extends DurableObject<Env>{
 async fetch(request:Request){
  if(request.method==='GET'){const rows=await this.ctx.storage.list<Message>({prefix:'message:',reverse:true,limit:100});return Response.json([...rows.values()],{headers:{'Cache-Control':'no-store'}});}
  const body=await request.json() as Submission;const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  const accepted=await this.ctx.storage.transaction(async tx=>{
   const limitKey='limit:'+body.profileId,dayKey='day:'+day;
   if((await tx.get<number>(limitKey)??0)>now)return false;
   const count=await tx.get<number>(dayKey)??0;if(count>=dailyLimit)return false;
   const id=crypto.randomUUID(),row:Message={id,at:now,category:body.category,message:body.message};
   await tx.put('message:'+now+':'+id,row);await tx.put(limitKey,now+cooldown);await tx.put(dayKey,count+1);return true;
  });
  if(!accepted)return Response.json({error:'FEEDBACK_RATE'},{status:429,headers:{'Cache-Control':'no-store'}});
  if(await this.ctx.storage.getAlarm()===null)await this.ctx.storage.setAlarm(now+3600000);
  return Response.json({ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
 }
 async alarm(){
  const now=Date.now();const old=await this.ctx.storage.list({prefix:'message:',end:'message:'+(now-retention)+':',limit:500});
  const limiters=await this.ctx.storage.list<number>({prefix:'limit:',limit:500});
  const daily=await this.ctx.storage.list({prefix:'day:',end:'day:'+new Date(now).toISOString().slice(0,10)});
  const keys=[...old.keys(),...[...limiters].filter(([,expires])=>expires<=now).map(([key])=>key),...daily.keys()];
  for(let i=0;i<keys.length;i+=100)await this.ctx.storage.delete(keys.slice(i,i+100));
  if((await this.ctx.storage.list({limit:1})).size)await this.ctx.storage.setAlarm(now+(old.size>=500?1000:3600000));
 }
}
export async function feedbackAuthorized(request:Request,key?:string){
 const header=request.headers.get('Authorization');if(!key||!header?.startsWith('Bearer ')||header.length>512)return false;
 const digest=async (value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [actual,expected]=await Promise.all([digest(header.slice(7)),digest(key)]);
 return actual.reduce((diff,byte,index)=>diff|(byte^expected[index]),0)===0;
}
