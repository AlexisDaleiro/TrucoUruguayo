export type Bus='master'|'music'|'ambience'|'sfx'|'voice'|'ui';
export const sounds=['shuffle','deal','sample','select','play','piece','trick','parda','truco','envido','flor','points','collect','victory','defeat','button','tick','chat','sena','goal'] as const;
export type Sound=typeof sounds[number];
class AudioManager {
 context:AudioContext|null=null; buses=new Map<Bus,GainNode>();muted=false;last=0;
 async unlock(){if(!this.context){this.context=new AudioContext();for(const name of ['master','music','ambience','sfx','voice','ui'] as Bus[]){const gain=this.context.createGain();gain.gain.value=name==='master'?.65:1;this.buses.set(name,gain);}this.buses.get('master')!.connect(this.context.destination);for(const [name,gain]of this.buses)if(name!=='master')gain.connect(this.buses.get('master')!);document.addEventListener('visibilitychange',()=>{if(document.hidden)void this.context?.suspend();else void this.context?.resume();});}await this.context.resume();}
 setVolume(bus:Bus,value:number){const gain=this.buses.get(bus);if(gain&&this.context)gain.gain.setTargetAtTime(value,this.context.currentTime,.05);}
 play(sound:Sound,pan=0){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||this.muted)return;
  const now=ctx.currentTime;const index=sounds.indexOf(sound);const pitch=1+(Math.random()-.5)*.06;
  const voice=ctx.createOscillator();const volume=ctx.createGain();const panner=ctx.createStereoPanner();panner.pan.value=pan;
  voice.type=['truco','victory','defeat','flor'].includes(sound)?'triangle':'sine';voice.frequency.setValueAtTime((sound==='piece'?110:220+index*21)*pitch,now);voice.frequency.exponentialRampToValueAtTime(sound==='defeat'?90:Math.max(70,140+index*12),now+.15);
  volume.gain.setValueAtTime(0,now);volume.gain.linearRampToValueAtTime(.07*Math.pow(10,(Math.random()*4-2)/20),now+.008);volume.gain.exponentialRampToValueAtTime(.001,now+.2);voice.connect(volume).connect(panner).connect(this.buses.get(sound==='button'?'ui':'sfx')!);voice.start(now);voice.stop(now+.22);voice.onended=()=>{voice.disconnect();volume.disconnect();panner.disconnect();};
 }
 duck(active:boolean){if(!this.context)return;for(const [bus,db]of [['music',-6],['ambience',-4]] as const)this.buses.get(bus)!.gain.setTargetAtTime(active?Math.pow(10,db/20):1,this.context.currentTime,.08);}
}
export const audio=new AudioManager();
window.addEventListener('pointerdown',()=>{void audio.unlock();},{once:true,capture:true});
window.addEventListener('keydown',()=>{void audio.unlock();},{once:true,capture:true});
