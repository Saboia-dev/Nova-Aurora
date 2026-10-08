import * as THREE from '../vendor/three.module.js';

// Small local textures: no network requests, large bitmaps or per-frame canvas work.
export function makeSurfaces(renderer) {
 if(typeof document==='undefined')return new Map();
 const result=new Map(),size=256;
 let seed=73421;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(const kind of ['grass','plaster','stone','asphalt','clay','wood','solar']) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),data=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
   let v=230+(rand()-.5)*24;
   if(kind==='grass')v=204+(rand()-.5)*52+Math.sin(x*.2+y*.11)*6;
   if(kind==='asphalt')v=214+(rand()-.5)*52;
   if(kind==='stone'){v=218+(rand()-.5)*20;if(x%64<2||y%64<2)v=180;}
   if(kind==='clay'){v=210+Math.sin(x/256*Math.PI*16)*16+(rand()-.5)*10;if(y%32<3)v-=30;}
   if(kind==='wood')v=209+Math.sin(x*.16+Math.sin(y*.05))*18+(rand()-.5)*13;
   if(kind==='solar'){v=238+(rand()-.5)*4;if(x%32<2||y%48<2)v=105;if(x%8===0)v-=12;}
   const i=(y*size+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  texture.repeat.set(kind==='solar'?1:2,kind==='solar'?1:2);result.set(kind,texture);
 }
 return result;
}
export function surfaceKind(name) {
 if(/solarCell|^panel$/.test(name))return 'solar';
 if(/grass|land$|paintGreen|solarPlot|tankPlot|treeHigh/i.test(name))return 'grass';
 if(/road$|parkRoad|aisle/i.test(name))return 'asphalt';
 if(/roofClay|^roof$/.test(name))return 'clay';
 if(/boardwalk|bark/.test(name))return 'wood';
 if(/wall|Office|Hall/i.test(name))return 'plaster';
 if(/Stone|stone|plaza|paving|Plot|Foundation|curb|edge|pier|Deck/i.test(name))return 'stone';
 return null;
}

export function makeEnvironment(renderer) {
 const scene=new THREE.Scene();
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  varying vec3 vDirection;
  void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.2,.8,d.y);
   vec3 sky=mix(vec3(.57,.65,.61),vec3(.24,.44,.55),h);
   float sun=pow(max(dot(d,normalize(vec3(-.5,.8,.35))),0.),180.);
   sky+=vec3(2.0,1.55,.95)*sun;gl_FragColor=vec4(sky,1.);
  }`});
 const geometry=new THREE.SphereGeometry(40,24,12);scene.add(new THREE.Mesh(geometry,material));
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(scene,.035,.1,100);
 material.dispose();geometry.dispose();pmrem.dispose();return target;
}
