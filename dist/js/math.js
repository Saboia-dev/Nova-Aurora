export const PI=3.14;
export const levels=[
  {id:0,name:'Jardim das Águas',short:'Água',icon:'water',color:'#8bc7d4',topic:'Cilindros e volume',subtitle:'Cada gota conta.',story:'Os reservatórios de Nova Aurora já não acompanham o crescimento da cidade. Projete uma nova torre de água para devolver tranquilidade ao Jardim Central.',objective:'Construa um reservatório que armazene de 500.000 a 600.000 litros e respeite os limites do terreno.',impact:'Água nas casas, vida no bairro.',district:'Jardim Central',default:{r:3,h:6,volume:''},facts:[['Demanda diária','500.000 L'],['Terreno','20 × 15 m'],['Altura máxima','10 m'],['Ocupação máxima','70% do terreno']],hints:['A base do cilindro é um círculo: A = π × r². O diâmetro vale duas vezes o raio.','Multiplique a área da base pela altura. Cada 1 m³ corresponde a 1.000 litros.','Um raio de 4 m e uma altura de 10 m atendem à demanda. Calcule 3,14 × 4² × 10 × 1.000.'],formulas:[['Área da base','A = πr²'],['Volume','V = πr²h'],['Conversão','1 m³ = 1.000 L']]},
  {id:1,name:'Estação Circular',short:'Resíduos',icon:'recycle',color:'#abd3a1',topic:'Paralelepípedos e ocupação',subtitle:'Nada se perde. Tudo se transforma.',story:'A coleta seletiva está sobrecarregada. Organize os contêineres da Estação Circular sem tomar todo o espaço do bairro.',objective:'Distribua contêineres para receber 36 m³ de resíduos. Deixe pelo menos metade do terreno livre.',impact:'Ruas limpas, recursos reaproveitados.',district:'Vila das Flores',default:{slots:[],volume:''},facts:[['Cada contêiner','3 × 2 × 1,5 m'],['Terreno','12 × 6 m'],['Resíduos por dia','36 m³'],['Área livre mínima','50%']],hints:['O volume de uma caixa é comprimento × largura × altura. Calcule o volume de um contêiner.','Cada contêiner armazena 9 m³ e ocupa 6 m². O terreno tem 72 m².','Quatro contêineres armazenam 36 m³ e ocupam 24 m². Os espaços marcados preservam a passagem central.'],formulas:[['Volume de uma caixa','V = c × l × h'],['Ocupação','A = n × c × l'],['Área livre','A livre = A terreno − A ocupada']]},
  {id:2,name:'Parque dos Encontros',short:'Praça',icon:'leaf',color:'#e2c388',topic:'Áreas, recuos e prismas',subtitle:'Uma cidade feita para as pessoas.',story:'Vila Nova precisa de um centro comunitário e de um lugar para respirar. Combine um edifício com um jardim generoso, mantendo o acesso à rua.',objective:'Posicione o centro com recuos de 5 m, plante pelo menos 800 m² de jardim e mantenha a faixa de acesso livre.',impact:'Mais espaço para viver e conviver.',district:'Vila Nova',default:{bx:0,by:0,green:[],area:'',volume:''},facts:[['Terreno','50 × 30 m'],['Edifício','20 × 15 × 12 m'],['Cada quadrado','5 × 5 m'],['Jardim mínimo','800 m²']],hints:['O edifício ocupa quatro colunas e três linhas. Deixe um quadrado de distância dos limites. A última linha é a via de acesso.','Cada quadrado verde corresponde a 25 m². Você precisa de pelo menos 32 quadrados verdes.','Posicione o canto do edifício na segunda coluna e segunda linha. A base tem 20 × 15 m e o volume é essa área multiplicada por 12 m.'],formulas:[['Área do retângulo','A = b × h'],['Jardim','A = quadrados × 25'],['Volume do edifício','V = A base × altura']]},
  {id:3,name:'Colina Solar',short:'Energia',icon:'solar',color:'#edbd8b',topic:'Pitágoras e área de telhados',subtitle:'O futuro vem do sol.',story:'O centro de inovação quer produzir a própria energia. Use a geometria do telhado para descobrir quantos painéis cabem e abastecer o prédio.',objective:'Calcule a inclinação e a área do telhado. Instale painéis suficientes para 32 kW, ocupando até 70% da cobertura.',impact:'Energia limpa para novas ideias.',district:'Colina do Sol',default:{panels:40,slope:'',area:''},facts:[['Telhado','12 m de largura × 20 m'],['Altura do telhado','4,5 m'],['Cada painel','2 m² • 400 W'],['Cobertura utilizável','70%']],hints:['Corte o telhado ao meio: aparece um triângulo retângulo com catetos 6 m e 4,5 m.','Use g² = 6² + 4,5². São duas faces retangulares de 20 m × g.','A geratriz é 7,5 m. As duas águas somam 300 m²; 70% são 210 m². Entre 80 e 105 painéis atendem às regras.'],formulas:[['Geratriz','g = √((b/2)² + h²)'],['Duas águas','A = 2 × g × comprimento'],['Energia nominal','P = painéis × 400 W']]},
  {id:4,name:'Ponte Aurora',short:'Conexão',icon:'bridge',color:'#b7bdde',topic:'Triângulos e prisma triangular',subtitle:'Conecte o que a cidade tem de melhor.',story:'Os bairros ficaram separados pelo rio. Complete a estrutura geométrica da Ponte Aurora e conecte todas as soluções que você construiu.',objective:'Escolha as duas diagonais, calcule a área da seção triangular e o volume do prisma de referência.',impact:'Cinco bairros. Uma nova cidade.',district:'Margens do Aurora',default:{left:0,right:0,area:'',volume:''},facts:[['Base do triângulo','12 m'],['Altura central','8 m'],['Largura do prisma','5 m'],['Meia base','6 m']],hints:['Cada diagonal é a hipotenusa de um triângulo retângulo com catetos 6 m e 8 m.','A área de um triângulo é base × altura ÷ 2. Multiplique essa seção pela largura de 5 m para achar o volume.','As diagonais medem √(36 + 64) = 10 m. A seção mede 48 m² e o prisma, 240 m³.'],formulas:[['Diagonal','d = √(6² + 8²)'],['Seção triangular','A = base × altura ÷ 2'],['Prisma triangular','V = A seção × largura']]}
];
export function number(v){
  if(typeof v==='number') return Number.isFinite(v)?v:NaN;
  let s=String(v??'').trim().replace(/\s/g,'');
  if(!s||!/^[+-]?[\d.,]+$/.test(s))return NaN;
  if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
  else if(/^\d{1,3}(\.\d{3}){2,}$/.test(s)||/^\d{1,3}\.\d{3}$/.test(s))s=s.replace(/\./g,'');
  const n=Number(s);return Number.isFinite(n)?n:NaN;
}
export const close=(a,b,tolerance=.1)=>Number.isFinite(number(a))&&Math.abs(number(a)-b)<=tolerance;
export const fmt=(n,d=0)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
export function occupied(bx,by){const set=new Set();for(let y=by;y<by+3;y++)for(let x=bx;x<bx+4;x++)set.add(y*10+x);return set;}
export function calculate(id,v){
 if(id===0){const area=PI*v.r*v.r;return{area,volume:area*v.h,liters:area*v.h*1000,occupation:area/300*100,diameter:2*v.r};}
 if(id===1){const count=new Set((v.slots||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<8)).size;return{count,volume:count*9,area:count*6,free:72-count*6,occupation:count*6/72*100};}
 if(id===2){const block=occupied(v.bx,v.by),green=new Set((v.green||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<50&&!block.has(n)));return{area:300,volume:3600,green:green.size*25,greenCount:green.size,setback:Math.min(v.bx,10-v.bx-4,v.by,6-v.by-3)*5,validPosition:v.bx>=1&&v.bx<=5&&v.by>=1&&v.by<=2};}
 if(id===3)return{slope:7.5,area:300,usable:210,panels:v.panels,occupation:v.panels*2/300*100,power:v.panels*.4};
 return{diagonal:10,area:48,volume:240,left:v.left,right:v.right};
}
export function validate(id,v){
 const m=calculate(id,v),checks=[];
 const add=(ok,title,message)=>checks.push({ok:!!ok,title,message});
 if(id===0){
  add(Number.isFinite(v.r)&&v.r>=2&&v.r<=6&&Number.isFinite(v.h)&&v.h>=2&&v.h<=10,'Altura e terreno','O raio deve estar entre 2 e 6 m e a altura entre 2 e 10 m.');
  add(m.diameter<=15&&m.occupation<=70,'Ocupação do terreno',`A base ocupa ${fmt(m.area,2)} m² (${fmt(m.occupation,1)}% de 300 m²). O diâmetro deve caber nos 15 m do lado menor.`);
  add(m.liters>=500000-.001&&m.liters<=600000+.001,'Capacidade adequada',`Este projeto armazena ${fmt(m.liters,0)} L. A meta é entre 500.000 e 600.000 L.`);
  add(close(v.volume,m.liters,1),'Cálculo do volume',`V = 3,14 × ${fmt(v.r,1)}² × ${fmt(v.h,1)} × 1.000 = ${fmt(m.liters,0)} L. Tolerância: 1 L.`);
 }
 if(id===1){
  add(v.slots.length===m.count&&m.count>=1,'Posições válidas','Use apenas os oito espaços demarcados e mantenha a passagem central livre.');
  add(m.volume>=36,'Capacidade de coleta',`${m.count} contêineres × 9 m³ = ${fmt(m.volume)} m³. O bairro precisa de 36 m³.`);
  add(m.occupation<=50,'Espaço livre',`${fmt(m.area)} m² ocupados em 72 m² (${fmt(m.occupation,1)}%). Preserve pelo menos 36 m² livres.`);
  add(close(v.volume,m.volume,.1),'Cálculo da capacidade',`Cada contêiner tem 3 × 2 × 1,5 = 9 m³. Total: ${m.count} × 9 = ${fmt(m.volume)} m³.`);
 }
 if(id===2){
  add(m.validPosition&&Number.isInteger(v.bx)&&Number.isInteger(v.by),'Recuos do edifício','Deixe um quadrado de 5 m livre em todos os limites. O canto superior esquerdo pode ficar nas colunas 2 a 6 e linhas 2 ou 3.');
  add(m.green>=800,'Área verde',`${m.greenCount} quadrados × 25 m² = ${fmt(m.green)} m² de jardim. A meta é 800 m².`);
  add(close(v.area,300,.1),'Área da base','A base do edifício mede 20 × 15 = 300 m².');
  add(close(v.volume,3600,1),'Volume do edifício','V = 20 × 15 × 12 = 3.600 m³.');
 }
 if(id===3){
  add(close(v.slope,7.5,.05),'Geratriz do telhado','g = √(6² + 4,5²) = √56,25 = 7,5 m.');
  add(close(v.area,300,.1),'Área das duas águas','A = 2 × 20 × 7,5 = 300 m².');
  add(Number.isInteger(v.panels)&&v.panels>=80,'Potência nominal',`${v.panels} painéis × 400 W = ${fmt(m.power,1)} kW. A meta é 32 kW.`);
  add(v.panels<=105,'Limite de cobertura',`${v.panels} painéis × 2 m² = ${fmt(v.panels*2)} m². O limite é 70% de 300 m² = 210 m².`);
 }
 if(id===4){
  add(v.left===10&&v.right===10,'Diagonais da estrutura','As duas diagonais medem √(6² + 8²) = 10 m.');
  add(close(v.area,48,.1),'Área da seção','A = 12 × 8 ÷ 2 = 48 m².');
  add(close(v.volume,240,.1),'Volume do prisma','V = 48 × 5 = 240 m³.');
 }
 return{ok:checks.every(c=>c.ok),checks,metrics:m};
}
export function starsFor(attempts,hints){return Math.max(1,3-(attempts>2?1:0)-(hints>=2?1:0));}
export const solution=[{r:4,h:10,volume:'502400'},{slots:[0,1,4,5],volume:'36'},{bx:1,by:1,green:[...Array(50).keys()].filter(n=>!occupied(1,1).has(n)),area:'300',volume:'3600'},{panels:80,slope:'7,5',area:'300'},{left:10,right:10,area:'48',volume:'240'}];
