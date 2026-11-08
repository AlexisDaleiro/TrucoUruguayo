import {Container,Graphics,Sprite,type Texture} from 'pixi.js';
const ink=0x29201d;
const outline={color:ink,width:5,join:'round' as const};
/** Cutout structure: final transparent PNGs can replace each named part. */
export class CharacterRig extends Container {
 textures:Record<string,Texture>|null=null;faceParts=new Map<string,Sprite>();nextBlink=2+Math.random()*4;blinkUntil=0;eyePose='eyes-open';
 torso=new Container();head=new Container();eyes=new Container();brows=new Container();mouth=new Container();arms=new Container();hands=new Container();baseScale=1;blinkClosed=false;
 constructor(public character:'washington'|'marta'='washington',back=false,color=0x487a76,textures?:Record<string,Texture>){
  super();this.label=back?'local-back':character;this.addChild(this.torso,this.arms,this.head,this.hands);
  if(textures){this.installRaster(textures,back,color);return;}
  const shirt=new Graphics().moveTo(-89,95).bezierCurveTo(-73,15,70,15,90,95).lineTo(110,200).lineTo(-110,200).closePath().fill(color).stroke(outline);this.torso.addChild(shirt);
  if(character==='washington'){
   this.torso.addChild(new Graphics().moveTo(-41,44).lineTo(-19,170).lineTo(-68,190).lineTo(-74,74).closePath().fill(0x58453a).stroke({color:ink,width:4}).moveTo(41,44).lineTo(19,170).lineTo(68,190).lineTo(74,74).closePath().fill(0x58453a).stroke({color:ink,width:4}));
   for(let i=0;i<4;i++)this.torso.addChild(new Graphics().moveTo(-74,80+i*28).lineTo(74,80+i*28).stroke({color:0xb5ac81,width:2,alpha:.45}));
  }
  const arms=new Graphics().moveTo(-76,87).bezierCurveTo(-112,101,-132,171,-77,185).lineTo(-19,168).lineTo(-23,145).lineTo(-78,151).lineTo(-55,108).closePath().fill(color).stroke(outline).moveTo(74,85).bezierCurveTo(116,100,137,166,82,183).lineTo(25,169).lineTo(26,145).lineTo(80,150).lineTo(55,108).closePath().fill(color).stroke(outline);this.arms.addChild(arms);
  this.hands.addChild(new Graphics().ellipse(-16,157,30,17).fill(0xd79b65).stroke(outline).ellipse(26,159,28,16).fill(0xd79b65).stroke(outline));
  if(back){
   this.head.addChild(new Graphics().roundRect(-43,-47,86,99,34).fill(0xb8784f).stroke(outline).ellipse(0,-36,53,45).fill(character==='marta'?0x574435:0x45423b).stroke(outline));
   this.torso.tint=0xb9b7af;this.cacheAsTexture({resolution:1,antialias:false});return;
  }
  const face=new Graphics().ellipse(-52,-13,14,22).fill(0xd79b65).stroke(outline).ellipse(52,-13,14,22).fill(0xd79b65).stroke(outline).moveTo(-49,-53).bezierCurveTo(-64,11,-35,65,0,66).bezierCurveTo(43,65,61,7,49,-53).closePath().fill(0xe2ac76).stroke(outline);
  face.moveTo(35,-36).bezierCurveTo(55,20,29,53,6,57).bezierCurveTo(40,59,57,17,45,-42).closePath().fill(0xc8895c);
  this.head.addChild(face);
  if(character==='washington'){
   this.head.addChild(new Graphics().moveTo(-54,-38).lineTo(-58,-67).bezierCurveTo(-28,-105,40,-96,56,-61).lineTo(54,-38).bezierCurveTo(31,-46,-32,-44,-54,-38).closePath().fill(0x65725a).stroke(outline).moveTo(-54,-47).quadraticCurveTo(1,-62,57,-47).lineTo(72,-35).quadraticCurveTo(10,-29,-54,-38).closePath().fill(0x424d3e).stroke(outline));
  }else{
   this.head.addChild(new Graphics().circle(40,-82,28).fill(0x574135).stroke(outline).moveTo(-53,-29).bezierCurveTo(-79,-100,51,-116,58,-31).lineTo(36,-51).quadraticCurveTo(0,-35,-34,-58).lineTo(-48,-24).closePath().fill(0x574135).stroke(outline));
  }
  this.eyes.addChild(new Graphics().ellipse(-24,-11,16,12).fill(0xfff4d9).stroke({color:ink,width:3}).ellipse(23,-11,16,12).fill(0xfff4d9).stroke({color:ink,width:3}).ellipse(-19,-9,4,7).fill(ink).ellipse(19,-9,4,7).fill(ink));
  this.brows.addChild(new Graphics().moveTo(-41,-28).quadraticCurveTo(-23,-35,-9,-28).stroke({color:character==='marta'?ink:0xc2c1ae,width:8,cap:'round'}).moveTo(9,-28).quadraticCurveTo(24,-36,40,-27).stroke({color:character==='marta'?ink:0xc2c1ae,width:8,cap:'round'}));
  const nose=new Graphics().moveTo(0,-16).quadraticCurveTo(-17,10,-5,15).quadraticCurveTo(13,20,18,9).quadraticCurveTo(19,1,6,2).fill(0xe5ad76).stroke({color:ink,width:3});nose.label='nose';
  this.mouth.addChild(new Graphics().moveTo(-16,35).quadraticCurveTo(2,46,20,31).stroke({color:ink,width:4,cap:'round'}));
  this.head.addChild(this.eyes,this.brows,nose,this.mouth);
  if(character==='washington')this.head.addChild(new Graphics().moveTo(0,20).bezierCurveTo(-14,12,-16,33,-36,24).bezierCurveTo(-31,45,-6,40,0,29).bezierCurveTo(9,42,29,43,36,24).bezierCurveTo(15,33,17,12,0,20).fill(0xc9c9b9).stroke({color:ink,width:3}));
  this.cacheParts();
 }
 installRaster(textures:Record<string,Texture>,back:boolean,color:number){
  this.textures=textures;
  const add=(part:string,parent:Container,key=part)=>{const texture=textures[`${part}.png`];if(!texture)return;const sprite=new Sprite(texture);sprite.position.set(-160,-110);sprite.width=320;sprite.height=320;parent.addChild(sprite);this.faceParts.set(key,sprite);return sprite;};
  add(back?'back-torso':'torso',this.torso);if(color!==0x8c8e63&&color!==0x487a76)this.torso.tint=color===0xa8543d?0xffc5aa:0xbde8ed;
  if(back){if(this.character==='marta')add('nape',this.head);add('back-head',this.head);add('back-arm-left',this.arms);add('back-arm-right',this.arms);}
  else{add('face',this.head);add('hair',this.head);this.head.addChild(this.eyes,this.brows,this.mouth);add('eyes-open',this.eyes,'eyes');add('brows-neutral-left',this.brows,'brow-left');add('brows-neutral-right',this.brows,'brow-right');add('mouth-neutral',this.mouth,'mouth');add('nose',this.head,'nose');const cheeks=add('cheeks',this.head);if(cheeks)cheeks.visible=false;for(const part of ['upper-left','upper-right','forearm-left','forearm-right'])add(part,this.arms);}
  add('hand-left',this.hands);add('hand-right',this.hands);this.cacheParts();
 }
 setPart(key:string,part:string){
  if(key==='eyes'){
   this.eyePose=part;
   if(this.blinkClosed&&!part.includes('wink'))part='eyes-closed';
  }
  const sprite=this.faceParts.get(key),texture=this.textures?.[`${part}.png`];
  if(sprite&&texture&&sprite.texture!==texture){sprite.texture=texture;sprite.width=320;sprite.height=320;}
 }
 variant(value:string){if(!this.textures)return;if(value==='sin_boina'&&this.character==='washington'){const hair=this.faceParts.get('hair');if(hair)hair.visible=false;if(this.label==='local-back')this.setPart('back-head','face');}if(value==='pelo_gris'&&this.character==='marta'){this.setPart('hair','hair-gray');this.setPart('back-head','back-head-gray');}if(value==='camisa_roja'||value==='cardigan_azul'){const suffix=value==='camisa_roja'?'red':'blue';for(const part of ['torso','back-torso','upper-left','upper-right'])this.setPart(part,`${part}-${suffix}`);this.torso.tint=0xffffff;}for(const part of [this.torso,this.head,this.arms,this.hands])part.updateCacheTexture();}
 cacheParts(){for(const part of [this.torso,this.arms,this.hands,this.head])part.cacheAsTexture({resolution:2,antialias:false});}
 breathe(time:number,reduced:boolean){
  if(this.label==='local-back')return;
  const breath=reduced?0:Math.sin(time*1.6);
  this.torso.scale.y=1+breath*.009;this.head.y=breath*1.5;
  if(!reduced&&time>=this.nextBlink){this.blinkUntil=time+.12;this.nextBlink=time+2+Math.random()*4;}
  const closed=!reduced&&time<this.blinkUntil;
  if(closed===this.blinkClosed)return;
  this.blinkClosed=closed;
  if(this.textures)this.setPart('eyes',this.eyePose);
  else this.eyes.scale.y=closed?.08:1;
  this.head.updateCacheTexture();
 }
 gesture(kind:string){
  if(this.textures){if(this.label==='local-back')return;this.head.rotation=kind==='tic'?.045:0;
   const eyes=kind==='ojosCerrados'?'closed':kind==='guinoDerecho'?'wink-right':kind==='guinoIzquierdo'?'wink-left':'open';this.setPart('eyes',`eyes-${eyes}`);
   this.setPart('brow-left',kind==='cejas'||kind==='cejaIzquierda'?'brows-raised-left':'brows-neutral-left');this.setPart('brow-right',kind==='cejas'?'brows-raised-right':'brows-neutral-right');
   const mouths:Record<string,string>={beso:'kiss',bocaAbierta:'shout',lengua:'tongue',morderLabio:'bite',lamerLabio:'lick',labiosDerecha:'right',labiosIzquierda:'left',o:'o',sonrisa:'smile'};this.setPart('mouth',`mouth-${mouths[kind]??'neutral'}`);this.setPart('nose',kind==='nariz'?'nose-wrinkled':'nose');const cheeks=this.faceParts.get('cheeks');if(cheeks)cheeks.visible=kind==='cachetes';this.hands.y=kind==='menton'?-80:0;this.hands.rotation=kind==='menton'?-.18:0;this.head.updateCacheTexture();return;}
  if(this.label==='local-back')return;this.head.rotation=kind==='tic'?.045:0;this.head.scale.x=kind==='cachetes'?1.13:1;this.brows.y=kind==='cejas'?-8:0;this.eyes.scale.y=1;
  const eyes=this.eyes.children[0] as Graphics;eyes.clear();for(const side of [-1,1]){const closed=kind==='ojosCerrados'||kind===(side<0?'guinoDerecho':'guinoIzquierdo');const x=side*24;if(closed)eyes.moveTo(x-13,-9).quadraticCurveTo(x,-4,x+13,-9).stroke({color:ink,width:3});else eyes.ellipse(x,-11,16,12).fill(0xfff4d9).stroke({color:ink,width:3}).ellipse(x-side*5,-9,4,7).fill(ink);}
  const brow=this.brows.children[0] as Graphics;brow.clear().moveTo(-41,kind==='cejaIzquierda'?-38:-28).quadraticCurveTo(-23,kind==='cejaIzquierda'?-45:-35,-9,-28).stroke({color:this.character==='marta'?ink:0xc2c1ae,width:8,cap:'round'}).moveTo(9,-28).quadraticCurveTo(24,-36,40,-27).stroke({color:this.character==='marta'?ink:0xc2c1ae,width:8,cap:'round'});
  const mouth=this.mouth.children[0] as Graphics;mouth.clear();this.mouth.position.set(0,kind==='neutral'||kind==='tic'?0:7);
  if(kind==='beso')mouth.ellipse(0,34,6,9).fill(0xb76555).stroke({color:ink,width:3});
  else if(kind==='bocaAbierta'||kind==='lengua') {mouth.ellipse(0,36,12,9).fill(ink);if(kind==='lengua')mouth.ellipse(0,42,5,8).fill(0xc9786a).stroke({color:ink,width:2});}
  else if(kind==='morderLabio')mouth.roundRect(-14,30,28,13,5).fill(0xffefd1).stroke({color:ink,width:3}).moveTo(-12,40).quadraticCurveTo(0,47,12,40).stroke({color:0xa85043,width:4});
  else if(kind==='lamerLabio')mouth.moveTo(-15,35).quadraticCurveTo(0,44,15,35).stroke({color:ink,width:3}).ellipse(1,31,6,5).fill(0xc9786a).stroke({color:ink,width:2});
  else {const offset=kind==='labiosDerecha'?12:kind==='labiosIzquierda'?-12:0;mouth.moveTo(-16+offset,35).quadraticCurveTo(2+offset,46,20+offset,31).stroke({color:ink,width:4,cap:'round'});}
  const nose=this.head.children.find(c=>c.label==='nose');if(nose)nose.scale.x=kind==='nariz'?1.3:1;
  this.hands.rotation=kind==='menton'?-.15:0;this.head.updateCacheTexture();
 }
}
