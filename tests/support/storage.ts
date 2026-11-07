export class MemoryStorage{
 data=new Map<string,unknown>();alarm:number|null=null;failure:((key:string,value:unknown)=>boolean)|null=null;
 async get<T>(key:string){return structuredClone(this.data.get(key)) as T|undefined;}
 async put(key:string,value:unknown){if(this.failure?.(key,value)){this.failure=null;throw Error('STORAGE_UNAVAILABLE');}this.data.set(key,structuredClone(value));}
 async delete(key:string){return this.data.delete(key);}
 async deleteAll(){this.data.clear();}
 async list<T>({prefix=''}:{prefix?:string}={}){return new Map([...this.data].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>[key,structuredClone(value) as T]));}
 async setAlarm(time:number){this.alarm=time;}
 async deleteAlarm(){this.alarm=null;}
 async transaction<T>(action:(tx:DurableObjectTransaction)=>Promise<T>){const snapshot=structuredClone(this.data);try{return await action(this as unknown as DurableObjectTransaction);}catch(error){this.data=snapshot;throw error;}}
}
export function contextFor(storage:MemoryStorage){const ready:Promise<unknown>[]=[];const context={storage,getWebSockets:()=>[],setWebSocketAutoResponse:()=>{},blockConcurrencyWhile:(action:()=>Promise<unknown>)=>{const promise=action();ready.push(promise);return promise;}} as unknown as DurableObjectState;return {context,ready};}
