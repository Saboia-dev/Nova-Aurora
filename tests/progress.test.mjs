import test from'node:test';
import assert from'node:assert/strict';
import{GameStore,sanitize}from'../dist/js/store.js';
import{levels,solution,validate}from'../dist/js/math.js';
const memory=()=>{const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};

test('A jornada inteira desbloqueia em sequência, persiste e exporta as tentativas',()=>{
 const storage=memory(),store=new GameStore(storage);store.create('Equipe Aurora');assert.equal(store.completed,0);assert.equal(store.unlocked(0),true);assert.equal(store.unlocked(1),false);
 for(let id=0;id<5;id++){
  assert.equal(store.unlocked(id),true);const v=structuredClone(solution[id]);store.draft(id,v);store.seconds(id,42);store.attempt(id,v,validate(id,v));assert.equal(store.completed,id+1);
 }
 assert.equal(store.xp,875);assert.equal(store.player.missions.reduce((s,m)=>s+m.stars,0),15);
 const reload=new GameStore(storage);assert.equal(reload.completed,5);assert.equal(reload.player.name,'Equipe Aurora');assert.equal(reload.player.missions[0].seconds,42);assert.equal(reload.xp,875);
 const report=JSON.parse(reload.export());assert.equal(report.player.missions.length,5);assert.equal(report.player.missions[4].attempts[0].ok,true);assert.equal(report.player.missions[4].attempts[0].metrics.volume,240);
});
test('Erros, dicas e tentativas não desbloqueiam o próximo distrito',()=>{
 const store=new GameStore(memory());store.create('Ana');const bad=structuredClone(levels[0].default);store.attempt(0,bad,validate(0,bad));store.hint(0);store.hint(0);assert.equal(store.completed,0);assert.equal(store.xp,0);assert.equal(store.unlocked(1),false);
 assert.throws(()=>store.attempt(1,solution[1],validate(1,solution[1])));
 store.attempt(0,solution[0],validate(0,solution[0]));assert.equal(store.player.missions[0].stars,2);assert.equal(store.xp,150);assert.equal(store.unlocked(1),true);
});
test('Revisitar uma missão não duplica experiência',()=>{
 const store=new GameStore(memory());store.create('João');for(let i=0;i<3;i++)store.attempt(0,solution[0],validate(0,solution[0]));assert.equal(store.xp,175);assert.equal(store.completed,1);assert.equal(store.player.missions[0].attempts.length,3);assert.equal(store.player.missions[0].stars,3);
});
test('Exploradores possuem projetos e históricos independentes',()=>{
 const store=new GameStore(memory());const a=store.create('A');store.attempt(0,solution[0],validate(0,solution[0]));const b=store.create('B');assert.equal(store.completed,0);assert.equal(store.xp,0);store.select(a.id);assert.equal(store.completed,1);store.select(b.id);assert.equal(store.completed,0);
});
test('Reiniciar apaga apenas o explorador atual',()=>{
 const store=new GameStore(memory());const a=store.create('A');store.attempt(0,solution[0],validate(0,solution[0]));store.create('B');store.attempt(0,solution[0],validate(0,solution[0]));store.resetPlayer();assert.equal(store.completed,0);store.select(a.id);assert.equal(store.completed,1);
});
test('Armazenamento bloqueado não impede a partida em memória',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},store=new GameStore(storage);store.create('Luísa');store.attempt(0,solution[0],validate(0,solution[0]));assert.equal(store.available,false);assert.equal(store.completed,1);assert.equal(JSON.parse(store.export()).player.name,'Luísa');
});
test('Registros locais incompletos não corrompem a sequência',()=>{
 const raw={version:1,active:'a',players:[{id:'a',name:'Equipe',missions:[{complete:false},{complete:true,stars:3}]}],settings:{quality:'impossible',sound:false}};
 const s=sanitize(raw);assert.equal(s.players[0].missions[1].complete,false);assert.equal(s.players[0].missions[1].stars,0);assert.equal(s.players[0].missions.length,5);assert.equal(s.settings.quality,'auto');assert.equal(s.active,'a');
});
