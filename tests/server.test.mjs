import test from'node:test';
import assert from'node:assert/strict';
import{handler}from'../scripts/serve.mjs';
async function request(url,method='GET'){
 const result={status:0,headers:{},body:null};await handler({url,method},{writeHead(status,headers={}){result.status=status;result.headers=headers;},end(body){result.body=body;}});return result;
}
test('O comando local pode servir a página principal, não apenas o deployment',async()=>{
 const r=await request('/');assert.equal(r.status,200);assert.equal(r.headers['Content-Type'],'text/html; charset=utf-8');assert.ok(r.body.toString().includes('Math City'));assert.ok(r.body.toString().includes('./js/app.js'));
});
test('Módulos, fonte e brasão são servidos com os tipos corretos',async()=>{
 for(const [path,type]of[['/js/app.js','text/javascript; charset=utf-8'],['/fonts/roboto-regular.woff2','font/woff2'],['/crest.svg','image/svg+xml']]){const r=await request(path);assert.equal(r.status,200);assert.equal(r.headers['Content-Type'],type);assert.ok(r.body.length>0);}
});
test('Arquivos inexistentes e caminhos fora da pasta pública não são expostos',async()=>{
 assert.equal((await request('/arquivo-inexistente')).status,404);assert.equal((await request('/%2e%2e%2fpackage.json')).status,403);assert.equal((await request('/%00')).status,404);
});
test('HEAD mantém os metadados sem transferir conteúdo',async()=>{
 const r=await request('/','HEAD');assert.equal(r.status,200);assert.equal(r.body,undefined);
});
