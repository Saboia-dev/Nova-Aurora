import test from'node:test';
import assert from'node:assert/strict';
import * as THREE from'../dist/vendor/three.module.js';
import{World}from'../dist/js/world.js';
import{solution}from'../dist/js/math.js';
function scene(){
 const w=Object.create(World.prototype);Object.assign(w,{materials:new Map(),scene:new THREE.Scene(),city:new THREE.Group(),lab:new THREE.Group(),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,20),cone:new THREE.ConeGeometry(1,1,7),sphere:new THREE.IcosahedronGeometry(1,1),renderer:{}});
 w.label=(text,parent,pos,size=1)=>{const label=new THREE.Sprite(new THREE.SpriteMaterial());label.position.set(...pos);label.scale.set(size*2.6,size*.65,1);label.userData.text=text;parent.add(label);return label;};w.scene.add(w.city,w.lab);w.makeLabShader();return w;
}
function geometryCheck(root){
 let count=0;root.traverse(o=>{if(o.isMesh){count++;for(const n of o.matrix.elements)assert.ok(Number.isFinite(n));const pos=o.geometry.attributes.position;for(let i=0;i<pos.array.length;i++)assert.ok(Number.isFinite(pos.array[i]));}});return count;
}
test('A cidade contém cinco distritos, treliça recuperável e geometrias finitas',()=>{
 const w=scene();w.makeCity();w.city.updateMatrixWorld(true);assert.equal(w.points.length,5);assert.equal(w.beacons.length,5);assert.ok(geometryCheck(w.city)>50);w.setProgress(5);assert.equal(w.bridgeCrown.visible,true);w.setProgress(0);assert.equal(w.bridgeCrown.visible,false);
});
test('Ruas e edifícios estão sobre a superfície do terreno',()=>{
 const w=scene();const land=w.land(w.city,[[0,0],[5,0],[5,5],[0,5]]);land.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(land);assert.ok(Math.abs(bounds.max.y-.7)<.0001,`${bounds.max.y}`);assert.ok(.8-.0275>bounds.max.y);
});
test('As cinco bancadas geram modelos finitos e ficam dentro de limites previsíveis',()=>{
 const w=scene();for(let i=0;i<5;i++){w.setLab(i,structuredClone(solution[i]));w.lab.updateMatrixWorld(true);assert.ok(geometryCheck(w.lab)>3);const b=new THREE.Box3().setFromObject(w.lab);assert.ok(b.min.x>-12&&b.max.x<12,`${i}: x ${b.min.x}..${b.max.x}`);assert.ok(b.min.z>-12&&b.max.z<12);assert.ok(b.min.y>-1&&b.max.y<11);}
});
test('Os painéis solares são instanciados: 120 painéis exigem apenas dois lotes de desenho',()=>{
 const w=scene();w.setLab(3,{panels:120});const meshes=w.solarPanels.children;assert.equal(meshes.length,2);assert.ok(meshes.every(m=>m.isInstancedMesh));assert.ok(meshes.every(m=>m.count===120));w.setLab(3,{panels:0});assert.equal(w.solarPanels.children.length,0);
});
test('Ajustar os painéis preserva o prédio e os lotes de desenho existentes',()=>{
 const w=scene();w.setLab(3,{panels:40});const roof=w.lab.children.find(o=>o.isMesh&&o.geometry.type==='ExtrudeGeometry'&&o.position.y>2),panels=[...w.solarPanels.children];
 w.setLab(3,{panels:80});assert.ok(w.lab.children.includes(roof));assert.deepEqual(w.solarPanels.children,panels);assert.ok(panels.every(m=>m.count===80));
});
test('Adicionar contêineres preserva o terreno e reutiliza as construções',()=>{
 const w=scene();w.setLab(1,{slots:[]});const groups=w.containerGroups,terrain=w.lab.children[0];
 w.setLab(1,{slots:[0,1,4,5]});assert.equal(w.containerGroups,groups);assert.equal(w.lab.children[0],terrain);assert.equal(groups.filter(g=>g.visible).length,4);
});
