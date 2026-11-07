import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const run=promisify(execFile),execute=process.argv.includes('--execute');
interface Manifest{profiles:Record<string,{voice:string;pitch:string;rate:string;eq:number}>;lines:{id:string;emotion:string;variants:string[]}[];}
const manifest:Manifest=JSON.parse(await readFile('assets-src/voices/voice-lines.json','utf8'));
const escape=(value:string)=>value.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
const key=process.env.AZURE_SPEECH_KEY,region=process.env.AZURE_SPEECH_REGION;
const cache=path.resolve('assets-src/voices/cache'),output=path.resolve('apps/client/public/assets/voices');await mkdir(cache,{recursive:true});await mkdir(output,{recursive:true});
if(execute&&(!key||!region||process.env.AZURE_SPEECH_TIER!=='S0'))throw Error('Configurar AZURE_SPEECH_KEY, AZURE_SPEECH_REGION y AZURE_SPEECH_TIER=S0 antes de --execute.');
if(execute){const response=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,{headers:{'Ocp-Apim-Subscription-Key':key!}});if(!response.ok)throw Error(`Azure voices/list HTTP ${response.status}`);const voices=await response.json() as {ShortName:string}[];for(const profile of Object.values(manifest.profiles))if(!voices.some(v=>v.ShortName===profile.voice))throw Error(`Voz no disponible: ${profile.voice}`);}
let missing=0;
for(const [character,profile]of Object.entries(manifest.profiles)){
 const clips:{id:string;variant:number;start:number;duration:number;envelope:number[]}[]=[];const wavs:string[]=[];let offset=0;
 for(const line of manifest.lines)for(const [variant,text]of line.variants.entries()){
  const volume=line.emotion==='canto'?'+3dB':'0dB',rate=line.emotion==='canto'?'+8%':profile.rate;
  const ssml=`<speak version="1.0" xml:lang="${profile.voice.slice(0,5)}"><voice name="${profile.voice}"><prosody pitch="${profile.pitch}" rate="${rate}" volume="${volume}">${escape(text)}</prosody></voice></speak>`;
  const hash=createHash('sha256').update(JSON.stringify({ssml,eq:profile.eq,processor:1})).digest('hex');const raw=path.join(cache,`${hash}-raw.wav`),processed=path.join(cache,`${hash}.wav`);
  let exists=true;try{await access(processed);}catch{exists=false;}
  if(!exists){missing++;if(!execute)continue;const response=await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':key!,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'riff-24khz-16bit-mono-pcm'},body:ssml});if(!response.ok)throw Error(`Azure HTTP ${response.status} (${character}/${line.id}); sin registrar secretos ni respuesta.`);await writeFile(raw,Buffer.from(await response.arrayBuffer()));await run('ffmpeg',['-y','-i',raw,'-af',`silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB,equalizer=f=${profile.eq}:t=q:w=1:g=1.5,loudnorm=I=-16:TP=-1:LRA=7`,'-ar','24000','-ac','1',processed],{windowsHide:true});}
  const probe=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',processed],{windowsHide:true});const duration=Number(probe.stdout.trim());
  const pcm=await run('ffmpeg',['-v','error','-i',processed,'-f','s16le','-ar','1000','-ac','1','pipe:1'],{windowsHide:true,encoding:'buffer',maxBuffer:16*1024*1024});const data=pcm.stdout;const envelope:number[]=[];for(let start=0;start<data.length;start+=80){let sum=0,count=0;for(let p=start;p+1<Math.min(start+80,data.length);p+=2){sum+=(data.readInt16LE(p)/32768)**2;count++;}envelope.push(Math.min(1,Math.sqrt(sum/Math.max(1,count))*4));}
  clips.push({id:line.id,variant,start:offset,duration,envelope});offset+=duration;wavs.push(processed);
 }
 if(missing&&!execute)continue;
 const list=path.join(cache,`${character}-concat.txt`);await writeFile(list,wavs.map(file=>`file '${file.replace(/\\/g,'/').replace(/'/g,"'\\''")}'`).join('\n'));
 for(const [ext,codec]of [['ogg','libopus'],['m4a','aac']])await run('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c:a',codec,'-b:a','64k',path.join(output,`${character}.${ext}`)],{windowsHide:true});
 await writeFile(path.join(output,`${character}.json`),JSON.stringify({version:1,character,clips})+'\n');
}
const status={ready:execute||missing===0,missing,generatedAt:new Date().toISOString(),profiles:Object.keys(manifest.profiles)};await writeFile(path.join(output,'status.json'),JSON.stringify(status)+'\n');console.log(execute?'Sprites OGG/M4A y envolventes generados.':`Dry run: ${missing} clips requieren Azure S0; no se hicieron solicitudes de síntesis.`);
