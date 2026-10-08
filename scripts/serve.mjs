import{createServer}from'node:http';
import{readFile,stat}from'node:fs/promises';
import{resolve,extname,sep}from'node:path';
import{fileURLToPath}from'node:url';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const arg=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;};
const port=Number(arg('--port')||process.env.PORT||8080),host=arg('--host')||process.env.HOST||'0.0.0.0';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain; charset=utf-8'};
export async function handler(req,res){
 try{
  const url=new URL(req.url,'http://localhost');let path=decodeURIComponent(url.pathname);if(path==='/')path='/index.html';
  let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Acesso não permitido.');return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Arquivo não encontrado.');}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createServer(handler).listen(port,host,()=>console.log(`Nova Aurora disponível em http://localhost:${port}`));
