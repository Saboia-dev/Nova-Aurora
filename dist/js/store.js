import{levels,starsFor}from'./math.js';
const KEY='nova-aurora:v1';
const fresh=()=>({version:1,active:null,settings:{quality:'auto',sound:false,motion:true},players:[]});
export function sanitize(raw){
 const s=fresh();if(!raw||raw.version!==1)return s;
 if(raw.settings&&typeof raw.settings==='object')s.settings={quality:['auto','high','low'].includes(raw.settings.quality)?raw.settings.quality:'auto',sound:raw.settings.sound===true,motion:raw.settings.motion!==false};
 s.players=(Array.isArray(raw.players)?raw.players:[]).slice(0,12).filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').map(p=>({id:p.id,name:p.name.slice(0,28),created:p.created||new Date().toISOString(),tutorial:p.tutorial===true,missions:levels.map((l,i)=>{const m=p.missions?.[i];return{complete:m?.complete===true,stars:[1,2,3].includes(m?.stars)?m.stars:0,hints:Math.max(0,Math.min(3,Number(m?.hints)||0)),seconds:Math.max(0,Number(m?.seconds)||0),draft:m?.draft&&typeof m.draft==='object'?m.draft:null,attempts:(Array.isArray(m?.attempts)?m.attempts:[]).slice(-100).filter(a=>a&&typeof a.ok==='boolean').map(a=>({at:a.at,ok:a.ok,answers:a.answers||{},metrics:a.metrics||{},checks:Array.isArray(a.checks)?a.checks:[]})),completedAt:m?.completedAt||null};})}));
 // Completion is sequential: a corrupted local record cannot skip a district.
 let unlocked=true;for(const p of s.players){unlocked=true;for(const m of p.missions){if(!unlocked){m.complete=false;m.stars=0;}if(!m.complete)unlocked=false;}}
 s.active=s.players.some(p=>p.id===raw.active)?raw.active:null;return s;
}
export class GameStore{
 constructor(storage){this.available=true;try{this.storage=storage??globalThis.localStorage;this.data=sanitize(JSON.parse(this.storage.getItem(KEY)||'null'));}catch{this.data=fresh();this.available=false;}}
 save(){try{this.storage.setItem(KEY,JSON.stringify(this.data));this.available=true;}catch{this.available=false;}return this.available;}
 get player(){return this.data.players.find(p=>p.id===this.data.active)||null;}
 create(name){name=String(name).trim().slice(0,28);if(!name)throw Error('Digite o nome do explorador.');if(this.data.players.length>=12)throw Error('Este navegador já tem 12 exploradores. Continue com um deles.');const id=globalThis.crypto?.randomUUID?.()||`p-${Date.now()}-${Math.random().toString(36).slice(2)}`;const p={id,name,created:new Date().toISOString(),tutorial:false,missions:levels.map(()=>({complete:false,stars:0,hints:0,seconds:0,draft:null,attempts:[],completedAt:null}))};this.data.players.push(p);this.data.active=id;this.save();return p;}
 select(id){if(!this.data.players.some(p=>p.id===id))return false;this.data.active=id;this.save();return true;}
 get completed(){return this.player?.missions.filter(m=>m.complete).length||0;}
 get xp(){return this.player?.missions.reduce((n,m)=>n+(m.complete?100+m.stars*25:0),0)||0;}
 unlocked(id){return id===0||this.player?.missions[id-1]?.complete===true;}
 draft(id,v){if(!this.player)return;this.player.missions[id].draft=structuredClone(v);this.save();}
 hint(id){const m=this.player.missions[id];m.hints=Math.min(3,m.hints+1);this.save();return m.hints;}
 seconds(id,n){const m=this.player?.missions[id];if(m){m.seconds+=Math.max(0,n);this.save();}}
 attempt(id,answers,result){if(!this.player||!this.unlocked(id))throw Error('Conclua o distrito anterior primeiro.');const m=this.player.missions[id];const a={at:new Date().toISOString(),ok:result.ok,answers:structuredClone(answers),metrics:result.metrics,checks:result.checks};m.attempts.push(a);m.attempts=m.attempts.slice(-100);if(result.ok){m.complete=true;m.completedAt||=a.at;m.stars=Math.max(m.stars,starsFor(m.attempts.length,m.hints));}this.draft(id,answers);return m;}
 resetPlayer(){if(!this.player)return;this.player.missions=levels.map(()=>({complete:false,stars:0,hints:0,seconds:0,draft:null,attempts:[],completedAt:null}));this.player.tutorial=false;this.save();}
 export(){return JSON.stringify({game:'Nova Aurora',version:1,exportedAt:new Date().toISOString(),player:this.player},null,2);}
}
