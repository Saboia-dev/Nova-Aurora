import test from'node:test';
import assert from'node:assert/strict';
import{calculate,validate,number,occupied,solution,levels}from'../dist/js/math.js';

test('Os cinco projetos de referência resolvem a sequência',()=>{
 for(let id=0;id<5;id++){const result=validate(id,structuredClone(solution[id]));assert.equal(result.ok,true,`${levels[id].name}: ${JSON.stringify(result.checks)}`);}
});
test('O reservatório reproduz o protótipo: diâmetro 8 m, altura 10 m, 502.400 L',()=>{
 const result=calculate(0,{r:4,h:10});assert.ok(Math.abs(result.volume-502.4)<1e-9);assert.ok(Math.abs(result.liters-502400)<1e-7);assert.equal(result.diameter,8);assert.ok(Math.abs(result.area-50.24)<1e-9);assert.ok(Math.abs(result.occupation-16.746666666666666)<1e-9);
});
test('Capacidade insuficiente, excesso, altura proibida e usar diâmetro como raio são rejeitados',()=>{
 for(const [r,h]of[[3,6],[6,10],[4,11],[8,10]]){const v={r,h,volume:String(calculate(0,{r,h}).liters)};assert.equal(validate(0,v).ok,false,`${r} × ${h}`);}
});
test('O desenho válido não aprova um cálculo incorreto nem uma resposta vazia',()=>{
 for(let id=0;id<5;id++){const wrong={...structuredClone(solution[id]),volume:'123',area:'123',slope:'123'};assert.equal(validate(id,wrong).ok,false);assert.equal(validate(id,{...structuredClone(solution[id]),volume:'',area:'',slope:''}).ok,false);}
});
test('Há diferentes soluções válidas para a água; o jogo não exige decorar um único desenho',()=>{
 let found=0;for(let r=2;r<=6;r+=.5)for(let h=2;h<=10;h+=.5){const volume=3.14*r*r*h*1000;if(volume>=500000&&volume<=600000){assert.equal(validate(0,{r,h,volume:String(volume)}).ok,true);found++;}}
 assert.ok(found>=5);
});
test('Quatro contêineres atendem 36 m³; seis são o máximo; sete excedem a ocupação',()=>{
 for(const n of[4,5,6])assert.equal(validate(1,{slots:[...Array(n).keys()],volume:String(n*9)}).ok,true);
 assert.equal(validate(1,{slots:[0,1,2,3,4,5,6],volume:'63'}).ok,false);
 assert.equal(validate(1,{slots:[0,1,2],volume:'27'}).ok,false);
 assert.equal(validate(1,{slots:[0,0,1,2,3],volume:'36'}).ok,false);
 assert.equal(validate(1,{slots:[0,1,2,8],volume:'36'}).ok,false);
});
test('A via de acesso e o edifício não contam como área de jardim',()=>{
 const all=[...Array(60).keys()];const result=calculate(2,{bx:1,by:1,green:all});assert.equal(result.greenCount,38);assert.equal(result.green,950);assert.equal(result.area,300);assert.equal(result.volume,3600);assert.equal(result.setback,5);
 assert.equal(validate(2,{bx:1,by:1,green:all,area:'300',volume:'3600'}).ok,true);
});
test('Recuos e jardim são exigências independentes',()=>{
 const v=structuredClone(solution[2]);assert.equal(validate(2,{...v,bx:0}).ok,false);assert.equal(validate(2,{...v,by:0}).ok,false);assert.equal(validate(2,{...v,bx:6}).ok,false);assert.equal(validate(2,{...v,bx:1.5}).ok,false);
 const green=[...Array(50).keys()].filter(n=>!occupied(1,1).has(n));assert.equal(validate(2,{...v,green:green.slice(0,31)}).ok,false);assert.equal(validate(2,{...v,green:green.slice(0,32)}).ok,true);
});
test('Energia: geratriz 7,5 m, área 300 m², limite de 105 painéis e mínimo de 80',()=>{
 const valid={slope:'7,5',area:'300'};assert.equal(Math.hypot(6,4.5),7.5);
 for(const n of[80,93,105])assert.equal(validate(3,{...valid,panels:n}).ok,true);
 for(const n of[0,79,106,120,80.5])assert.equal(validate(3,{...valid,panels:n}).ok,false);
 assert.equal(calculate(3,{panels:80}).power,32);
});
test('Ponte: diagonais de 10 m, seção de 48 m² e prisma de 240 m³',()=>{
 assert.equal(Math.hypot(6,8),10);assert.equal(12*8/2,48);assert.equal(48*5,240);
 assert.equal(validate(4,{left:10,right:12,area:'48',volume:'240'}).ok,false);
 assert.equal(validate(4,{left:0,right:10,area:'48',volume:'240'}).ok,false);
 assert.equal(validate(4,{left:10,right:10,area:'96',volume:'480'}).ok,false);
});
test('Respostas em português aceitam milhar e decimais, mas não texto nem infinitos',()=>{
 assert.equal(number('502.400'),502400);assert.equal(number('502400'),502400);assert.equal(number(' 7,5 '),7.5);assert.equal(number('7.5'),7.5);assert.equal(number('3.600,0'),3600);
 for(const v of['','abc','7,5 m','Infinity','1e9','<script>','1,2,3',NaN,Infinity])assert.ok(Number.isNaN(number(v)));
});
