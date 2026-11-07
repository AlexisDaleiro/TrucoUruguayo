export async function readJson(request:Request):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)return {};let size=0;let text='';const decoder=new TextDecoder();
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw new Error('INVALID_REQUEST');}text+=decoder.decode(value,{stream:true});}
 text+=decoder.decode();try{return JSON.parse(text||'{}');}catch{throw new Error('INVALID_REQUEST');}
}
