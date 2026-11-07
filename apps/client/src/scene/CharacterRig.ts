import {Container,Graphics} from 'pixi.js';
const ink=0x29201d;
const outline={color:ink,width:5,join:'round' as const};
/** Cutout structure: final transparent PNGs can replace each named part. */
export class CharacterRig extends Container {
 torso=new Container();head=new Container();eyes=new Container();brows=new Container();mouth=new Container();arms=new Container();hands=new Container();baseScale=1;blinkClosed=false;
 constructor(public character:'washington'|'marta'='washington',back=false,color=0x487a76){
  super();this.label=back?'local-back':character;this.addChild(this.torso,this.arms,this.head,this.hands);
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
  const nose=new Graphics().moveTo(0,-16).quadraticCurveTo(-17,10,-5,15).quadraticCurveTo(13,20,18,9).quadraticCurveTo(19,1,6,2).fill(0xe5ad76).stroke({color:ink,width:3});
  this.mouth.addChild(new Graphics().moveTo(-16,35).quadraticCurveTo(2,46,20,31).stroke({color:ink,width:4,cap:'round'}));
  this.head.addChild(this.eyes,this.brows,nose,this.mouth);
  if(character==='washington')this.head.addChild(new Graphics().moveTo(0,20).bezierCurveTo(-14,12,-16,33,-36,24).bezierCurveTo(-31,45,-6,40,0,29).bezierCurveTo(9,42,29,43,36,24).bezierCurveTo(15,33,17,12,0,20).fill(0xc9c9b9).stroke({color:ink,width:3}));
  this.cacheParts();
 }
 cacheParts(){for(const part of [this.torso,this.arms,this.hands,this.head])part.cacheAsTexture({resolution:2,antialias:false});}
 breathe(time:number,reduced:boolean){if(reduced||this.label==='local-back')return;this.torso.scale.y=1+Math.sin(time*1.6)*.009;this.head.y=Math.sin(time*1.6)*1.5;const closed=time%4.7<.12;if(closed!==this.blinkClosed){this.blinkClosed=closed;this.eyes.scale.y=closed?.08:1;this.head.updateCacheTexture();}}
 gesture(kind:string){this.brows.y=kind==='cejas'?-8:0;this.eyes.scale.y=kind.startsWith('guino')?.35:1;this.head.updateCacheTexture();}
}
