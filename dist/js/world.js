import * as THREE from '../vendor/three.module.js';
import { calculate, occupied } from './math.js';
import { sceneSignature } from './navigation.js';
import { makeSurfaces, surfaceKind, makeEnvironment } from './surfaces.js';

const C={grass:0x8dac7b,grassLight:0xa4b990,stone:0xc7c8b4,edge:0x79877b,road:0x435450,cream:0xede2cb,gold:0xe6c68c,roof:0xb97853,glass:0x528e9a,tree:0x4c8055,darkTree:0x2f6046};
const clamp=THREE.MathUtils.clamp;
let randomSeed=42;
const random=()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296;};

class Batch{
 constructor(parent){this.parent=parent;this.items=new Map();}
 add(geometry,material,pos,scale=[1,1,1],rotation=[0,0,0]){
  const k=geometry.uuid+material.uuid;if(!this.items.has(k))this.items.set(k,{geometry,material,matrices:[]});
  const obj=new THREE.Object3D();obj.position.set(...pos);obj.scale.set(...scale);obj.rotation.set(...rotation);obj.updateMatrix();this.items.get(k).matrices.push(obj.matrix.clone());
 }
 finish(){for(const v of this.items.values()){const mesh=new THREE.InstancedMesh(v.geometry,v.material,v.matrices.length);v.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.parent.add(mesh);}this.items.clear();}
}

export class World{
 constructor(container,onProject,onFailure,onRecovery){
  this.container=container;this.onProject=onProject;this.onFailure=onFailure;this.mode='home';this.quality='auto';this.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;this.angle=0;this.targetAngle=0;this.zoom=1;this.targetZoom=1;this.time=0;this.completed=0;this.disposed=false;this.active=true;this.last=0;this.labId=-1;this.labValues=null;
  this.materials=new Map();this.dynamicGeometries=[];this.textures=new Map();this.dirty=true;this.selected=0;this.slowFrames=0;this.autoLow=false;this.onRecovery=onRecovery;
  try{
   this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
   this.renderer.setClearColor(0x285655);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.16;
   this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   this.renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(this.renderer.domElement);
   this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(0x688f89,.0045);
   this.camera=new THREE.OrthographicCamera(-35,35,25,-25,.1,220);this.camera.position.set(34,30,38);this.camera.lookAt(0,1,0);
   this.box=new THREE.BoxGeometry(1,1,1);this.cyl=new THREE.CylinderGeometry(1,1,1,24);this.cone=new THREE.ConeGeometry(1,1,16);this.sphere=new THREE.IcosahedronGeometry(1,2);this.leaf=new THREE.SphereGeometry(1,12,8);
   this.textures=makeSurfaces(this.renderer);this.environmentTarget=makeEnvironment(this.renderer);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.65;
   this.lighting();this.makeWater();this.city=new THREE.Group();this.scene.add(this.city);this.makeCity();
   this.lab=new THREE.Group();this.scene.add(this.lab);this.lab.visible=false;this.makeParticles();this.makeLabShader();
   this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.bind();
   this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;this.contextLost=true;this.fail();});
   this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.active=true;this.dirty=true;container.classList.remove('unavailable');container.querySelector('#fallback-city')?.remove();this.resize();this.onRecovery?.();});
   this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
  }catch(err){this.error=err;this.fail();}
 }
 fail(){this.container.classList.add('unavailable');this.onFailure?.();}
 mat(name,color,extra={}){if(!this.materials.has(name)){const texture=this.textures?.get(surfaceKind(name));this.materials.set(name,new THREE.MeshStandardMaterial({color,roughness:.8,metalness:0,envMapIntensity:.65,...(texture?{map:texture,bumpMap:texture,bumpScale:.018}:{}),...extra}));}return this.materials.get(name);}
 mesh(geo,mat,parent,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 boxAt(parent,mat,pos,scale,rot=[0,0,0]){return this.mesh(this.box,mat,parent,pos,scale,rot);}
 lighting(){
  this.scene.add(new THREE.HemisphereLight(0xd4e7ed,0x526347,1.75));
  this.sun=new THREE.DirectionalLight(0xffe3b6,3.15);this.sun.position.set(-22,38,16);this.sun.castShadow=true;
  this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-38,right:38,top:34,bottom:-34,near:1,far:100});this.sun.shadow.bias=-.00035;this.sun.shadow.normalBias=.025;this.sun.shadow.autoUpdate=false;this.sun.shadow.needsUpdate=true;this.scene.add(this.sun);
  const rim=new THREE.DirectionalLight(0xb4d8e2,.75);rim.position.set(18,18,-24);this.scene.add(rim);
 }
 makeWater(){
  this.waterMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uBoat:{value:new THREE.Vector3(-7,0,0)},uColor:{value:new THREE.Color('#376f76')}},vertexShader:`
   uniform float uTime;varying vec3 vWorld;
   void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=sin(w.x*.75+w.z*.45+uTime*.38)*.018;vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}
  `,fragmentShader:`
   uniform float uTime;uniform vec3 uColor;uniform vec3 uBoat;varying vec3 vWorld;
   float waves(vec2 p){return sin(p.x*.72+p.y*.38+uTime*.48)*.055+sin(p.x*1.4-p.y*1.1-uTime*.35)*.025+sin(p.y*2.8+p.x*.9+uTime*.7)*.009;}
   void main(){vec2 p=vWorld.xz;float e=.065;float h=waves(p);
    vec3 n=normalize(vec3((h-waves(p+vec2(e,0.)))/e,1.,(h-waves(p+vec2(0.,e)))/e));
    vec3 v=normalize(cameraPosition-vWorld),r=reflect(-v,n);float fresnel=.08+.42*pow(1.-max(dot(n,v),0.),4.);
    vec3 sky=mix(vec3(.32,.43,.44),vec3(.58,.71,.73),smoothstep(-.1,.9,r.y));
    vec3 sun=normalize(vec3(-.46,.82,.34));float spec=pow(max(dot(r,sun),0.),220.);
    float wide=pow(max(dot(r,sun),0.),24.);
    vec3 color=mix(uColor*(.9+h*.65),sky,fresnel);color+=vec3(1.,.84,.61)*(spec*.75+wide*.035);
    vec2 wake=p-uBoat.xz;float wakeLine=exp(-pow((abs(wake.x)-.5-abs(wake.y)*.07)*5.,2.))*(1.-smoothstep(0.,4.,abs(wake.y)));
    color+=vec3(.09,.12,.10)*wakeLine*.3;
    color=mix(color,vec3(.15,.26,.28),smoothstep(45.,100.,length(p))*.45);
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `,side:THREE.DoubleSide});
  this.water=this.mesh(new THREE.PlaneGeometry(180,180,64,64),this.waterMaterial,this.scene,[0,-.27,0],[1,1,1],[-Math.PI/2,0,0]);this.water.castShadow=false;this.water.receiveShadow=false;
 }

 land(parent,points){
  const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.72,bevelEnabled:true,bevelThickness:.18,bevelSize:.22,bevelSegments:2,steps:1,curveSegments:16});
  const mat=[this.mat('land',C.grass),this.mat('edge',C.edge)];const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.y=-.2;m.receiveShadow=true;m.castShadow=true;parent.add(m);
  return m;
 }
 tree(batch,x,z,s=1){
  const floor=batch.parent===this.lab?.5:.7;
  batch.add(this.cyl,this.mat('bark',0x786247),[x,floor+.7*s,z],[.13*s,1.4*s,.13*s]);
  const type=random()>.4?'tree':'tree2',m=this.mat(type,type==='tree'?C.tree:C.darkTree);
  batch.add(this.leaf||this.sphere,m,[x,floor+1.6*s,z],[.78*s,1.1*s,.75*s],[0,random()*6,0]);
  batch.add(this.leaf||this.sphere,this.mat('treeHigh',0x7f9c62),[x+.3*s,floor+2.05*s,z-.12*s],[.57*s,.7*s,.55*s]);
  batch.add(this.leaf||this.sphere,m,[x-.32*s,floor+1.65*s,z+.18*s],[.52*s,.63*s,.51*s]);
 }
 roofGeometry(){
  if(!this.pitchedRoof){const shape=new THREE.Shape();shape.moveTo(-.5,0);shape.lineTo(.5,0);shape.lineTo(0,.5);shape.closePath();this.pitchedRoof=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false});this.pitchedRoof.translate(0,0,-.5);}return this.pitchedRoof;
 }
 house(batch,x,z,w,d,h,type=0){
  const walls=[this.mat('walls1',0xe6ddc9),this.mat('walls2',0xc5d3c7),this.mat('walls3',0xd8ba9c),this.mat('walls4',0xacc7c5)];
  batch.add(this.box,walls[type%4],[x,h/2+.7,z],[w,h,d]);
  batch.add(this.box,this.mat('trim',0xe3d3b6),[x,h+.77,z],[w+.15,.2,d+.15]);
  if(h<3.5){batch.add(this.roofGeometry(),this.mat('roof',C.roof),[x,h+.87,z],[w+.25,1.25,d+.3]);}
  else{
   batch.add(this.box,this.mat('roofflat',0x5f7464),[x,h+.93,z],[w*.87,.2,d*.87]);
   if(random()>.5)batch.add(this.box,this.mat('glass',C.glass,{roughness:.32,metalness:.4}),[x,h+1.25,z],[w*.42,.5,d*.45]);
  }
  const window=this.mat('window',0x527f89,{emissive:0x809491,emissiveIntensity:.04,roughness:.14,metalness:.52});
  const rows=Math.max(1,Math.floor(h/.75)),cols=Math.max(1,Math.floor(w/.7));
  for(let y=0;y<rows;y++)for(let c=0;c<cols;c++){
   batch.add(this.box,window,[x-w/2+w*(c+.5)/cols,1.12+y*.75,z+d/2+.012],[.31,.34,.03]);
   batch.add(this.box,window,[x+w/2+.012,1.12+y*.75,z-d/2+d*(c+.5)/cols],[.03,.34,.31]);
  }
  batch.add(this.box,this.mat('door',0x425b4c),[x,.99,z+d/2+.03],[.35,.58,.05]);
  batch.add(this.box,this.mat('doorFrame',0xb7bdad),[x,1.05,z+d/2+.018],[.5,.7,.04]);
  if(h>4){for(let y=2;y<h;y+=1.5)batch.add(this.box,this.mat('floorTrim',0xd5d7c6),[x,y+.7,z+d/2+.04],[w+.06,.065,.1]);}
  if(type%2===0)batch.add(this.box,this.mat('awning',0x547a67),[x,1.4,z+d/2+.2],[w*.7,.065,.48]);
 }
 street(batch,x,z,w,d){
  batch.add(this.box,this.mat('curb',0xb0b29a),[x,.72,z],[w+.34,.1,d+.34]);
  batch.add(this.box,this.mat('road',C.road),[x,.8,z],[w,.055,d]);
  if(w>d)for(let xx=x-w/2+.5;xx<x+w/2;xx+=1.2)batch.add(this.box,this.mat('roadLine',0xd6c89e),[xx,.833,z],[.6,.01,.04]);
  else for(let zz=z-d/2+.5;zz<z+d/2;zz+=1.2)batch.add(this.box,this.mat('roadLine',0xd6c89e),[x,.833,zz],[.04,.01,.6]);
 }
 makeCity(){
  randomSeed=42;const batch=new Batch(this.city);
  this.land(this.city,[[-4,-14],[4,-17],[15,-14],[21,-7],[22,5],[17,13],[7,15],[-1,11],[-3,4],[-1,-2],[-5,-8]]);
  this.land(this.city,[[-26,-10],[-19,-14],[-11,-11],[-9,-4],[-12,1],[-8,8],[-12,14],[-22,11],[-28,3]]);
  for(const z of[-9,-1,7])this.street(batch,9,z,22,1.25);
  for(const x of[2,10,18])this.street(batch,x,0,1.25,22);
  this.street(batch,-18,-5,13,1.3);this.street(batch,-18,5,13,1.3);this.street(batch,-18,0,1.3,21);
  // Dense mixed-use blocks, individual façades and small roof gardens.
  for(const z of[-12,-5,3,10])for(const x of[5,13]){
   if(z===-12&&x===5||z===3&&x===13||z===10&&x===13)continue;
   for(let i=0;i<4;i++){const xx=x+(i%2)*2.3-1.1,zz=z+Math.floor(i/2)*2.3-1.1;this.house(batch,xx,zz,1.55+random()*.45,1.7+random()*.45,2+random()*(z===-5?6:3),Math.floor(random()*4));}
   for(let i=0;i<3;i++)this.tree(batch,x-3+random()*6,z+2,.5+random()*.35);
  }
  for(const z of[-8,1,9])for(const x of[-22,-14]){
   if(z===-8&&x===-14||z===9&&x===-14)continue;
   for(let i=0;i<3;i++)this.house(batch,x+(i-1)*1.7,z,1.25,1.7,1.7+random()*2,i);
   this.tree(batch,x,z+1.8,.6);
  }
  // Waterfront boardwalks and planted boulevards.
  for(let z=-11;z<12;z+=1.4){this.tree(batch,19.9,z,.55);if(z<0)this.tree(batch,-25,z,.65);}
  for(let i=0;i<38;i++){
   const x=random()>.5?16+random()*4:-24+random()*5,z=random()*23-11;
   if(Math.abs(z+9)<1||Math.abs(z-7)<1||Math.abs(z+1)<1)continue;this.tree(batch,x,z,.4+random()*.55);
  }
  this.street(batch,-1.6,0,1.0,19);
  batch.add(this.box,this.mat('boardwalk',0xb8a183),[-4.1,.7,5],[1.1,.22,9]);
  for(let z=1;z<10;z+=1.3)batch.add(this.cyl,this.mat('bark',0x786247),[-4.4,.05,z],[.12,1.8,.12]);
  // The main tower: a recognisable civic landmark, not a generic box.
  this.house(batch,4,-5,2.2,2.1,8.5,0);
  batch.add(this.cyl,this.mat('copper',0xd0bb91,{metalness:.35}),[4,9.7,-5],[1.2,.4,1.2]);
  batch.add(this.cone,this.mat('roofSpire',0x547763),[4,10.75,-5],[1.35,2.0,1.35]);
  batch.add(this.cyl,this.mat('copper',0xd0bb91),[4,12.1,-5],[.035,1.2,.035]);
  // The five mission locations.
  this.points=[new THREE.Vector3(4,3,-12),new THREE.Vector3(13,2,-10),new THREE.Vector3(13,2,8),new THREE.Vector3(-15,3,-8),new THREE.Vector3(-6,2.5,6)];
  this.beacons=[];
  for(let i=0;i<5;i++){
   const p=this.points[i];const g=new THREE.Group();g.position.set(p.x,0,p.z);this.city.add(g);
   const ringMat=new THREE.MeshBasicMaterial({color:0xdfc48c,transparent:true,opacity:.7,depthWrite:false});
   const ring=this.mesh(new THREE.TorusGeometry(i===4?2:2.3,.035,5,64),ringMat,g,[0,.89,0],[1,1,1],[Math.PI/2,0,0]);ring.castShadow=false;
   this.beacons.push({ring,mat:ringMat,group:g});
  }
  // Water treatment tower.
  const waterG=this.beacons[0].group;
  this.mesh(this.cyl,this.mat('waterTower',0xc8d9cf,{roughness:.5}),waterG,[0,2.6,0],[1.25,3.5,1.25]);
  this.mesh(this.cyl,this.mat('tankBand',0x658d85,{metalness:.2}),waterG,[0,3.5,0],[1.28,.15,1.28]);
  this.mesh(this.cone,this.mat('towerTop',0xa9bbaa),waterG,[0,4.65,0],[1.35,.65,1.35]);
  for(let y=1;y<4;y+=.3)batch.add(this.box,this.mat('metal',0x607d6b),[5.26,y,-12],[.2,.04,.32]);
  this.boxAt(waterG,this.mat('waterOffice',0xcbbfaa),[2,1.3,.5],[1.5,1.2,1.6]);
  // Recycling pavilion.
  const rG=this.beacons[1].group;
  this.boxAt(rG,this.mat('recycleHall',0xc2c6a0),[0,1.1,0],[3.8,.7,3.1]);
  this.boxAt(rG,this.mat('recycleRoof',0x586f4b),[0,1.55,0],[4.15,.2,3.35]);
  for(let i=0;i<3;i++)this.boxAt(rG,this.mat(`recycle${i}`,[0x759781,0xb1975d,0x779999][i]),[i-1,1.6,1.8],[.65,.8,.75]);
  // Central garden with circular fountain.
  const pG=this.beacons[2].group;
  this.mesh(this.cyl,this.mat('plaza',0xcbc4a8),pG,[0,.8,0],[3.2,.08,3.2]);
  this.mesh(this.cyl,this.mat('fountainStone',0xc7ccba),pG,[0,1,0],[1.05,.45,1.05]);
  this.mesh(this.cyl,this.mat('fountainWater',0x62a9a0,{metalness:.4,roughness:.15}),pG,[0,1.24,0],[.9,.025,.9]);
  this.mesh(this.cyl,this.mat('fountainStone',0xc7ccba),pG,[0,1.7,0],[.2,.95,.2]);
  this.mesh(this.sphere,this.mat('copper',C.gold),pG,[0,2.25,0],[.3,.3,.3]);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;this.tree(batch,13+Math.cos(a)*3.6,8+Math.sin(a)*3.6,.65);}
  // Solar institute, panel arrays and rotating wind turbines.
  const sG=this.beacons[3].group;
  this.boxAt(sG,this.mat('solarWall',0xd6cdb5),[0,1.4,0],[3.9,1.4,3.7]);
  this.boxAt(sG,this.mat('solarRoof',0x889780),[0,2.15,0],[4.1,.2,3.9]);
  for(let i=0;i<12;i++)this.boxAt(sG,this.mat('panel',0x316577,{roughness:.22,metalness:.6}),[(i%4)*.9-1.35,2.32,Math.floor(i/4)-1],[.8,.05,.8],[0,0,-.1]);
  this.turbines=[];
  for(let i=0;i<2;i++){
   const x=-23+i*5,z=-11;batch.add(this.cyl,this.mat('turbineWhite',0xd7d5ba),[x,2.5,z],[.13,4.0,.13]);
   const rotor=new THREE.Group();rotor.position.set(x,4.6,z);for(let j=0;j<3;j++){const blade=new THREE.Mesh(this.box,this.mat('turbineWhite',0xd7d5ba));blade.scale.set(.17,1.9,.05);blade.position.set(Math.sin(j*Math.PI*2/3)*.9,Math.cos(j*Math.PI*2/3)*.9,0);blade.rotation.z=-j*Math.PI*2/3;rotor.add(blade);}this.city.add(rotor);this.turbines.push(rotor);
  }
  // A small bridge spans the river. The upper structure grows after the last mission.
  const bG=this.beacons[4].group;
  this.boxAt(bG,this.mat('bridgeDeck',0xccbaa0),[0,1.15,0],[12,.35,2.4]);
  for(let x=-4;x<=4;x+=4)for(const z of[-.85,.85])this.mesh(this.cyl,this.mat('pier',0x8ca295),bG,[x,.12,z],[.24,2.0,.24]);
  for(const z of[-1.2,1.2])this.boxAt(bG,this.mat('bridgeRail',0x779488),[0,1.65,z],[12,.12,.1]);
  this.bridgeCrown=new THREE.Group();bG.add(this.bridgeCrown);
  for(const z of[-1.15,1.15]){
   this.beam(this.bridgeCrown,new THREE.Vector3(-5,1.8,z),new THREE.Vector3(0,4.8,z),this.mat('bridgeArch',0xd3c291),.11);
   this.beam(this.bridgeCrown,new THREE.Vector3(0,4.8,z),new THREE.Vector3(5,1.8,z),this.mat('bridgeArch',0xd3c291),.11);
   for(let x=-4;x<=4;x+=2)this.beam(this.bridgeCrown,new THREE.Vector3(x,1.8,z),new THREE.Vector3(x,4.8-Math.abs(x)*.6,z),this.mat('bridgeCable',0x8ca99a),.035);
  }
  this.bridgeCrown.visible=false;
  this.bridgeBarriers=new THREE.Group();bG.add(this.bridgeBarriers);
  for(const x of[-5.3,5.3])this.boxAt(this.bridgeBarriers,this.mat('closedBridge',0xb07f61),[x,1.65,0],[.1,.55,2.4]);
  // Planting and small lanterns appear as the city is recovered.
  this.recoveryDecor=[];
  for(let i=0;i<5;i++){
   const p=this.points[i],g=new THREE.Group(),decor=new Batch(g);this.city.add(g);
   if(i<4)for(let j=0;j<4;j++){const a=j*Math.PI/2+.6;this.tree(decor,p.x+Math.cos(a)*2.7,p.z+Math.sin(a)*2.7,.38);}
   for(const side of[-1,1]){
    const x=p.x+side*(i===4?5.8:2.1),z=p.z+2.1;
    decor.add(this.cyl,this.mat('lanternPost',0x648475),[x,1.45,z],[.038,1.5,.038]);
    decor.add(this.box,this.mat('lanternGlow',0xe8dba8,{emissive:0xd3b75b,emissiveIntensity:.7,roughness:.5}),[x,2.22,z],[.2,.22,.2]);
   }
   decor.finish();g.visible=false;this.recoveryDecor.push(g);
  }
  batch.finish();
  // The river stays open so no distant mesh obscures the districts at high zoom.
  this.makeStreetscape();this.makeVehicles();this.makeBoat();
 }
 makeStreetscape(){
  const detail=new THREE.Group();detail.name='Urban details';this.city.add(detail);const b=new Batch(detail);
  const timber=this.mat('boardwalk',0xb69b77),metal=this.mat('streetMetal',0x536d67,{metalness:.35,roughness:.48});
  for(const x of[2,10,18])for(const z of[-9,7]){
   for(let i=-3;i<=3;i++){b.add(this.box,this.mat('crosswalk',0xdedac3),[x+i*.14,.842,z+.83],[.085,.012,.58]);}
   b.add(this.cyl,metal,[x+1,1.8,z+1.1],[.045,2.15,.045]);b.add(this.box,metal,[x+.85,2.82,z+1.1],[.34,.07,.12]);
   b.add(this.box,this.mat('streetLamp',0xe8ddae,{emissive:0xe9c987,emissiveIntensity:.16}),[x+.72,2.8,z+1.1],[.16,.04,.12]);
  }
  for(let z=1;z<=9;z+=2){
   b.add(this.box,timber,[-3.94,1.03,z],[.44,.1,.85]);b.add(this.box,timber,[-4.15,1.32,z],[.07,.45,.85]);
   for(const dz of[-.3,.3])b.add(this.box,metal,[-3.96,.87,z+dz],[.28,.24,.055]);
  }
  const hedge=this.mat('hedge',0x4c754c);
  for(let z=-10;z<=10;z+=2){b.add(this.leaf||this.sphere,hedge,[20,.95,z],[.5,.3,.65]);}
  const rock=this.mat('riverStone',0x9aab9d,{roughness:1});
  for(let i=0;i<30;i++){const z=-12+i*.85,x=z<0?-2.1-(-z)*.08:-2.4+z*.12;b.add(this.sphere,rock,[x,.15,z],[.25+random()*.25,.32,.35],[random(),random()*3,0]);}
  for(const [x,z] of [[7,-12],[15,3],[-21,8]]){
   b.add(this.box,this.mat('parkPaving',0xc5c4af),[x,.75,z],[1.8,.05,1.4]);
   b.add(this.cyl,this.mat('planterStone',0xc9ccbb),[x,1,z],[.36,.45,.36]);b.add(this.leaf||this.sphere,hedge,[x,1.35,z],[.5,.4,.5]);
  }
  b.finish();
 }
 makeVehicles(){
  this.cars=[];
  const colors=[0xe1c8a2,0xb5c7bc,0xb38467,0x789ca1];
  for(let i=0;i<9;i++){
   const g=new THREE.Group();const mat=this.mat(`car${i%4}`,colors[i%4],{roughness:.5});
   this.boxAt(g,mat,[0,.15,0],[.42,.22,.7]);this.boxAt(g,this.mat('carGlass',0x365751),[0,.3,0],[.35,.17,.38]);
   for(const x of[-.22,.22])for(const z of[-.22,.22])this.mesh(this.cyl,this.mat('tyre',0x293e35),g,[x,.08,z],[.085,.04,.085],[0,0,Math.PI/2]);
   g.traverse(o=>{if(o.isMesh)o.castShadow=false;});this.city.add(g);this.cars.push({g,phase:i/9,route:i%3});
  }
 }
 makeBoat(){
  this.boat=new THREE.Group();this.boxAt(this.boat,this.mat('boat',0xb3c6b7),[0,.1,0],[.8,.3,2.0]);this.boxAt(this.boat,this.mat('boatRoof',0xede0bc),[0,.4,.2],[.6,.3,1.0]);this.scene.add(this.boat);
 }
 makeParticles(){
  const geo=new THREE.BufferGeometry(),pts=[];for(let i=0;i<100;i++)pts.push((random()-.5)*60,2+random()*14,(random()-.5)*42);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  this.particleMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uDpr:{value:Math.min(devicePixelRatio||1,1.5)}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'uniform float uTime;uniform float uDpr;varying float vGlow;void main(){vec3 p=position;p.y+=sin(uTime*.25+p.x)*.22;vGlow=.45+.3*sin(uTime*.6+p.x*2.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=4.0*uDpr;}',
   fragmentShader:'varying float vGlow;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,2.)*vGlow;gl_FragColor=vec4(.91,.79,.49,a);}' });
  this.particles=new THREE.Points(geo,this.particleMaterial);this.scene.add(this.particles);
 }
 makeLabShader(){
  this.labGridMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>.96)discard;vec2 coord=vUv*24.;vec2 cell=abs(fract(coord-.5)-.5)/max(fwidth(coord),vec2(.0001));float line=1.-min(min(cell.x,cell.y),1.);float ring=1.-smoothstep(.003,.008,abs(r-.82));float pulse=exp(-pow((r-mod(uTime*.07,1.2))/.035,2.))*.08;float a=(line*.095+ring*.12+pulse)*(1.-smoothstep(.72,.96,r));gl_FragColor=vec4(.87,.81,.57,a);}' });
 }
 beam(parent,a,b,mat,r=.06){const length=a.distanceTo(b);const m=this.mesh(this.cyl,mat,parent,a.clone().add(b).multiplyScalar(.5).toArray(),[r,length,r]);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m;}
 label(text,parent,pos,size=1){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,384,96);ctx.fillStyle='rgba(14,39,32,.88)';ctx.beginPath();ctx.roundRect(8,8,368,80,18);ctx.fill();ctx.font='500 38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f2e8ce';ctx.fillText(text,192,49);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});const sprite=new THREE.Sprite(mat);sprite.position.set(...pos);sprite.scale.set(size*2.6,size*.65,1);sprite.renderOrder=10;parent.add(sprite);return sprite;
 }
 setProgress(n){const changed=this.completed!==n;this.completed=n;if(!this.beacons)return;this.beacons.forEach((b,i)=>{b.mat.color.set(i<n?0x9bd9b0:0xdfc48c);b.mat.opacity=i<=n?.7:.24;});this.bridgeCrown.visible=n>=5;this.bridgeBarriers.visible=n<5;this.recoveryDecor.forEach((g,i)=>g.visible=i<n);const panels=this.materials.get('panel');if(panels){panels.emissive.set(n>=4?0x5a927f:0x000000);panels.emissiveIntensity=n>=4?.14:0;}if(changed)this.invalidate();}
 invalidate(){this.dirty=true;if(this.sun)this.sun.shadow.needsUpdate=true;}
 selectDistrict(id){this.selected=id;this.dirty=true;}
 setMode(mode,id=-1,values=null){
  const changed=this.mode!==mode||this.labId!==id;this.mode=mode;
  if(changed){this.targetZoom=1;this.targetAngle=0;this.cameraMoving=true;this.invalidate();}
  if(!this.renderer)return;
  const isLab=mode==='mission'||mode==='tutorial';this.city.visible=!isLab;this.lab.visible=isLab;this.boat.visible=!isLab;this.particles.visible=!isLab;
  if(isLab)this.setLab(id,values);else this.labId=-1;this.resize();
 }
 clearLab(){
  const geometries=new Set();this.lab.traverse(o=>{if(o.isSprite){o.material.map?.dispose();o.material.dispose();}if(o.isInstancedMesh)o.dispose();if(o.geometry&&![this.box,this.cyl,this.cone,this.sphere,this.leaf,this.pitchedRoof].includes(o.geometry))geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());
  this.lab.clear();this.labValues=null;this.labSignature=null;this.tankWater=null;this.solarPanels=null;this.containerGroups=null;
 }
 setLab(id,values){
  if(!this.renderer)return;const signature=sceneSignature(id,values||{});
  if(this.labId===id&&this.labSignature===signature)return;
  if(this.labId===id&&id===3&&this.solarPanels){this.updateSolarPanels(values?.panels??40);this.labValues=structuredClone(values||{});this.labSignature=signature;this.invalidate();return;}
  if(this.labId===id&&id===1&&this.containerGroups){const slots=new Set(values?.slots||[]);this.containerGroups.forEach((g,i)=>g.visible=slots.has(i));this.labValues=structuredClone(values||{});this.labSignature=signature;this.invalidate();return;}
  this.clearLab();this.labId=id;this.labValues=structuredClone(values||{});
  const stone=this.mat('labStone',0xadc0ab),gold=this.mat('labGold',0xe1ca95,{metalness:.3,roughness:.45});
  if(id===4){
   for(const x of[-6.8,6.8])this.boxAt(this.lab,stone,[x,.25,0],[3.4,1,8]);
  }else{
   const shape=new THREE.Shape();shape.absarc(0,0,8.6,0,Math.PI*2,false);const geo=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelThickness:.15,bevelSize:.2,bevelSegments:3,curveSegments:70});
   this.mesh(geo,stone,this.lab,[0,-.12,0],[1,1,1],[-Math.PI/2,0,0]);
   this.mesh(new THREE.TorusGeometry(8.62,.026,4,90),gold,this.lab,[0,.35,0],[1,1,1],[Math.PI/2,0,0]);
   const grid=this.mesh(new THREE.PlaneGeometry(17.2,17.2),this.labGridMaterial,this.lab,[0,.51,0],[1,1,1],[-Math.PI/2,0,0]);grid.castShadow=false;grid.receiveShadow=false;
  }
  if(id===0)this.makeTank(values);
  else if(id===1)this.makeContainers(values);
  else if(id===2)this.makePark(values);
  else if(id===3)this.makeSolar(values);
  else if(id===4)this.makeBridge(values);
  else this.makeTutorial();
  this.labSignature=signature;this.invalidate();
 }
 makeTank(v){
  const scale=.55,r=(v?.r||3)*scale,h=(v?.h||6)*scale;
  const tank=new THREE.Group();tank.position.y=.5;this.lab.add(tank);
  this.mesh(this.cyl,this.mat('tankFoundation',0x7b9c8a),tank,[0,.14,0],[r+.45,.28,r+.45]);
  const shell=this.mat('labTank',0x9ec5be,{transparent:true,opacity:.38,roughness:.22,metalness:.18,depthWrite:false,side:THREE.DoubleSide});
  this.mesh(new THREE.CylinderGeometry(r,r,h,48,1,true),shell,tank,[0,h/2+.3,0]);
  this.tankWater=this.mesh(this.cyl,this.mat('labTankWater',0x468d91,{transparent:true,opacity:.87,roughness:.16,metalness:.35}),tank,[0,h*.4+.3,0],[r*.95,h*.8,r*.95]);
  for(const y of[.35,h/2+.3,h+.3])this.mesh(new THREE.TorusGeometry(r+.015,.035,6,56),this.mat('tankRim',0xd5dccb,{metalness:.4}),tank,[0,y,0],[1,1,1],[Math.PI/2,0,0]);
  this.mesh(this.cone,this.mat('labTankRoof',0xb6cebb,{metalness:.3}),tank,[0,h+.55,0],[r*1.05,.5,r*1.05]);
  // Pipes, valve and a proper access ladder.
  this.beam(tank,new THREE.Vector3(r+.1,.2,0),new THREE.Vector3(r+.1,h+.35,0),this.mat('tankPipe',0xe1c993),.08);
  this.beam(tank,new THREE.Vector3(r+.1,.5,0),new THREE.Vector3(r+1.4,.5,0),this.mat('tankPipe',0xe1c993),.08);
  this.mesh(new THREE.TorusGeometry(.18,.025,5,24),this.mat('valve',0xbd6f50),tank,[r+1,.5,0]);
  for(const z of[-.24,.24])this.beam(tank,new THREE.Vector3(-r-.15,.2,z),new THREE.Vector3(-r-.15,h+.3,z),this.mat('ladder',0x769a89),.025);
  for(let y=.35;y<h+.3;y+=.25)this.beam(tank,new THREE.Vector3(-r-.15,y,-.24),new THREE.Vector3(-r-.15,y,.24),this.mat('ladder',0x769a89),.023);
  this.boxAt(this.lab,this.mat('tankPlot',0x799f82),[0,.48,0],[11,.03,8.25]);
  this.measure(this.lab,new THREE.Vector3(-r,.6,r+.65),new THREE.Vector3(r,.6,r+.65),`${(v?.r||3)*2} m`);
  this.measure(this.lab,new THREE.Vector3(r+.8,.8,.7),new THREE.Vector3(r+.8,h+.8,.7),`${v?.h||6} m`);
  this.label('20 × 15 m',this.lab,[-4,.9,4.2],.7);
  const batch=new Batch(this.lab);for(let i=0;i<5;i++)this.tree(batch,-4.5+i*2.2,-3.7,.4);batch.finish();
 }
 measure(parent,a,b,text){
  const mat=this.mat('measurement',0xe7d9ae,{emissive:0x8f7542,emissiveIntensity:.2});this.beam(parent,a,b,mat,.014);const direction=b.clone().sub(a).normalize();let cross=new THREE.Vector3(0,.16,0);if(Math.abs(direction.y)>.8)cross.set(.17,0,0);
  this.beam(parent,a.clone().sub(cross),a.clone().add(cross),mat,.018);this.beam(parent,b.clone().sub(cross),b.clone().add(cross),mat,.018);
  this.label(text,parent,a.clone().add(b).multiplyScalar(.5).add(new THREE.Vector3(0,.43,.1)).toArray(),.66);
 }
 makeContainers(v){
  const s=.7;this.boxAt(this.lab,this.mat('containerPlot',0xb5bea4),[0,.43,0],[12*s,.1,6*s]);
  this.boxAt(this.lab,this.mat('aisle',0x71877b),[0,.5,0],[12*s,.025,2*s]);
  const slots=new Set(v?.slots||[]);this.containerGroups=[];
  for(let i=0;i<8;i++){
   const x=(i%4)*3*s-4.5*s,z=(i<4?-2:2)*s;
   this.boxAt(this.lab,this.mat('slot',0x8ba391),[x,.505,z],[2.8*s,.035,1.9*s]);
   const container=new THREE.Group();this.lab.add(container);container.visible=slots.has(i);this.containerGroups.push(container);
   const mat=this.mat(`binColor${i%3}`,[0x627f6c,0xab9470,0x598a8a][i%3]);
   this.boxAt(container,mat,[x,.52+1.5*s/2,z],[3*s,1.5*s,2*s]);
   this.boxAt(container,this.mat('binLid',0xbac2a4),[x,.58+1.5*s,z],[3*s+.06,.12,2*s+.06]);
   for(let j=0;j<5;j++)this.boxAt(container,this.mat('binRib',0x8caa91),[x-1.05+j*.5,1,z+1*s+.01],[.05,.7,.03]);
   this.label('9 m³',container,[x,2.05,z],.4);
  }
  this.measure(this.lab,new THREE.Vector3(-4.2,.8,2.8),new THREE.Vector3(4.2,.8,2.8),'12 m');
  this.measure(this.lab,new THREE.Vector3(4.65,.8,-2.1),new THREE.Vector3(4.65,.8,2.1),'6 m');
  this.label('Passagem livre',this.lab,[0,.9,0],.8);
 }
 makePark(v){
  const s=.22,block=occupied(v?.bx||0,v?.by||0),green=new Set(v?.green||[]);const batch=new Batch(this.lab);
  this.boxAt(this.lab,this.mat('parkPlot',0xc2c2a4),[0,.43,0],[11,.1,6.6]);
  for(let n=0;n<60;n++){
   const x=(n%10+.5)*1.1-5.5,z=(Math.floor(n/10)+.5)*1.1-3.3;
   if(n>=50){batch.add(this.box,this.mat('parkRoad',0x667a6b),[x,.52,z],[1.1,.03,1.1]);batch.add(this.box,this.mat('roadLine',0xd6c89e),[x,.55,z],[.5,.02,.04]);}
   else if(green.has(n)&&!block.has(n)){batch.add(this.box,this.mat('paintGreen',0x759c70),[x,.54,z],[1.06,.04,1.06]);if(n%3===0)this.tree(batch,x,z,.3);}
   else if(!block.has(n))batch.add(this.box,this.mat('parkPaving',0xacb596),[x,.5,z],[1.06,.025,1.06]);
  }
  const x=((v?.bx||0)*5+10-25)*s,z=((v?.by||0)*5+7.5-15)*s;
  this.house(batch,x,z,20*s,15*s,12*s,0);
  batch.finish();this.label('Centro comunitário',this.lab,[x,4.2,z],.9);
  this.measure(this.lab,new THREE.Vector3(-5.5,.85,4.2),new THREE.Vector3(5.5,.85,4.2),'50 m');
  this.measure(this.lab,new THREE.Vector3(6.1,.85,-3.3),new THREE.Vector3(6.1,.85,3.3),'30 m');
 }
 makeSolar(v){
  const s=.5,w=6,l=10,base=2.8,rise=2.25;
  this.boxAt(this.lab,this.mat('solarPlot',0x88a47e),[0,.43,0],[12,.08,13]);
  this.boxAt(this.lab,this.mat('solarLabWalls',0xd7cbb1),[0,base/2+.5,0],[w,base,l]);
  for(const x of[-3.02,3.02])for(let z=-4.2;z<=4.2;z+=1.4)this.boxAt(this.lab,this.mat('solarLabWindow',0x528780,{metalness:.3,roughness:.23}),[x,2,z],[.04,1,.85]);
  const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:l,bevelEnabled:false,steps:1});this.mesh(geo,this.mat('roofClay',0xbc8763),this.lab,[0,base+.5,-l/2]);
  this.solarPanels=new THREE.Group();this.lab.add(this.solarPanels);
  this.updateSolarPanels(v?.panels??40);
  this.measure(this.lab,new THREE.Vector3(-3,.95,6),new THREE.Vector3(3,.95,6),'12 m');
  this.measure(this.lab,new THREE.Vector3(3.8,.9,-5),new THREE.Vector3(3.8,.9,5),'20 m');
  this.label('4,5 m',this.lab,[.3,base+.5+rise/2,5.5],.75);
  this.label('g = ?',this.lab,[-2.1,base+rise/2+1.0,5.4],.65);
  this.sunDial=new THREE.Group();this.sunDial.position.set(-5.2,1.5,-4);this.lab.add(this.sunDial);this.mesh(this.sphere,this.mat('sunOrb',0xefd19a,{emissive:0xdc9b48,emissiveIntensity:.4}),this.sunDial,[0,0,0],[.4,.4,.4]);
 }
 updateSolarPanels(count){
  count=Math.max(0,Math.min(120,Math.round(count)));const s=this.solarPanels;
  if(!s)return;const base=2.8,rise=2.25,w=6,angle=Math.atan(rise/(w/2));
  if(!s.children.length&&count>0){
   const frame=new THREE.InstancedMesh(this.box,this.mat('solarFrame',0xa9c0b7,{metalness:.5}),120);
   const cells=new THREE.InstancedMesh(this.box,this.mat('solarCell',0x2e6778,{metalness:.62,roughness:.19}),120);
   const o=new THREE.Object3D();
   for(let i=0;i<120;i++){
    const side=i%2===0?-1:1,idx=Math.floor(i/2),col=idx%10,row=Math.floor(idx/10),distance=(row+.55)/6*3*.93;
    const x=side*distance,y=base+.5+rise-distance*rise/3+.06,z=-4.5+col;
    o.position.set(x,y,z);o.scale.set(.49,.04,.91);o.rotation.set(0,0,-side*angle);o.updateMatrix();frame.setMatrixAt(i,o.matrix);
    o.position.set(x+side*.022*Math.sin(angle),y+.022*Math.cos(angle),z);o.scale.set(.45,.028,.85);o.updateMatrix();cells.setMatrixAt(i,o.matrix);
   }
   for(const mesh of [frame,cells]){mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();s.add(mesh);}
  }
  if(count===0){s.children.forEach(m=>m.dispose());s.clear();return;}
  s.children.forEach(m=>{m.count=count;m.instanceMatrix.needsUpdate=true;});
 }

 makeBridge(v){
  const s=.68,base=1.0,zs=[-1.7,1.7],gold=this.mat('bridgeLab',0xc8c2a3,{metalness:.36,roughness:.5});
  this.boxAt(this.lab,this.mat('bridgePlatform',0xbac8ac),[0,base,0],[12*s,.35,5*s]);
  const prismShape=new THREE.Shape();prismShape.moveTo(-6*s,0);prismShape.lineTo(6*s,0);prismShape.lineTo(0,8*s);prismShape.closePath();
  const prismGeometry=new THREE.ExtrudeGeometry(prismShape,{depth:5*s,bevelEnabled:false});
  const prism=this.mesh(prismGeometry,this.mat('bridgePrism',0x81b2a3,{transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}),this.lab,[0,base+.25,-1.7]);prism.castShadow=false;
  for(const z of zs){
   const a=new THREE.Vector3(-6*s,base+.25,z),b=new THREE.Vector3(6*s,base+.25,z),c=new THREE.Vector3(0,base+.25+8*s,z);
   this.beam(this.lab,a,b,gold,.1);this.beam(this.lab,new THREE.Vector3(0,base+.25,z),c,this.mat('bridgeMast',0x759a84),.075);
   for(const [start,end,length]of[[a,c,v?.left||0],[b,c,v?.right||0]]){
    const guide=this.beam(this.lab,start,end,this.mat('bridgeGuide',0x537f73,{transparent:true,opacity:.42}),.035);
    if(length){const endpoint=start.clone().lerp(end,length/10);this.beam(this.lab,start,endpoint,length===10?gold:this.mat('bridgeWrong',0xc7846d),.105);}
   }
   this.measure(this.lab,new THREE.Vector3(-6*s,.7,z+.4),new THREE.Vector3(0,.7,z+.4),'6 m');
  }
  for(let x=-4;x<=4;x+=2)for(const z of zs)this.beam(this.lab,new THREE.Vector3(x,base+.15,z),new THREE.Vector3(x,base+.3+Math.max(0,8*s-Math.abs(x)*8/6),z),this.mat('bridgeThreads',0x709989),.023);
  this.beam(this.lab,new THREE.Vector3(0,base+.25+8*s,-1.7),new THREE.Vector3(0,base+.25+8*s,1.7),gold,.08);
  this.label('8 m',this.lab,[.85,base+3,2.3],.6);
  this.label('5 m',this.lab,[5.1,base+.2,0],.7);
  this.label(v?.left?`${v.left} m`:'Diagonal ?',this.lab,[-2.6,4.3,2.0],.7);
  this.label(v?.right?`${v.right} m`:'Diagonal ?',this.lab,[2.6,4.3,2.0],.7);
 }
 makeTutorial(){
  this.boxAt(this.lab,this.mat('tutorialGrass',0x8aad7b),[0,.5,0],[6,.12,4]);
  this.measure(this.lab,new THREE.Vector3(-3,.9,2.8),new THREE.Vector3(3,.9,2.8),'6 m');this.measure(this.lab,new THREE.Vector3(3.6,.9,-2),new THREE.Vector3(3.6,.9,2),'4 m');
  const batch=new Batch(this.lab);for(let x=-2;x<=2;x+=2)this.tree(batch,x,-1,.7);batch.finish();this.label('Praça de treino',this.lab,[0,3.6,0],1);
 }
 configure(settings){
  this.quality=settings.quality;this.autoLow=false;this.slowFrames=0;
  this.motion=settings.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.last=0;this.dirty=true;if(this.renderer)this.resize();
 }
 resize(){
  if(!this.renderer)return;const w=this.container.clientWidth,h=this.container.clientHeight;if(w<1||h<1)return;
  const low=this.quality==='low'||this.quality==='auto'&&(w<600||this.autoLow);
  const ratio=Math.min(devicePixelRatio||1,low?1:this.quality==='high'?1.75:1.35);
  if(this.width!==w||this.height!==h||this.pixelRatio!==ratio){this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.width=w;this.height=h;this.pixelRatio=ratio;}
  this.renderer.shadowMap.enabled=!low;this.particles.visible=!low&&!['mission','tutorial'].includes(this.mode);
  if(this.sun){const size=this.quality==='high'?2048:1024;if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(size,size);}this.sun.shadow.needsUpdate=true;}
  this.waterMaterial?.uniforms.uTime&&(this.waterMaterial.uniforms.uTime.value=this.time);
  this.cameraMoving=true;this.dirty=true;this.updateCamera();
 }
 updateCamera(){
  const isLab=this.mode==='mission'||this.mode==='tutorial',aspect=this.width/this.height;
  let span=isLab?Math.max(15.5,21/aspect):Math.max(45,64/aspect),offset=0;
  if(this.mode==='home'||this.mode==='intro'){span=Math.max(51,68/aspect);offset=this.width>980?-.31:0;}
  if(this.mode==='final'){span=Math.max(50,68/aspect);offset=0;}
  const ease=this.motion?1-Math.exp(-(this.frameDelta||.016)*10):1;
  this.cameraSpan??=span;this.cameraOffset??=offset;this.cameraLook??=new THREE.Vector3(0,1.5,0);
  this.labEye??=new THREE.Vector3(19,17,23);this.cityEye??=new THREE.Vector3(34,30,38);this.lookTarget??=new THREE.Vector3();
  this.cameraSpan=THREE.MathUtils.lerp(this.cameraSpan,span,ease);this.cameraOffset=THREE.MathUtils.lerp(this.cameraOffset,offset,ease);
  const half=this.cameraSpan/2/this.zoom,off=this.cameraOffset;
  this.camera.left=(-aspect+off*aspect)*half;this.camera.right=(aspect+off*aspect)*half;this.camera.top=half;this.camera.bottom=-half;
  this.cameraEye??=new THREE.Vector3();this.orbitAxis??=new THREE.Vector3(0,1,0);
  this.cameraEye.copy(isLab?this.labEye:this.cityEye).applyAxisAngle(this.orbitAxis,this.angle);
  this.camera.position.lerp(this.cameraEye,ease);this.lookTarget.set(0,isLab?1.9:1.5,0);this.cameraLook.lerp(this.lookTarget,ease);this.camera.lookAt(this.cameraLook);
  this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  this.cameraMoving=Math.abs(this.cameraSpan-span)>.001||Math.abs(this.cameraOffset-offset)>.001||this.camera.position.distanceTo(this.cameraEye)>.001;
 }
 bind(){
  let drag=null,pinch=null;const touches=new Map();
  const stageOf=e=>e.target.closest?.('.map-space,.mission-stage,.tutorial-stage');
  document.addEventListener('pointerdown',e=>{
   const stage=stageOf(e);if(!stage||e.button!==0||e.target.closest('button,input,a,select'))return;
   stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);
   touches.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={id:e.pointerId,x:e.clientX,angle:this.targetAngle};
   if(touches.size===2){const [a,b]=[...touches.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:this.targetZoom};}
  });
  document.addEventListener('pointermove',e=>{
   if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinch&&touches.size===2){const [a,b]=[...touches.values()];this.targetZoom=clamp(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),.7,1.65);}
   else if(drag?.id===e.pointerId)this.targetAngle=clamp(drag.angle+(e.clientX-drag.x)*.006,-1.3,1.3);
   this.dirty=true;
  });
  const end=e=>{touches.delete(e.pointerId);pinch=null;drag=null;};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  document.addEventListener('wheel',e=>{if(!stageOf(e)||e.target.closest('button'))return;e.preventDefault();this.zoomBy(-Math.sign(e.deltaY)*.06);},{passive:false});
  document.addEventListener('keydown',e=>{
   if(!stageOf(e)||e.target.closest('button,input,select'))return;
   const keys={'ArrowLeft':()=>this.rotate(-.15),'ArrowRight':()=>this.rotate(.15),'+':()=>this.zoomBy(.1),'=':()=>this.zoomBy(.1),'-':()=>this.zoomBy(-.1),'r':()=>this.reset(),'R':()=>this.reset()};
   if(keys[e.key]){e.preventDefault();keys[e.key]();}
  });
  document.addEventListener('visibilitychange',()=>{this.active=!document.hidden&&!this.contextLost;this.last=0;this.dirty=true;});
 }
 rotate(delta){this.targetAngle=clamp(this.targetAngle+delta,-1.3,1.3);this.dirty=true;}
 zoomBy(delta){this.targetZoom=clamp(this.targetZoom+delta,.7,1.65);this.dirty=true;}
 reset(){this.targetZoom=1;this.targetAngle=0;this.dirty=true;}

 frame(timestamp){
  if(this.disposed)return;this.raf=requestAnimationFrame(this.frame);if(!this.active||!this.renderer)return;
  const minimum=this.quality==='low'||this.autoLow?1000/30:1000/60;if(timestamp-this.last<minimum-.5)return;
  const dt=Math.min(.05,(timestamp-this.last)/1000||.016);this.last=timestamp;this.frameDelta=dt;
  if(this.quality==='auto'&&!this.autoLow&&this.time>3){this.slowFrames=dt>.032?this.slowFrames+1:Math.max(0,this.slowFrames-1);if(this.slowFrames>90){this.autoLow=true;this.resize();}}
  const moving=Math.abs(this.angle-this.targetAngle)>.0001||Math.abs(this.zoom-this.targetZoom)>.0001||this.cameraMoving;
  if(!this.motion&&!moving&&!this.dirty)return;
  if(this.motion)this.time+=dt;
  const t=this.time;this.angle=THREE.MathUtils.lerp(this.angle,this.targetAngle,1-Math.exp(-dt*9));this.zoom=THREE.MathUtils.lerp(this.zoom,this.targetZoom,1-Math.exp(-dt*8));
  if(moving||this.dirty)this.updateCamera();
  this.waterMaterial.uniforms.uTime.value=t;
  this.particleMaterial.uniforms.uTime.value=t;this.labGridMaterial.uniforms.uTime.value=t;
  this.beacons.forEach((b,i)=>{b.ring.scale.setScalar(1+(this.motion&&i===this.selected?Math.sin(t*1.4)*.03:0));});
  this.turbines.forEach((g,i)=>g.rotation.z=t*.45+i*1.2);
  for(const car of this.cars){const a=(t*.035+car.phase)%1;let x,z,rot;const route=car.route;
   if(a<.35){x=2+(a/.35)*16;z=-9+.23;rot=Math.PI/2;}else if(a<.5){x=18-.23;z=-9+(a-.35)/.15*16;rot=0;}else if(a<.85){x=18-(a-.5)/.35*16;z=7-.23;rot=-Math.PI/2;}else{x=2+.23;z=7-(a-.85)/.15*16;rot=Math.PI;}
   car.g.position.set(x,.92,z);car.g.rotation.y=rot;
  }
  this.boat.position.set(-6.8+Math.sin(t*.065)*.5,-.04,Math.sin(t*.055)*16);this.boat.rotation.y=Math.cos(t*.055)>0?0:Math.PI;
  this.waterMaterial.uniforms.uBoat.value.copy(this.boat.position);
  if(this.motion)this.particles.rotation.y=t*.004;
  try{this.renderer.render(this.scene,this.camera);this.dirty=false;}catch{this.active=false;this.fail();return;}
  if(this.mode==='map'){
   this.city.updateMatrixWorld();this.projected??=this.points.map(()=>({x:0,y:0,visible:true}));this.projectVector??=new THREE.Vector3();this.points.forEach((p,i)=>{const v=this.projectVector.copy(p).applyMatrix4(this.city.matrixWorld).project(this.camera),q=this.projected[i];q.x=(v.x*.5+.5)*this.width;q.y=(-v.y*.5+.5)*this.height;q.visible=v.z>=-1&&v.z<=1;});this.onProject?.(this.projected);
  }
 }
}
