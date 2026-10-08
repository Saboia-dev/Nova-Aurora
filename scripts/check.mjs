import{readFile,readdir,stat}from'node:fs/promises';
import{resolve,extname}from'node:path';
import{fileURLToPath}from'node:url';
import{spawnSync}from'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
async function walk(dir){const result=[];for(const name of await readdir(dir)){const p=resolve(dir,name);if((await stat(p)).isDirectory())result.push(...await walk(p));else result.push(p);}return result;}
const files=await walk(dist);let refs=0;
const scenes=['city','city-left','city-right','city-restored','city-restored-left','city-restored-right','tutorial',...Array.from({length:5},(_,i)=>`lab-${i}`)];
for(const scene of scenes){const bytes=await readFile(resolve(dist,'scenes',`${scene}.webp`));if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error(`Imagem de apoio inválida: ${scene}`);refs++;}
for(const file of files){
 if(!['.js','.html','.css'].includes(extname(file)))continue;
 const text=await readFile(file,'utf8');
 if(extname(file)==='.js'){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
 const patterns=extname(file)==='.html'?/(?:src|href)="(\.\/[^"#]+)"/g:extname(file)==='.css'?/url\(['"]?(\.\/[^)'"\s]+)['"]?\)/g:/(?:from\s*|import\s*\()['"](\.\.?\/[^'"]+)['"]/g;
 for(const m of text.matchAll(patterns)){await stat(resolve(file,'..',m[1]));refs++;}
}
if(!(await readFile(resolve(dist,'index.html'),'utf8')).includes('lang="pt-BR"'))throw Error('Idioma incorreto.');
console.log(`Verificado: ${files.length} arquivos, ${refs} referências locais e sintaxe JavaScript. Site estático pronto.`);
