import {Application,Assets,Container,Graphics,Sprite,Text,type Ticker,type Spritesheet,type Texture} from 'pixi.js';
import {gsap} from 'gsap';
import {CharacterRig} from './CharacterRig';
import {audio} from '../audio/AudioManager';
import {numberOf,suitOf,pieceOf,team,type Card,type PlayerView} from '../../../../packages/engine/src/index';
const ink=0x29201d;
const stroke={color:ink,width:5};
function rendererPreference():'webgl'|'canvas'{const probe=document.createElement('canvas');const gl=probe.getContext('webgl2');if(!gl)return 'canvas';const extension=gl.getExtension('WEBGL_debug_renderer_info');const name=extension?String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)):'';gl.getExtension('WEBGL_lose_context')?.loseContext();return !name||/swiftshader|llvmpipe|software|basic render/i.test(name)?'canvas':'webgl';}
export const animationNames=['shuffle','deal','sample','select','play','piece','trick','parda','truco','envido','flor','collect','points','victory','defeat','idle','thinking','sena','disconnect'] as const;
export type AnimationName=typeof animationNames[number];
export class Scene {
 art=new Map<string,Record<string,Texture>>();wallTexture:Texture|null=null;actorArms=new Container();cardTextures:Record<string,Texture>={};
 transients=new Set<Container>();animationCleanup:(()=>void)|null=null;
 skin:'classica'|'celeste'='classica';environment:'auto'|'galpon'|'boliche'='auto';manualQuality:'auto'|'high'|'medium'|'low'='auto';
 async setCosmetics(skin:'classica'|'celeste',environment:'auto'|'galpon'|'boliche',quality:'auto'|'high'|'medium'|'low'){
  const skinChanged=skin!==this.skin,layoutChanged=environment!==this.environment;this.skin=skin;this.environment=environment;this.manualQuality=quality;this.quality=quality==='auto'?'high':quality;if(!this.ready)return;
  if(skinChanged){const scale=navigator.onLine&&devicePixelRatio>1?'2':'1';const sheet=await Assets.load<Spritesheet>(`/assets/art/cards-${skin}@${scale}x.json`);if(this.destroyed||skin!==this.skin)return;this.cardTextures=sheet.textures;this.renderCards();}if(layoutChanged)this.layout();for(const particle of this.dust)particle.visible=this.quality==='high';this.app.canvas.dataset.skin=this.skin;
 }
 clearTransients(){for(const item of this.transients)item.destroy({children:true});this.transients.clear();}
 clearAnimation(){this.timeline?.revert();this.timeline=null;this.animationCleanup?.();this.animationCleanup=null;this.clearTransients();}
 transient(item:Container){this.effects.addChild(item);this.transients.add(item);}
 app=new Application();world=new Container();background=new Container();television=new Container();table=new Container();matches=new Container();people=new Container();foreground=new Container();cards=new Container();effects=new Container();rigs:CharacterRig[]=[];tvPlayers:Graphics[]=[];dust:Graphics[]=[];view:PlayerView|null=null;reduced=false;fast=false;quality='high';mode:2|4=2;isMenu=true;observer:ResizeObserver|null=null;time=0;frames=0;fps=60;slow=0;destroyed=false;ready=false;timeline:gsap.core.Timeline|null=null;characters='';rigByRelative=new Map<number,CharacterRig>();gestureTimers:ReturnType<typeof setTimeout>[]=[];
 layoutWidth=0;layoutHeight=0;
 async init(host:HTMLElement){
  await this.app.init({resizeTo:host,resolution:Math.min(devicePixelRatio,2),autoDensity:true,antialias:false,background:0x28211c,preference:rendererPreference(),powerPreference:'low-power'});
  if(this.destroyed){this.app.destroy(true,{children:true});return;}
  const scale=navigator.onLine&&devicePixelRatio>1?'2':'1';
  await Promise.all(['washington','marta'].map(async character=>{try{const sheet=await Assets.load<Spritesheet>(`/assets/art/${character}@${scale}x.json`);this.art.set(character,Object.fromEntries(Object.entries(sheet.textures).map(([name,texture])=>[name.replace(`${character}-`,''),texture])));}catch(error){console.error('No se pudo cargar el rig',character,error);}}));
  try{this.wallTexture=await Assets.load<Texture>('/assets/art/wall.webp');}catch(error){console.error('No se pudo cargar la pared',error);}
  try{const sheet=await Assets.load<Spritesheet>(`/assets/art/cards-${this.skin}@${scale}x.json`);this.cardTextures=sheet.textures;}catch(error){console.error('No se pudieron cargar las cartas',error);}
  if(this.destroyed){this.app.destroy(true,{children:true});return;}
  host.appendChild(this.app.canvas);this.app.canvas.setAttribute('aria-hidden','true');this.app.stage.addChild(this.world);this.world.addChild(this.background,this.television,this.people,this.table,this.actorArms,this.matches,this.cards,this.foreground,this.effects);this.ready=true;this.layout();
  if(import.meta.env.DEV)Object.assign(window,{bolicheScene:{pause:()=>this.app.stop(),resume:()=>this.app.start(),metrics:()=>({fps:this.fps,frames:this.frames,quality:this.quality,renderer:this.app.renderer.name})}});
  this.observer=new ResizeObserver(()=>{
   this.app.resize();
   if(this.app.screen.width!==this.layoutWidth||this.app.screen.height!==this.layoutHeight)this.layout();
  });this.observer.observe(host);
  this.app.ticker.add(this.tick);document.addEventListener('visibilitychange',this.visibility);document.addEventListener('boliche-visibility',this.visibility);this.visibility();
  if(this.view?.played.length===0)this.animate('deal');
 }
 isPaused(){return document.hidden||document.documentElement.hasAttribute('data-native-paused');}
 visibility=()=>{const paused=this.isPaused();this.timeline?.paused(paused);if(paused)this.app.stop();else this.app.start();};
 tick=(ticker:Ticker)=>{
  const dt=ticker.deltaMS/1000;this.time+=dt;this.frames++;this.fps=this.fps*.97+ticker.FPS*.03;
  if(this.fps<50)this.slow+=dt;else this.slow=0;if(this.slow>3&&this.quality==='high'&&this.manualQuality==='auto'){this.quality='medium';for(const p of this.dust)p.visible=false;}
  for(const rig of this.rigs)rig.breathe(this.time,this.reduced);
  if(!this.reduced){for(let i=0;i<this.tvPlayers.length;i++){const p=this.tvPlayers[i];p.x=p.label==='home'?80+Math.sin(this.time*.5+i)*45:65+Math.sin(this.time*.6+i)*50;p.y=36+i*7+Math.sin(this.time+i)*6;}for(let i=0;i<this.dust.length;i++){const p=this.dust[i];p.y-=dt*4;if(p.y<0)p.y=this.app.screen.height;p.alpha=.08+Math.sin(this.time+i)*.04;}}
 };
 label(text:string,x:number,y:number,size=18,color=0xffe9b8){const label=new Text({text,style:{fontFamily:'Nunito, sans-serif',fontSize:size,fontWeight:'800',fill:color}});label.position.set(x,y);return label;}
 layout(){
  if(!this.ready)return;this.clearAnimation();this.background.cacheAsTexture(false);this.table.cacheAsTexture(false);gsap.killTweensOf(this.world);this.world.position.set(0,0);
  for(const layer of [this.background,this.television,this.people,this.table,this.actorArms,this.matches,this.cards,this.foreground,this.effects]){layer.removeChildren().forEach(c=>c.destroy({children:true}));}this.rigs=[];this.dust=[];this.tvPlayers=[];this.rigByRelative.clear();for(const timer of this.gestureTimers)clearTimeout(timer);this.gestureTimers=[];
  const w=this.app.screen.width,h=this.app.screen.height;this.layoutWidth=w;this.layoutHeight=h;const portrait=w/h<=.8;const shortPortrait=portrait&&h<=740;const compact=h<500;const scale=Math.min(w/850,h/700);const night=this.environment==='boliche'||this.environment==='auto'&&this.mode===4;
  const wall=new Graphics().rect(0,0,w,h).fill(night?0x3c3330:0x96633f);this.background.addChild(wall);
  // Original uneven brickwork, wooden sill and daylight window.
  for(let row=0;row<h/48;row++)for(let col=-1;col<w/118;col++){const x=col*118+(row%2)*59;this.background.addChild(new Graphics().roundRect(x+3,row*48+3,111,41,3).fill((night?[0x4b3830,0x533c30,0x46362f,0x513c30]:[0x996243,0xa36e49,0x895c3f,0x9d6845])[(row+col+40)%4]).stroke({color:0x513c2b,width:2}));}
  if(this.wallTexture){
   const image=new Sprite(this.wallTexture);
   image.anchor.set(.5);image.position.set(w*.5,h*.5);
   image.scale.set(Math.max(w/this.wallTexture.width,h/this.wallTexture.height));
   image.tint=night?0x756363:0xe6ccac;
   const wallMask=new Graphics().rect(0,0,w,h).fill(0xffffff);
   this.background.addChild(image,wallMask);image.mask=wallMask;
  }
  if(night)wall.tint=0x7d7777;
  const window=new Container();const ww=portrait?w*.23:w*.18,wh=h*.27;window.addChild(new Graphics().roundRect(0,0,ww,wh,2).fill(night?0x224951:0xb6c5a0).stroke({color:ink,width:10}).moveTo(ww*.5,0).lineTo(ww*.5,wh).moveTo(0,wh*.5).lineTo(ww,wh*.5).stroke({color:0x5b4c30,width:7}));window.position.set(w*.04,h*.13);this.background.addChild(window);
  window.addChild(new Graphics().moveTo(4,wh*.8).quadraticCurveTo(ww*.3,wh*.6,ww*.5,wh*.75).quadraticCurveTo(ww*.8,wh*.57,ww-5,wh*.67).lineTo(ww-5,wh-5).lineTo(5,wh-5).closePath().fill(0x658153));
  const shelf=new Graphics().roundRect(w*.72,h*.22,w*.25,12,3).fill(0x674a32).stroke({color:ink,width:4}).roundRect(w*.72,h*.37,w*.25,12,3).fill(0x674a32).stroke({color:ink,width:4});this.background.addChild(shelf);
  for(let i=0;i<5;i++){const x=w*.735+i*w*.045;const y=h*.22;this.background.addChild(new Graphics().roundRect(x,y-49,19,46,4).fill(i%2?0x5e724b:0x776138).stroke({color:ink,width:3}).rect(x+6,y-65,7,18).fill(0x625c39).stroke({color:ink,width:3}));}
  const tv=new Container();tv.addChild(new Graphics().roundRect(0,0,172,123,15).fill(0x483f32).stroke(stroke).roundRect(10,12,135,98,15).fill(0x183f3a).stroke({color:ink,width:4}).roundRect(17,19,121,82,14).fill(0x6c9c57));
  tv.addChild(new Graphics().rect(23,25,109,69).stroke({color:0xd5e2b7,width:1.5}).moveTo(77,25).lineTo(77,94).stroke({color:0xd5e2b7,width:1}).ellipse(77,59,14,17).stroke({color:0xd5e2b7,width:1}).circle(157,40,5).fill(0xb0a27c).circle(157,64,5).fill(0xb0a27c));
  for(let i=0;i<8;i++){const p=new Graphics().circle(0,0,2.7).fill(i%2?0xe9c66d:0xe9e2c2);p.label=i%2?'home':'away';p.position.set(44+i*7,36+i*7);this.tvPlayers.push(p);tv.addChild(p);}
  for(let i=0;i<18;i++)tv.addChild(new Graphics().rect(17,19+i*4.5,121,1).fill({color:0x162a27,alpha:.18}));
  tv.addChild(new Graphics().moveTo(65,0).lineTo(40,-25).moveTo(78,0).lineTo(101,-25).stroke({color:ink,width:3}));
  tv.scale.set(Math.max(.44,scale*.83));
  const tvX=night?w*.92-172*tv.scale.x:portrait?w*.07:compact?Math.max(175,w*.19):w*.18;
  tv.position.set(tvX,h*(portrait?.29:.33));const liveTv=new Container();liveTv.position.copyFrom(tv.position);liveTv.scale.copyFrom(tv.scale);tv.position.set(0,0);tv.scale.set(1);for(const player of this.tvPlayers)tv.removeChild(player);tv.cacheAsTexture({resolution:2,antialias:false});liveTv.addChild(tv,...this.tvPlayers);this.television.addChild(liveTv);
  const lamp=new Graphics().moveTo(w*.51,0).lineTo(w*.51,h*.1).stroke({color:ink,width:5}).ellipse(w*.51,h*.12,w*.075,h*.019).fill(0x533e2a).stroke(stroke).ellipse(w*.51,h*.132,w*.066,h*.014).fill(0xf9d987).ellipse(w*.51,h*.135,11,15).fill(0xffefb8);this.background.addChild(lamp);
  this.background.addChild(new Graphics().moveTo(w*.47,h*.14).lineTo(w*.22,h*.82).lineTo(w*.86,h*.82).lineTo(w*.55,h*.14).closePath().fill({color:0xffda87,alpha:night?.08:.055}));
  const rigScale=portrait?Math.min(w/(this.isMenu||shortPortrait?620:510),h/735):Math.min(w/1200,h/790);const rival=new CharacterRig(this.characterAt(this.mode===4?2:1),false,0x8c8e63,this.art.get(this.characterAt(this.mode===4?2:1)));rival.variant(this.variantAt(this.mode===4?2:1));rival.scale.set(rigScale);rival.position.set(this.isMenu?w*.67:w*.53,h*(this.isMenu&&portrait?.40:shortPortrait?.33:compact?.37:.39));this.people.addChild(rival);this.rigs.push(rival);this.rigByRelative.set(this.mode===4?2:1,rival);
  if(this.mode===4){for(const [x,relative,color]of [[.13,3,0xa8543d],[.87,1,0x3e6c72]] as const){const rig=new CharacterRig(this.characterAt(relative),false,color,this.art.get(this.characterAt(relative)));rig.variant(this.variantAt(relative));rig.scale.set(rigScale*.91);rig.position.set(w*x,h*(shortPortrait?.36:.42));this.people.addChild(rig);this.rigs.push(rig);this.rigByRelative.set(relative,rig);}}
  const cy=h*(compact?.83:shortPortrait?.70:.76),rx=w*(night?.46:.48),ry=h*.285;
  const tableShape=new Graphics();if(this.mode===4)tableShape.moveTo(w*.17,cy-ry).lineTo(w*.83,cy-ry).lineTo(w*.99,cy+ry).lineTo(w*.01,cy+ry).closePath();else tableShape.ellipse(w*.52,cy,rx,ry);tableShape.fill(night?0x81542f:0x9e693a).stroke({color:ink,width:10});this.table.addChild(tableShape);
  const wood=new Graphics();for(let i=0;i<9;i++){const x=w*.1+i*w*.1;wood.moveTo(x,cy-ry*.8).bezierCurveTo(x-12,cy-ry*.4,x+15,cy+ry*.4,x,cy+ry*.8).stroke({color:0x6b482e,width:3,alpha:.5});}for(let i=0;i<20;i++){const x=w*.18+((i*149)%Math.max(1,w*.65)),y=cy-ry*.6+((i*59)%Math.max(1,ry*1.2));wood.moveTo(x,y).quadraticCurveTo(x+20,y-4,x+45,y).stroke({color:0xc58a4a,width:2,alpha:.6});}const woodMask=new Graphics(tableShape.context);this.table.addChild(woodMask,wood);wood.mask=woodMask;
  for(const rig of this.rigs){const layer=new Container();layer.position.copyFrom(rig.position);layer.scale.copyFrom(rig.scale);layer.addChild(rig.arms,rig.hands);this.actorArms.addChild(layer);}
  // A mate, bombilla, glass and familiar matches: no branded props.
  const mate=new Container();mate.addChild(new Graphics().ellipse(0,22,26,7).fill({color:0x281f18,alpha:.3}).moveTo(-17,-18).bezierCurveTo(-43,43,43,43,17,-18).closePath().fill(0x65422b).stroke({color:ink,width:4}).ellipse(0,-16,19,9).fill(0xa88c50).stroke({color:ink,width:4}).ellipse(0,-17,14,5).fill(0x5e6938).moveTo(6,-14).lineTo(23,-66).lineTo(29,-72).stroke({color:0xd9d3ac,width:5}));mate.position.set(w*.26,h*.65);mate.scale.set(Math.max(.65,scale));this.table.addChild(mate);
  const glass=new Graphics().moveTo(-13,-35).lineTo(13,-35).lineTo(10,0).quadraticCurveTo(0,6,-10,0).closePath().fill({color:0xd3b98a,alpha:.32}).stroke({color:0xcbb990,width:2});glass.position.set(w*(compact&&!portrait?.81:.73),h*.61);this.table.addChild(glass);
  this.drawMatchsticks(this.localScores());
  const back=new CharacterRig(this.characterAt(0),true,0x42675d,this.art.get(this.characterAt(0)));back.variant(this.variantAt(0));back.scale.set(rigScale*(portrait?1.48:1.4));back.position.set(w*(this.mode===4?.5:.18),h*.86);this.foreground.addChild(back);this.rigs.push(back);
  for(let i=0;i<14;i++){const p=new Graphics().circle(0,0,1+i%2).fill(0xffe0a1);p.position.set(w*.25+(i*67)%(w*.5),(i*91)%h);p.visible=this.quality==='high';this.dust.push(p);this.effects.addChild(p);}
  this.renderCards();this.background.cacheAsTexture({resolution:1,antialias:false});this.table.cacheAsTexture({resolution:1,antialias:false});
 }
 drawMatchsticks(scores:readonly number[]){this.matches.removeChildren().forEach(c=>c.destroy({children:true}));const w=this.app.screen.width,h=this.app.screen.height;for(let side=0;side<2;side++){const group=new Container();for(let i=0;i<Math.min(scores[side],40);i++){const pack=Math.floor(i/5),part=i%5,x=(pack%4)*23,y=Math.floor(pack/4)*25;const coords=[[x,y,x+17,y],[x+17,y,x+17,y+17],[x+17,y+17,x,y+17],[x,y+17,x,y],[x,y,x+17,y+17]][part];group.addChild(new Graphics().moveTo(coords[0],coords[1]).lineTo(coords[2],coords[3]).stroke({color:0xf0d395,width:3,cap:'round'}).circle(coords[0],coords[1],2).fill(0xa74f37));}group.position.set(w*(side===0?.12:.75),h*.81);group.cacheAsTexture({resolution:1});this.matches.addChild(group);}}
 cardGraphic(card:Card|null){const container=new Container();const texture=this.cardTextures[`${this.skin}-${card??'back'}.png`];if(texture){const image=new Sprite(texture);image.position.set(-24,-35);image.width=48;image.height=70;container.addChild(image);return container;}container.addChild(new Graphics().roundRect(-24,-35,48,70,5).fill(card?0xffebbf:0x477d87).stroke({color:ink,width:2}));if(card){container.addChild(this.label(String(numberOf(card)),-19,-32,16,0x413526));const suit=suitOf(card);const icon=new Graphics();if(suit==='O')icon.circle(0,4,10).fill(0xd9a645).stroke({color:ink,width:2});if(suit==='E')icon.moveTo(0,-12).lineTo(4,7).lineTo(-4,7).closePath().fill(0xbdcfc5).stroke({color:ink,width:2}).moveTo(-8,8).lineTo(8,8).moveTo(0,8).lineTo(0,17).stroke({color:0xa54a37,width:4});if(suit==='B')icon.roundRect(-4,-12,8,31,4).fill(0x5c814d).stroke({color:ink,width:2});if(suit==='C')icon.moveTo(-10,-7).lineTo(10,-7).lineTo(6,7).lineTo(-6,7).closePath().fill(0xad5340).stroke({color:ink,width:2}).moveTo(0,7).lineTo(0,17).moveTo(-8,18).lineTo(8,18).stroke({color:0xd9a645,width:3});container.addChild(icon);}else container.addChild(new Graphics().roundRect(-17,-28,34,56,3).stroke({color:0xe3c786,width:2}).moveTo(-14,-23).lineTo(14,23).moveTo(14,-23).lineTo(-14,23).stroke({color:0xe3c786,width:1}));container.cacheAsTexture({resolution:2,antialias:false});return container;}
 seatOrigin(relative:number){
  const {width:w,height:h}=this.app.screen;
  if(relative===0){
   const canvas=this.app.canvas;
   const hand=canvas.closest('[data-testid=app]')?.querySelector('[data-local-hand]')?.getBoundingClientRect();
   if(hand?.height){
    const bounds=canvas.getBoundingClientRect();
    return {x:hand.left-bounds.left+hand.width/2,y:hand.top-bounds.top+hand.height/2};
   }
   return {x:w*(w/h<=.8?.5:.45),y:h*.83};
  }
  const rig=this.rigByRelative.get(relative)!;
  return {x:rig.x,y:rig.y+rig.scale.y*150};
 }
 renderCards(){
  this.clearAnimation();
  this.cards.removeChildren().forEach(card=>card.destroy({children:true}));
  const {width:w,height:h}=this.app.screen;
  const scale=Math.max(.65,Math.min(w/700,h/600));
  const portrait=w/h<=.8,shortPortrait=portrait&&h<=740;
  const compactLandscape=!portrait&&h<500;
  const stock=this.cardGraphic(null);
  stock.label='stock';stock.position.set(w*(portrait?.79:compactLandscape?.67:.70),h*(shortPortrait||compactLandscape?.58:.64));stock.rotation=.12;stock.scale.set(scale);this.cards.addChild(stock);
  const sample=this.cardGraphic(this.view?.sample??'7O');
  sample.label='sample';sample.position.set(w*(portrait?.86:compactLandscape?.73:.76),h*(shortPortrait||compactLandscape?.605:.665));sample.rotation=.20;sample.scale.set(scale);this.cards.addChild(sample);

  // Keep the finished trick visible until the next lead, even after the engine clears it.
  const plays=this.view?.trick.length?this.view.trick:this.view?.played.slice(-this.mode)??[];
  const positions=this.mode===4?[[.48,.69],[.61,.64],[.45,.59],[.35,.64]]:[[.45,.66],[.55,.62]];
  const rise=shortPortrait?.147:portrait?.06:0;
  for(const play of plays){
   const card=this.cardGraphic(play.card);
   const relative=(play.seat-(this.view?.seat??0)+this.mode)%this.mode;
   const [x,y]=positions[relative];
   card.label=`played:${play.card}`;
   card.position.set(w*x,h*(y-rise));
   card.rotation=relative%2?.13:-.13;card.scale.set(shortPortrait?scale*.88:scale);this.cards.addChild(card);
  }
  for(let relative=1;relative<this.mode;relative++){
   const other=((this.view?.seat??0)+relative)%this.mode;
   const count=this.view?.hands[other]?.length??3;
   const {x,y}=this.seatOrigin(relative);
   for(let i=0;i<count;i++){
    const card=this.cardGraphic(null);
    const offset=i-(count-1)/2;
    card.position.set(x+offset*17*scale,y+Math.abs(offset)*2);
    card.scale.set(scale*.65);card.rotation=offset*.14;this.cards.addChild(card);
   }
  }
 }
 update(view:PlayerView|null,mode:2|4,isMenu:boolean,reduced:boolean,fast:boolean,characters=''){
  const last=this.view;
  const needsLayout=this.mode!==mode||this.isMenu!==isMenu||this.characters!==characters||last?.seat!==view?.seat;
  const motionChanged=this.reduced!==reduced;
  this.characters=characters;this.view=view;this.mode=mode;this.isMenu=isMenu;this.reduced=reduced;this.fast=fast;
  audio.setScene(isMenu,this.environment==='boliche'||this.environment==='auto'&&mode===4,view?Math.max(Math.max(...view.scores)/view.config.targetScore,view.value>=3?.8:0,view.pending?.kind==='resto'?1:0):0);
  if(!this.ready)return;
  this.app.canvas.dataset.characters=characters;this.app.canvas.dataset.reduced=String(reduced);
  if(motionChanged&&reduced)this.clearAnimation();
  if(needsLayout)this.layout();
  if(view?.seq===last?.seq&&view?.handNo===last?.handNo)return;
  const newHand=view?.handNo!==last?.handNo;
  const cardPlayed=!!view&&!newHand&&view.played.length>(last?.played.length??0);
  if(!needsLayout&&(newHand||cardPlayed||view?.played.at(-1)?.card!==last?.played.at(-1)?.card))this.renderCards();
  if(view)this.voiceEvents(view);
  if(!needsLayout&&view?.scores.join()!==last?.scores.join())this.drawMatchsticks(this.localScores());
  if(view&&newHand&&view.played.length===0)this.animate('deal');
  else if(cardPlayed&&view){
   const play=view.played.at(-1)!;
   const result=view.winner===null?undefined:view.winner===team(view.seat)?'victory':'defeat';
   this.animate(pieceOf(play.card,view.sample)!==null?'piece':'play',1,play,result);
  }else if(view?.events.some(e=>e.type==='FLOR'))this.animate('flor');
  else if(view?.winner!==null&&view?.winner!==undefined)this.animate(view.winner===team(view.seat)?'victory':'defeat');
  else if(view?.events[0]?.type==='TRUCO')this.animate('truco');
 }
 animate(name:AnimationName,speed=1,play?:{seat:number;card:Card},after?:AnimationName){
  if(!this.ready)return;
  this.clearAnimation();
  const duration=.4/(this.fast?2:1)/speed;
  const {width:w,height:h}=this.app.screen;
  const target=this.cards;
  const tl=gsap.timeline({paused:this.isPaused(),onComplete:()=>{
   this.timeline=null;this.clearTransients();
   if(after)this.animate(after);
  }});
  this.timeline=tl;
  if(this.reduced){
   if(name!=='sena')tl.fromTo(target,{alpha:.85},{alpha:1,duration:.08});
   return;
  }
  if(name==='deal'){
   const stock=target.children.find(card=>card.label==='stock')!;
   const sample=target.children.find(card=>card.label==='sample')!;
   const origins=Array.from({length:this.mode},(_,relative)=>this.seatOrigin(relative));
   tl.set(sample,{visible:false},0);
   for(let i=0;i<this.mode*3;i++){
    const card=this.cardGraphic(null);
    card.position.copyFrom(stock.position);card.scale.set(stock.scale.x);
    this.transient(card);
    const {x,y}=origins[i%this.mode];
    const offset=i*.035/speed;
    tl.to(card,{x:(x+stock.x)/2,y:(y+stock.y)/2-Math.min(62,h*.11),rotation:i%2?.3:-.3,duration:duration*.48,ease:'power2.out'},offset)
     .to(card,{x,y,alpha:0,duration:duration*.52,ease:'power2.in'},offset+duration*.48);
   }
   tl.set(sample,{visible:true}).fromTo(sample.scale,{x:.04},{x:sample.scale.y,duration:duration*.55,ease:'back.out(1.4)'});
  }else if(name==='play'||name==='piece'){
   const relative=play?((play.seat-(this.view?.seat??0)+this.mode)%this.mode):0;
   const {x:startX,y:startY}=this.seatOrigin(relative);
   const card=play?target.children.find(child=>child.label===`played:${play.card}`):this.cardGraphic('7O');
   if(!card)return;
   if(!play){card.position.set(w*.49,h*.62);card.scale.set(.85);this.transient(card);}
   const {x,y,rotation}=card;
   const {x:scaleX,y:scaleY}=card.scale;
   tl.fromTo(card,{x:startX,y:startY,rotation:relative===0?-.22:.22},{
    x:(startX+x)/2,y:(startY+y)/2-Math.min(65,h*.12),rotation:rotation+.21,duration:duration*.47,ease:'power2.out'
   }).to(card,{x,y,rotation,duration:duration*.53,ease:'power2.in'})
    .to(card.scale,{x:scaleX*1.10,y:scaleY*.88,duration:.055,yoyo:true,repeat:1});
   if(name==='piece'){
    const ring=new Graphics().ellipse(0,0,22,12).stroke({color:0xffdc8a,width:2,alpha:.85});
    ring.position.set(x,y+13);ring.alpha=0;this.transient(ring);
    tl.set(ring,{alpha:1},duration).to(ring,{alpha:0,duration:.23},duration)
     .to(ring.scale,{x:1.7,y:1.7,duration:.23},duration)
     .to(this.world,{x:3,duration:.026,yoyo:true,repeat:5},duration).set(this.world,{x:0});
   }
  }else if(name==='sample'){const card=target.children.find(c=>c.label==='sample');if(card)tl.fromTo(card.scale,{x:.01},{x:card.scale.y,duration,ease:'back.out(1.5)'});
  }else if(name==='shuffle'){tl.fromTo(target,{rotation:-.035,y:-12},{rotation:.035,y:0,duration:duration*.35,repeat:3,yoyo:true,ease:'sine.inOut'}).to(target,{rotation:0,duration:.1});
  }else if(name==='collect'||name==='trick'){tl.to(target,{x:name==='trick'?w*.1:0,y:-40,alpha:.3,duration,ease:'power2.in'}).to(target,{x:0,y:0,alpha:1,duration:.12});
  }else if(name==='truco'||name==='parda'){tl.fromTo(this.people.scale,{x:1.04,y:1.04},{x:1,y:1,duration,ease:'back.out(2)'});const reacting=this.rigs.filter(rig=>rig.label!=='local-back');this.animationCleanup=()=>reacting.forEach(rig=>rig.gesture('neutral'));for(const rig of reacting){rig.gesture(name==='truco'?'bocaAbierta':'nariz');tl.call(()=>rig.gesture('neutral'),[],duration);}
  }else if(name==='flor'||name==='victory'){for(let i=0;i<24;i++){const p=new Graphics().roundRect(-3,-5,6,10,2).fill(i%2?0xf0c76c:0xe5d3a6);p.position.set(w*.5,h*.4);this.transient(p);tl.to(p,{x:w*.5+Math.cos(i*2.4)*w*.38,y:h*.8+Math.sin(i*2.4)*h*.2,rotation:i,alpha:0,duration:duration*2},0);}
  }else if(name==='points'){for(const [index,group]of this.matches.children.entries())tl.fromTo(group,{y:group.y-25,rotation:-.04},{y:group.y,rotation:0,duration:.22,ease:'bounce.out'},index*.08);}
  else if(name==='select'){const card=target.children.find(c=>c.label==='sample');if(card)tl.to(card,{y:card.y-18,rotation:0,duration:.12,ease:'back.out(2)'}).to(card,{y:card.y,rotation:card.rotation,duration:.22});}
  else if(name==='envido'){const rig=this.rigs[0];if(rig){rig.gesture('sonrisa');this.animationCleanup=()=>rig.gesture('neutral');tl.to(rig.head,{rotation:-.07,duration:.22,yoyo:true,repeat:1}).call(()=>rig.gesture('neutral'));}}
  else if(name==='sena'){const rig=this.rigs[0];if(rig){rig.gesture('cejas');this.animationCleanup=()=>rig.gesture('neutral');tl.call(()=>rig.gesture('neutral'),[],.7);}}
  else if(name==='disconnect'){this.animationCleanup=()=>{this.people.alpha=1;};tl.to(this.people,{alpha:.45,duration});}
  else if(name==='defeat')tl.to(this.people,{y:5,duration}).to(this.people,{y:0,duration});
  else if(name==='thinking'){const rig=this.rigs[0];if(rig){rig.setPart('hand-left','hand-chin');rig.hands.updateCacheTexture();this.animationCleanup=()=>{if(!rig.destroyed){rig.setPart('hand-left','hand-left');rig.hands.updateCacheTexture();}};tl.to(rig.head,{rotation:.07,duration:.4,yoyo:true,repeat:1}).call(()=>{rig.setPart('hand-left','hand-left');rig.hands.updateCacheTexture();});}}
  else if(name==='idle'){const rig=this.rigs[0];if(rig){rig.setPart('eyes','eyes-left');rig.head.updateCacheTexture();rig.setPart('hand-left','hand-mate');rig.hands.updateCacheTexture();const cup=new Graphics().ellipse(-22,139,13,16).fill(0x795133).stroke({color:ink,width:3}).moveTo(-21,127).lineTo(-9,101).stroke({color:0xd3c396,width:3});rig.hands.addChild(cup);rig.hands.updateCacheTexture();this.animationCleanup=()=>{if(!cup.destroyed)cup.destroy();if(!rig.destroyed){rig.hands.y=0;rig.setPart('eyes','eyes-open');rig.setPart('hand-left','hand-left');rig.head.updateCacheTexture();rig.hands.updateCacheTexture();}};tl.to(rig.hands,{y:-78,duration:.4,ease:'sine.inOut'}).to(rig.hands,{y:0,duration:.4,delay:.5}).call(()=>{cup.destroy();rig.setPart('eyes','eyes-open');rig.setPart('hand-left','hand-left');rig.head.updateCacheTexture();rig.hands.updateCacheTexture();});}}
  else tl.fromTo(this.people,{alpha:.8},{alpha:1,duration});
 }
 variantAt(relative:number){const seat=((this.view?.seat??0)+relative)%this.mode;return this.characters.split(',')[seat]?.split(':')[1]??'base';}
 characterAt(relative:number):'washington'|'marta'{const seat=((this.view?.seat??0)+relative)%this.mode;const character=this.characters.split(',')[seat]?.split(':')[0];return character==='marta'?'marta':character==='washington'?'washington':relative===2||relative===0?'marta':'washington';}
 voiceEvents(view:PlayerView){let delay=0;for(const event of view.events){const relative=((event.seat??view.seat)-view.seat+this.mode)%this.mode;const rig=this.rigByRelative.get(relative);const names:Record<string,string>={TRUCO:view.value===1?'truco':view.value===2?'retruco':'valeCuatro',ENVIDO:view.pending?.sequence.at(-1)==='F'?'faltaEnvido':view.pending?.sequence.at(-1)==='R'?'realEnvido':'envido',FLOR:'flor',RESTO:'resto',QUIERO:'quiero',NO_QUIERO:'noQuiero',MAZO:'mazo',TANTO:event.value===undefined?'buenas':`tengo-${event.value}`};const id=names[event.type];if(!id)continue;const pan=relative===1&&this.mode===4?.65:relative===3?-.65:0;this.gestureTimers.push(setTimeout(()=>{if(this.destroyed)return;void audio.speak(this.characterAt(relative),id,pan,shape=>{if(rig&&!rig.destroyed)rig.gesture(shape);});},delay));delay+=900;}}
 localScores():[number,number]{const side=team(this.view?.seat??0);return [this.view?.scores[side]??0,this.view?.scores[1-side]??0];}
 showGesture(seat:number,gesture:string){const relative=(seat-(this.view?.seat??0)+this.mode)%this.mode;const rig=this.rigByRelative.get(relative);if(!rig)return;rig.gesture(gesture);this.gestureTimers.push(setTimeout(()=>{if(!rig.destroyed)rig.gesture('neutral');},700));}
 destroy(){this.clearAnimation();this.destroyed=true;for(const timer of this.gestureTimers)clearTimeout(timer);this.timeline?.kill();this.observer?.disconnect();document.removeEventListener('visibilitychange',this.visibility);document.removeEventListener('boliche-visibility',this.visibility);gsap.killTweensOf(this.world);gsap.killTweensOf(this.cards);if(this.ready){this.app.ticker.remove(this.tick);this.app.destroy(true,{children:true});}}
}
