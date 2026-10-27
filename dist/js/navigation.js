const routes = {inicio:'home',missao:'intro',tutorial:'tutorial',cidade:'map',conquista:'final',professor:'teacher'};
export function readRoute(hash) {
 const key=String(hash||'').replace(/^#/,''),match=key.match(/^fase-([1-5])$/);
 return match?{screen:'mission',phase:Number(match[1])-1}:{screen:routes[key]||'home'};
}
export function routeHash(screen,phase=0) {
 return '#'+(screen==='mission'?`fase-${phase+1}`:Object.keys(routes).find(k=>routes[k]===screen)||'inicio');
}
export function safePhase(value,fallback=0) {
 const n=Number(value);return Number.isInteger(n)&&n>=0&&n<5?n:fallback;
}
export function sceneSignature(id,v={}) {
 const fields=[['r','h'],['slots'],['bx','by','green'],['panels'],['left','right']][id]||[];
 return JSON.stringify(fields.map(k=>Array.isArray(v[k])?[...v[k]].sort((a,b)=>a-b):v[k]));
}
